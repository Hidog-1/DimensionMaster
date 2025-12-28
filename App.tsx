
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Tool, Unit, Point, MeasurementLine, Calibration } from './types';
import { calculateDistance, cmToInch, formatValue } from './utils/math';
import { analyzeProductImage } from './services/geminiService';
import Toolbar from './components/Toolbar';
import Sidebar from './components/Sidebar';
import { Upload, Camera, Move } from 'lucide-react';

const App: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>(Tool.LINE);
  const [unitMode, setUnitMode] = useState<Unit>(Unit.BOTH);
  const [measurements, setMeasurements] = useState<MeasurementLine[]>([]);
  const [calibration, setCalibration] = useState<Calibration>({ pixels: 100, cm: 10 });
  const [drawingLine, setDrawingLine] = useState<{ start: Point; end: Point } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [activeColor, setActiveColor] = useState('#6366f1');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setMeasurements([]);
        setAnalysis(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);

    const drawMeasurement = (m: { start: Point, end: Point, lengthCm: number, color: string, label?: string }, isDraft = false) => {
      const { start, end, lengthCm, color, label } = m;
      
      ctx.beginPath();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = color;
      ctx.setLineDash(isDraft ? [6, 4] : []);
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      // 端点装饰
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      const capLen = 8;
      const drawCap = (p: Point, ang: number) => {
        ctx.moveTo(p.x + Math.cos(ang + Math.PI/2) * capLen, p.y + Math.sin(ang + Math.PI/2) * capLen);
        ctx.lineTo(p.x + Math.cos(ang - Math.PI/2) * capLen, p.y + Math.sin(ang - Math.PI/2) * capLen);
      };

      ctx.beginPath();
      ctx.setLineDash([]);
      drawCap(start, angle);
      drawCap(end, angle);
      ctx.stroke();

      // 绘制标签
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      
      const cmText = `${formatValue(lengthCm)} cm`;
      const inchText = `${formatValue(cmToInch(lengthCm))} in`;
      
      let displayText = '';
      if (label) displayText = `${label}: `;
      
      if (unitMode === Unit.BOTH) displayText += `${cmText} / ${inchText}`;
      else if (unitMode === Unit.CM) displayText += cmText;
      else displayText += inchText;

      ctx.font = 'bold 12px "Inter", "PingFang SC", sans-serif';
      const metrics = ctx.measureText(displayText);
      const padding = 6;
      
      // 标签背景
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.shadowColor = 'rgba(0,0,0,0.1)';
      ctx.shadowBlur = 4;
      ctx.fillRect(midX - metrics.width / 2 - padding, midY - 12, metrics.width + padding * 2, 24);
      ctx.shadowBlur = 0;
      
      // 标签文字
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(displayText, midX, midY);
    };

    measurements.forEach(m => drawMeasurement(m));
    
    if (drawingLine) {
      const pixels = calculateDistance(drawingLine.start, drawingLine.end);
      const length = (pixels / calibration.pixels) * calibration.cm;
      const color = activeTool === Tool.CALIBRATE ? '#ef4444' : activeColor;
      drawMeasurement({ ...drawingLine, lengthCm: length, color }, true);
    }
  }, [measurements, drawingLine, calibration, unitMode, activeTool, activeColor]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!image || activeTool === Tool.SELECT) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDrawingLine({ start: { x, y }, end: { x, y } });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!drawingLine) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDrawingLine(prev => prev ? { ...prev, end: { x, y } } : null);
  };

  const handleMouseUp = () => {
    if (!drawingLine) return;
    const dist = calculateDistance(drawingLine.start, drawingLine.end);
    if (dist < 5) {
      setDrawingLine(null);
      return;
    }

    if (activeTool === Tool.CALIBRATE) {
      setCalibration({ ...calibration, pixels: dist });
    } else {
      const lengthCm = (dist / calibration.pixels) * calibration.cm;
      const newMeasurement: MeasurementLine = {
        id: crypto.randomUUID(),
        start: drawingLine.start,
        end: drawingLine.end,
        lengthCm,
        color: activeColor,
        label: `尺寸 ${measurements.length + 1}`
      };
      setMeasurements([...measurements, newMeasurement]);
      // 自动滚动到侧边栏底部
      setTimeout(() => document.getElementById('scroll-anchor')?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
    setDrawingLine(null);
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `测量图_${new Date().getTime()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const handleAIAnalysis = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    const result = await analyzeProductImage(image);
    setAnalysis(result || "分析失败");
    setIsAnalyzing(false);
  };

  const handleUpdateMeasurement = (id: string, updates: Partial<MeasurementLine>) => {
    setMeasurements(measurements.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden text-gray-900">
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-20 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-indigo-100 shadow-lg">D</div>
            <div>
              <h1 className="font-bold text-lg leading-tight">尺寸管家 <span className="text-indigo-600 font-medium">Pro</span></h1>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Professional Dimensioning tool</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {!image ? (
              <label className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all shadow-md active:scale-95">
                <Upload size={18} />
                上传图片
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            ) : (
              <label className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer">
                <Camera size={18} />
                更换图片
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            )}
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-8 bg-[#f0f2f5] overflow-auto">
          {!image ? (
            <div className="text-center max-w-sm">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl text-indigo-500">
                <Upload size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">欢迎使用尺寸管家</h3>
              <p className="text-gray-500 text-sm mb-8 leading-relaxed">上传产品照片，即可快速标注尺寸、换算单位。支持 AI 智能识别测量建议。</p>
              <label className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-3.5 rounded-2xl font-bold cursor-pointer transition-all shadow-xl shadow-indigo-100 hover:-translate-y-1">
                开始标注
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            </div>
          ) : (
            <div className="relative shadow-2xl rounded-lg overflow-hidden bg-white group">
              <img
                ref={imageRef}
                src={image}
                alt="Product"
                className="hidden"
                onLoad={(e) => {
                  const img = e.currentTarget;
                  const canvas = canvasRef.current;
                  if (canvas) {
                    const maxW = window.innerWidth - 400;
                    const maxH = window.innerHeight - 200;
                    const ratio = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
                    canvas.width = img.naturalWidth * ratio;
                    canvas.height = img.naturalHeight * ratio;
                    draw();
                  }
                }}
              />
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="block canvas-container"
              />
              <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 pointer-events-none">
                <Move size={14} className="animate-pulse" />
                正在进行精确测量模式
              </div>
            </div>
          )}
        </main>

        {image && (
          <Toolbar 
            activeTool={activeTool} 
            onToolChange={setActiveTool}
            unitMode={unitMode}
            onUnitToggle={() => {
              if (unitMode === Unit.BOTH) setUnitMode(Unit.CM);
              else if (unitMode === Unit.CM) setUnitMode(Unit.INCH);
              else setUnitMode(Unit.BOTH);
            }}
            onClear={() => setMeasurements([])}
            onExport={handleExport}
            activeColor={activeColor}
            onColorChange={setActiveColor}
          />
        )}
      </div>

      <Sidebar 
        measurements={measurements}
        calibration={calibration}
        unitMode={unitMode}
        onDelete={(id) => setMeasurements(measurements.filter(m => m.id !== id))}
        onUpdate={handleUpdateMeasurement}
        onUpdateCalibration={(cm) => setCalibration({ ...calibration, cm })}
        analysis={analysis}
        onAnalyze={handleAIAnalysis}
        isAnalyzing={isAnalyzing}
      />
    </div>
  );
};

export default App;
