/**
 * MaterialStats component - Color usage statistics with enhanced export buttons
 * Mobile-optimized: export buttons are always visible and prominently styled
 */

import type { ProcessResult } from '../engine/types';
import { FileImage, FileSpreadsheet } from 'lucide-react';
import { exportToPNG, exportToExcel, downloadBlob } from '../engine/export';

interface MaterialStatsProps {
  result: ProcessResult | null;
}

export default function MaterialStats({ result }: MaterialStatsProps) {
  if (!result) {
    return (
      <div className="bg-white rounded-2xl border border-[#E8E8E8]/80 shadow-sm shadow-black/[0.02] p-4">
        <h3 className="text-sm font-semibold text-[#2D3436] mb-3">材料统计</h3>
        <div className="text-center py-8 text-[#8A8D91] text-sm">暂无数据</div>
      </div>
    );
  }

  const { colorMap, stats } = result;
  const sortedStats = [...stats].sort((a, b) => b.count - a.count);
  const totalBeads = sortedStats.reduce((sum, s) => sum + s.count, 0);

  const handleExportPNG = () => {
    try {
      const blob = exportToPNG(result, { cellSize: 40, showGrid: true, showLabels: true });
      const brandName = result.colorMap[0]?.brand || 'pattern';
      downloadBlob(blob, `bead-pattern-${brandName}-${result.width}x${result.height}.png`);
    } catch (err) {
      console.error('PNG export failed:', err);
      alert('导出PNG失败');
    }
  };

  const handleExportExcel = () => {
    try {
      const blob = exportToExcel(result);
      const brandName = result.colorMap[0]?.brand || 'pattern';
      downloadBlob(blob, `bead-pattern-${brandName}-${result.width}x${result.height}.xlsx`);
    } catch (err) {
      console.error('Excel export failed:', err);
      alert('导出Excel失败');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E8E8E8]/80 shadow-sm shadow-black/[0.02] p-4 hover:shadow-md transition-shadow duration-200">
      <h3 className="text-sm font-semibold text-[#2D3436] mb-3">材料统计</h3>

      {/* Total beads */}
      <div className="flex items-center justify-between mb-4 px-3 py-2.5 bg-[#FFF5F5] rounded-xl">
        <span className="text-xs text-[#8A8D91]">总颗粒数</span>
        <span className="text-lg font-bold text-[#FF6B6B] tabular-nums">{totalBeads.toLocaleString()}</span>
      </div>

      {/* Color list */}
      <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1 mb-4">
        {sortedStats.map((stat) => {
          const color = colorMap[stat.colorIndex];
          if (!color) return null;
          return (
            <div
              key={color.id}
              className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-[#FAFAF8] transition-colors group"
            >
              {/* Color swatch */}
              <div
                className="w-6 h-6 rounded-md flex-shrink-0 border border-black/10 shadow-sm"
                style={{ backgroundColor: color.hex }}
                title={`${color.name} ${color.code}`}
              />
              {/* Color info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium text-[#2D3436] truncate">{color.name}</span>
                  <span className="text-[10px] text-[#8A8D91] tabular-nums">{color.code}</span>
                </div>
                {/* Mini bar */}
                <div className="mt-0.5 h-1.5 bg-[#E8E8E8] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${stat.percentage}%`,
                      backgroundColor: color.hex,
                    }}
                  />
                </div>
              </div>
              {/* Count & percentage */}
              <div className="text-right flex-shrink-0">
                <div className="text-xs font-medium text-[#2D3436] tabular-nums">{stat.count}</div>
                <div className="text-[10px] text-[#8A8D91] tabular-nums">{stat.percentage.toFixed(1)}%</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Export buttons - enhanced for mobile visibility */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <button
          onClick={handleExportPNG}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[#FF6B6B]/25 transition-all active:scale-[0.97]"
        >
          <FileImage size={18} />
          <span>导出PNG</span>
        </button>
        <button
          onClick={handleExportExcel}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-[#4ECDC4] to-[#6EDDD6] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[#4ECDC4]/25 transition-all active:scale-[0.97]"
        >
          <FileSpreadsheet size={18} />
          <span>导出Excel</span>
        </button>
      </div>
    </div>
  );
}
