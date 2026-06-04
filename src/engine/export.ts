/**
 * Export functions for bead patterns
 * - PNG export with grid lines and color labels
 * - Excel export with colored cells and material list
 */

import type { ProcessResult } from './types';
import * as XLSX from 'xlsx-js-style';

interface PNGExportOptions {
  cellSize?: number;
  showGrid?: boolean;
  showLabels?: boolean;
}

interface ExcelExportOptions {
  brand?: string;
}

// ============================================================================
// PNG Export
// ============================================================================

export function exportToPNG(result: ProcessResult, options: PNGExportOptions = {}): Blob {
  const { cellSize = 40, showGrid = true, showLabels = true } = options;
  const { grid, colorMap, stats, width, height } = result;

  // Grid lines take 1px
  const gridLineWidth = showGrid ? 1 : 0;
  const contentWidth = width * (cellSize + gridLineWidth) + gridLineWidth;
  const contentHeight = height * (cellSize + gridLineWidth) + gridLineWidth;

  // Legend area
  const legendPadding = 20;
  const legendItemHeight = 36;
  const legendItemsPerRow = Math.max(1, Math.floor(contentWidth / 200));
  const legendRows = Math.ceil(colorMap.length / legendItemsPerRow);
  const legendHeight = legendRows * legendItemHeight + legendPadding * 2 + 30; // +30 for title

  const totalWidth = contentWidth + 40; // margin
  const totalHeight = contentHeight + legendHeight + 40;

  const canvas = document.createElement('canvas');
  canvas.width = totalWidth;
  canvas.height = totalHeight;
  const ctx = canvas.getContext('2d')!;

  // White background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  // Draw title
  ctx.fillStyle = '#2D3436';
  ctx.font = 'bold 18px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('\u62fc\u8c46\u56fe\u7eb8', totalWidth / 2, 28);

  const gridStartX = 20;
  const gridStartY = 40;

  // Draw grid cells
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const colorIdx = grid[y][x];
      const px = gridStartX + gridLineWidth + x * (cellSize + gridLineWidth);
      const py = gridStartY + gridLineWidth + y * (cellSize + gridLineWidth);

      if (colorIdx < 0) {
        // Transparent: draw checkerboard pattern
        drawCheckerboard(ctx, px, py, cellSize);
      } else {
        const color = colorMap[colorIdx];
        ctx.fillStyle = color.hex;
        ctx.fillRect(px, py, cellSize, cellSize);
      }
    }
  }

  // Draw grid lines
  if (showGrid) {
    ctx.fillStyle = '#333333';
    // Horizontal lines
    for (let y = 0; y <= height; y++) {
      const py = gridStartY + y * (cellSize + gridLineWidth);
      ctx.fillRect(gridStartX, py, contentWidth, gridLineWidth);
    }
    // Vertical lines
    for (let x = 0; x <= width; x++) {
      const px = gridStartX + x * (cellSize + gridLineWidth);
      ctx.fillRect(px, gridStartY, gridLineWidth, contentHeight);
    }
  }

  // Draw labels (if cell is large enough)
  if (showLabels && cellSize >= 24) {
    ctx.font = `${Math.max(7, Math.min(10, cellSize / 3))}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const colorIdx = grid[y][x];
        if (colorIdx < 0) continue;

        const color = colorMap[colorIdx];
        const px = gridStartX + gridLineWidth + x * (cellSize + gridLineWidth) + cellSize / 2;
        const py = gridStartY + gridLineWidth + y * (cellSize + gridLineWidth) + cellSize / 2;

        // Choose text color based on background brightness
        const brightness = (color.rgb[0] * 299 + color.rgb[1] * 587 + color.rgb[2] * 114) / 1000;
        ctx.fillStyle = brightness > 128 ? '#000000' : '#FFFFFF';

        const fontSize = Math.max(7, Math.min(10, cellSize / 3));
        ctx.font = `${fontSize}px monospace`;
        const label = cellSize >= 30 ? color.code : color.code.substring(0, 2);
        ctx.fillText(label, px, py);
      }
    }
  }

  // Draw legend
  const legendY = gridStartY + contentHeight + 20;
  ctx.fillStyle = '#2D3436';
  ctx.font = 'bold 14px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('\u989c\u8272\u56fe\u4f8b\uff08\u5171' + colorMap.length + '\u79cd\u989c\u8272\uff09', gridStartX, legendY);

  for (let i = 0; i < colorMap.length; i++) {
    const color = colorMap[i];
    const stat = stats.find((s) => s.colorIndex === i);
    const row = Math.floor(i / legendItemsPerRow);
    const col = i % legendItemsPerRow;
    const itemX = gridStartX + col * 200;
    const itemY = legendY + 15 + row * legendItemHeight;

    // Color swatch
    ctx.fillStyle = color.hex;
    ctx.fillRect(itemX, itemY, 20, 20);
    ctx.strokeStyle = '#CCCCCC';
    ctx.lineWidth = 1;
    ctx.strokeRect(itemX, itemY, 20, 20);

    // Color info
    ctx.fillStyle = '#2D3436';
    ctx.font = '12px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left';
    const countStr = stat ? `${stat.count}\u7c92 (${stat.percentage.toFixed(1)}%)` : '';
    ctx.fillText(`${color.name} ${color.code} ${countStr}`, itemX + 26, itemY + 14);
  }

  // Convert to blob
  const dataUrl = canvas.toDataURL('image/png');
  const byteString = atob(dataUrl.split(',')[1]);
  const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}

function drawCheckerboard(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const sqSize = size / 4;
  for (let sy = 0; sy < 4; sy++) {
    for (let sx = 0; sx < 4; sx++) {
      ctx.fillStyle = (sx + sy) % 2 === 0 ? '#FFFFFF' : '#E0E0E0';
      ctx.fillRect(x + sx * sqSize, y + sy * sqSize, sqSize, sqSize);
    }
  }
}

// ============================================================================
// Excel Export
// ============================================================================

export function exportToExcel(result: ProcessResult, _options: ExcelExportOptions = {}): Blob {
  const { grid, colorMap, stats, width, height } = result;

  // Create workbook
  const wb = XLSX.utils.book_new();

  // ===== Sheet 1: Pattern Grid =====
  const wsData: (string | number)[][] = [];

  // Build grid data with color codes
  for (let y = 0; y < height; y++) {
    const row: (string | number)[] = [];
    for (let x = 0; x < width; x++) {
      const colorIdx = grid[y][x];
      if (colorIdx < 0) {
        row.push('');
      } else {
        const color = colorMap[colorIdx];
        row.push(color.code);
      }
    }
    wsData.push(row);
  }

  const ws1 = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths for square-ish cells (column width is in units of average character width)
  ws1['!cols'] = Array.from({ length: width }, () => ({ wch: 4 }));
  // Row heights
  ws1['!rows'] = Array.from({ length: height }, () => ({ hpt: 22 }));

  // Apply cell styles (background colors, font size)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cellRef = XLSX.utils.encode_cell({ r: y, c: x });
      const colorIdx = grid[y][x];

      if (colorIdx >= 0) {
        const color = colorMap[colorIdx];
        const hex = 'FF' + color.hex.replace('#', '');

        ws1[cellRef] = {
          v: color.code,
          t: 's',
          s: {
            fill: {
              patternType: 'solid',
              fgColor: { rgb: hex },
            },
            font: {
              sz: 7,
              color: { rgb: isLightColor(color.rgb) ? '000000' : 'FFFFFF' },
              name: 'Arial',
            },
            alignment: { horizontal: 'center', vertical: 'center', wrapText: false },
            border: {
              top: { style: 'thin', color: { rgb: '888888' } },
              bottom: { style: 'thin', color: { rgb: '888888' } },
              left: { style: 'thin', color: { rgb: '888888' } },
              right: { style: 'thin', color: { rgb: '888888' } },
            },
          },
        };

        // Every 10th row/column: bold border
        if ((y + 1) % 10 === 0 || (x + 1) % 10 === 0) {
          const borderStyle = 'medium';
          const borderColor = '000000';
          const border = {
            top: { style: (y + 1) % 10 === 0 ? borderStyle : 'thin', color: { rgb: (y + 1) % 10 === 0 ? borderColor : '888888' } },
            bottom: { style: 'thin', color: { rgb: '888888' } },
            left: { style: (x + 1) % 10 === 0 ? borderStyle : 'thin', color: { rgb: (x + 1) % 10 === 0 ? borderColor : '888888' } },
            right: { style: 'thin', color: { rgb: '888888' } },
          };
          if (ws1[cellRef].s) ws1[cellRef].s.border = border;
        }
      }
    }
  }

  XLSX.utils.book_append_sheet(wb, ws1, '\u56fe\u7eb8');

  // ===== Sheet 2: Material List =====
  const ws2Data: (string | number)[][] = [
    ['\u989c\u8272\u540d\u79f0', '\u8272\u53f7', '\u7528\u91cf(\u7c92)', '\u767e\u5206\u6bd4', '\u5efa\u8bae\u8d2d\u4e70\u91cf(\u5305)'],
  ];

  // Sort stats by count descending
  const sortedStats = [...stats].sort((a, b) => b.count - a.count);
  let totalCount = 0;

  for (const stat of sortedStats) {
    const color = colorMap[stat.colorIndex];
    const packages = Math.ceil(stat.count / 1000); // Assume 1000 beads per pack
    totalCount += stat.count;
    ws2Data.push([
      color.name,
      color.code,
      stat.count,
      stat.percentage.toFixed(1) + '%',
      packages,
    ]);
  }

  // Add total row
  ws2Data.push(['\u5408\u8ba1', '', totalCount, '100%', Math.ceil(totalCount / 1000)]);

  const ws2 = XLSX.utils.aoa_to_sheet(ws2Data);

  // Column widths
  ws2['!cols'] = [
    { wch: 16 }, // Color name
    { wch: 12 }, // Code
    { wch: 14 }, // Count
    { wch: 10 }, // Percentage
    { wch: 18 }, // Packages
  ];

  // Style header row
  const headerStyle = {
    font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 12 },
    fill: { patternType: 'solid', fgColor: { rgb: 'FFFF6B6B' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'CCCCCC' } },
      bottom: { style: 'medium', color: { rgb: '333333' } },
      left: { style: 'thin', color: { rgb: 'CCCCCC' } },
      right: { style: 'thin', color: { rgb: 'CCCCCC' } },
    },
  };

  for (let c = 0; c < 5; c++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c });
    ws2[cellRef] = { v: ws2Data[0][c], t: 's', s: headerStyle };
  }

  // Style data rows
  for (let r = 1; r < ws2Data.length; r++) {
    const isTotal = r === ws2Data.length - 1;
    for (let c = 0; c < 5; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      const colorIdx = r - 1 < sortedStats.length ? sortedStats[r - 1].colorIndex : -1;
      const bgColor = colorIdx >= 0 ? 'FF' + colorMap[colorIdx].hex.replace('#', '') : 'FFFFFFFF';

      // Only fill color in the color code column (index 1)
      const fillColor = c === 1 ? (isTotal ? 'E8E8E8' : bgColor) : 'FFFFFFFF';
      ws2[cellRef] = {
        v: ws2Data[r][c],
        t: typeof ws2Data[r][c] === 'number' ? 'n' : 's',
        s: {
          fill: { patternType: 'solid', fgColor: { rgb: fillColor } },
          font: {
            bold: isTotal,
            color: { rgb: isTotal || !isLightColor(colorIdx >= 0 ? colorMap[colorIdx].rgb : [255, 255, 255]) ? '000000' : '000000' },
            sz: 11,
          },
          alignment: { horizontal: c < 2 ? 'left' : 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: 'DDDDDD' } },
            bottom: { style: 'thin', color: { rgb: 'DDDDDD' } },
            left: { style: 'thin', color: { rgb: 'DDDDDD' } },
            right: { style: 'thin', color: { rgb: 'DDDDDD' } },
          },
        },
      };
    }
  }

  XLSX.utils.book_append_sheet(wb, ws2, '\u6750\u6599\u6e05\u5355');

  // Write to blob
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true });
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Check if a color is light (for text color selection)
 */
function isLightColor(rgb: [number, number, number]): boolean {
  const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
  return brightness > 160;
}

/**
 * Trigger a file download
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
