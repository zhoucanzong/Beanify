/**
 * MaterialStats - Color usage statistics with export buttons
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
      <div className="card-bean p-3">
        <h3 className="section-heading">材料统计</h3>
        <div className="text-center py-8 text-[#8E8E93] text-sm">暂无数据</div>
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
    <div className="card-bean p-3">
      <h3 className="section-heading">材料统计</h3>

      {/* Total beads */}
      <div className="flex items-center justify-between mb-4 px-3 py-2.5 bg-[#FFF0F2] rounded-lg">
        <span className="text-xs text-[#8E8E93]">总颗粒数</span>
        <span className="text-lg font-bold text-[#E85D75] tabular-nums">{totalBeads.toLocaleString()}</span>
      </div>

      {/* Color list */}
      <div className="space-y-1 max-h-[320px] overflow-y-auto pr-1 mb-4">
        {sortedStats.map((stat) => {
          const color = colorMap[stat.colorIndex];
          if (!color) return null;
          return (
            <div key={color.id} className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-[#F2F2F7] transition-colors group">
              <div className="w-5 h-5 rounded-md flex-shrink-0 border border-black/10 shadow-sm" style={{ backgroundColor: color.hex }} title={`${color.name} ${color.code}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium text-[#1C1C1E] truncate">{color.name}</span>
                  <span className="text-[10px] text-[#8E8E93] tabular-nums">{color.code}</span>
                </div>
                <div className="mt-0.5 h-1 bg-[#E8E8EA] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-300" style={{ width: `${stat.percentage}%`, backgroundColor: color.hex }} />
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs font-medium text-[#1C1C1E] tabular-nums">{stat.count}</div>
                <div className="text-[10px] text-[#8E8E93] tabular-nums">{stat.percentage.toFixed(1)}%</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Export buttons */}
      <div className="grid grid-cols-2 gap-2.5">
        <button onClick={handleExportPNG} className="btn-primary py-2.5 text-xs">
          <FileImage size={16} />
          导出 PNG
        </button>
        <button onClick={handleExportExcel} className="btn-secondary py-2.5 text-xs">
          <FileSpreadsheet size={16} />
          导出 Excel
        </button>
      </div>
    </div>
  );
}
