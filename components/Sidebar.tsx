
import React from 'react';
import { MeasurementLine, Calibration, Unit } from '../types';
import { formatValue, cmToInch, inchToCm } from '../utils/math';
import { Trash2, Settings2, Info, Sparkles, Tag } from 'lucide-react';

interface SidebarProps {
  measurements: MeasurementLine[];
  calibration: Calibration;
  unitMode: Unit;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<MeasurementLine>) => void;
  onUpdateCalibration: (cm: number) => void;
  analysis: string | null;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  measurements,
  calibration,
  unitMode,
  onDelete,
  onUpdate,
  onUpdateCalibration,
  analysis,
  onAnalyze,
  isAnalyzing
}) => {
  return (
    <div className="w-80 h-full bg-white border-l border-gray-200 flex flex-col shadow-xl z-10">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
        <h2 className="font-bold text-gray-800 flex items-center gap-2">
          <Settings2 size={18} />
          测量列表
        </h2>
        <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full font-medium">
          {measurements.length} 条记录
        </span>
      </div>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        {/* 校准部分 */}
        <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
          <label className="text-xs font-bold text-indigo-700 uppercase tracking-wider block mb-2">
            参考比例校准
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={calibration.cm}
              onChange={(e) => onUpdateCalibration(Number(e.target.value))}
              className="w-full px-2 py-1 text-sm border border-indigo-200 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <span className="text-sm font-medium text-indigo-700">厘米 (cm)</span>
          </div>
          <p className="text-[10px] text-indigo-500 mt-2 italic">
            当前基准: {calibration.pixels.toFixed(1)} 像素 = {calibration.cm} 厘米
          </p>
        </div>

        {/* AI 建议按钮 */}
        <button
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
        >
          <Sparkles size={16} />
          {isAnalyzing ? '智能分析中...' : 'AI 建议测量点'}
        </button>

        {analysis && (
          <div className="p-3 bg-purple-50 border border-purple-100 rounded-lg text-xs text-purple-800 leading-relaxed">
            <div className="font-bold mb-1 flex items-center gap-1">
              <Info size={14} /> AI 提示:
            </div>
            {analysis}
          </div>
        )}

        <div className="space-y-3 mt-4">
          {measurements.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p className="text-sm">暂无测量数据</p>
              <p className="text-xs mt-1">使用下方工具栏“画线”开始</p>
            </div>
          ) : (
            measurements.map((m) => (
              <div 
                key={m.id} 
                className="group p-3 border border-gray-100 rounded-xl hover:border-indigo-200 transition-all bg-white shadow-sm"
                style={{ borderLeft: `4px solid ${m.color}` }}
              >
                <div className="space-y-3">
                  {/* 标签行 */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <Tag size={12} className="text-gray-400" />
                      <input 
                        type="text"
                        placeholder="添加名称 (如: 宽度)"
                        value={m.label || ''}
                        onChange={(e) => onUpdate(m.id, { label: e.target.value })}
                        className="text-xs font-semibold text-gray-700 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-indigo-500 outline-none w-full py-0.5"
                      />
                    </div>
                    <button 
                      onClick={() => onDelete(m.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* 数值修改行 */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 uppercase font-bold">厘米 (cm)</label>
                      <input 
                        type="number"
                        step="0.1"
                        value={formatValue(m.lengthCm)}
                        onChange={(e) => onUpdate(m.id, { lengthCm: Number(e.target.value) })}
                        className="w-full text-sm font-mono font-bold text-indigo-600 bg-gray-50 border border-gray-100 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-300"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 uppercase font-bold">英寸 (in)</label>
                      <input 
                        type="number"
                        step="0.01"
                        value={formatValue(cmToInch(m.lengthCm))}
                        onChange={(e) => onUpdate(m.id, { lengthCm: inchToCm(Number(e.target.value)) })}
                        className="w-full text-sm font-mono font-bold text-emerald-600 bg-gray-50 border border-gray-100 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-emerald-300"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          <div id="scroll-anchor" />
        </div>
      </div>

      <div className="p-4 border-t border-gray-100 bg-gray-50 text-[10px] text-gray-400 text-center uppercase tracking-widest">
        DimensionMaster Pro 中文增强版
      </div>
    </div>
  );
};

export default Sidebar;
