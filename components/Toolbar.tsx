
import React from 'react';
import { MousePointer2, Ruler, Maximize, Trash2, Download, Layers, Palette } from 'lucide-react';
import { Tool, Unit } from '../types';

interface ToolbarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  unitMode: Unit;
  onUnitToggle: () => void;
  onClear: () => void;
  onExport: () => void;
  activeColor: string;
  onColorChange: (color: string) => void;
}

const COLORS = [
  { name: '靛蓝', value: '#6366f1' },
  { name: '绯红', value: '#f43f5e' },
  { name: '翡翠', value: '#10b981' },
  { name: '琥珀', value: '#f59e0b' },
  { name: '紫色', value: '#a855f7' },
];

const Toolbar: React.FC<ToolbarProps> = ({ 
  activeTool, 
  onToolChange, 
  unitMode, 
  onUnitToggle, 
  onClear,
  onExport,
  activeColor,
  onColorChange
}) => {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/95 backdrop-blur shadow-2xl px-6 py-3 rounded-2xl border border-gray-200 z-50">
      {/* 工具选择 */}
      <div className="flex items-center gap-1 pr-4 border-r border-gray-200">
        <button
          onClick={() => onToolChange(Tool.LINE)}
          className={`p-3 rounded-xl transition-all flex flex-col items-center gap-1 ${
            activeTool === Tool.LINE ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-gray-100 text-gray-600'
          }`}
          title="画线测量"
        >
          <Ruler size={20} />
          <span className="text-[10px] font-bold">画线</span>
        </button>
        <button
          onClick={() => onToolChange(Tool.CALIBRATE)}
          className={`p-3 rounded-xl transition-all flex flex-col items-center gap-1 ${
            activeTool === Tool.CALIBRATE ? 'bg-red-600 text-white shadow-lg' : 'hover:bg-gray-100 text-gray-600'
          }`}
          title="校准比例尺"
        >
          <Maximize size={20} />
          <span className="text-[10px] font-bold">校准</span>
        </button>
      </div>

      {/* 颜色选择 */}
      <div className="flex items-center gap-2 px-4 border-r border-gray-200">
        <div className="flex gap-1.5">
          {COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => onColorChange(c.value)}
              className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                activeColor === c.value ? 'border-gray-400 scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: c.value }}
              title={c.name}
            />
          ))}
        </div>
      </div>

      {/* 单位切换 */}
      <div className="flex items-center gap-2 px-4 border-r border-gray-200">
        <button
          onClick={onUnitToggle}
          className="flex flex-col items-center gap-1 p-2 hover:bg-gray-100 rounded-xl transition-colors text-indigo-600"
        >
          <Layers size={20} />
          <span className="text-[10px] font-bold">
            {unitMode === Unit.BOTH ? '双单位' : unitMode === Unit.CM ? '厘米' : '英寸'}
          </span>
        </button>
      </div>

      {/* 功能操作 */}
      <div className="flex items-center gap-1 pl-2">
        <button
          onClick={onExport}
          className="p-3 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
          title="导出图片"
        >
          <Download size={20} />
        </button>
        <button
          onClick={onClear}
          className="p-3 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          title="清空标记"
        >
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
