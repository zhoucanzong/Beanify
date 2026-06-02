/**
 * Drawing algorithms for the pixel editor
 * - Bresenham line
 * - Midpoint circle
 * - Flood fill
 * - Rectangle fill
 */

import type { GridPoint } from './types';

/** Set a pixel on the grid with bounds checking */
export function setPixel(grid: number[][], x: number, y: number, color: number): void {
  if (y >= 0 && y < grid.length && x >= 0 && x < grid[0].length) {
    grid[y][x] = color;
  }
}

/** Get a pixel from the grid, returns -1 if out of bounds */
export function getPixel(grid: number[][], x: number, y: number): number {
  if (y >= 0 && y < grid.length && x >= 0 && x < grid[0].length) {
    return grid[y][x];
  }
  return -1;
}

/** Bresenham's line algorithm */
export function drawLine(
  grid: number[][],
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: number,
  brushSize: number = 1
): void {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    drawBrush(grid, x0, y0, color, brushSize);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }
}

/** Draw a filled rectangle */
export function drawRect(
  grid: number[][],
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: number
): void {
  const minX = Math.min(x0, x1);
  const maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1);
  const maxY = Math.max(y0, y1);

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      setPixel(grid, x, y, color);
    }
  }
}

/** Midpoint circle algorithm (filled) */
export function drawCircle(
  grid: number[][],
  cx: number,
  cy: number,
  r: number,
  color: number
): void {
  if (r <= 0) {
    setPixel(grid, cx, cy, color);
    return;
  }

  let x = r;
  let y = 0;
  let err = 0;

  while (x >= y) {
    // Draw horizontal lines to fill the circle
    for (let i = cx - x; i <= cx + x; i++) {
      setPixel(grid, i, cy + y, color);
      setPixel(grid, i, cy - y, color);
    }
    for (let i = cx - y; i <= cx + y; i++) {
      setPixel(grid, i, cy + x, color);
      setPixel(grid, i, cy - x, color);
    }

    y += 1;
    err += 1 + 2 * y;
    if (2 * (err - x) + 1 > 0) {
      x -= 1;
      err += 1 - 2 * x;
    }
  }
}

/** Flood fill algorithm (4-connected) */
export function floodFill(grid: number[][], x: number, y: number, color: number): void {
  const h = grid.length;
  const w = grid[0].length;

  if (x < 0 || x >= w || y < 0 || y >= h) return;

  const targetColor = grid[y][x];
  if (targetColor === color) return;

  const stack: [number, number][] = [[x, y]];

  while (stack.length > 0) {
    const [cx, cy] = stack.pop()!;

    if (cx < 0 || cx >= w || cy < 0 || cy >= h) continue;
    if (grid[cy][cx] !== targetColor) continue;

    grid[cy][cx] = color;

    stack.push([cx + 1, cy]);
    stack.push([cx - 1, cy]);
    stack.push([cx, cy + 1]);
    stack.push([cx, cy - 1]);
  }
}

/** Draw a brush stroke (circular brush) */
export function drawBrush(
  grid: number[][],
  x: number,
  y: number,
  color: number,
  size: number
): void {
  if (size <= 1) {
    setPixel(grid, x, y, color);
    return;
  }

  const radius = Math.floor((size - 1) / 2);
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy <= radius * radius + radius) {
        setPixel(grid, x + dx, y + dy, color);
      }
    }
  }
}

/** Get all points on a line (for preview) */
export function getLinePoints(x0: number, y0: number, x1: number, y1: number): GridPoint[] {
  const points: GridPoint[] = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    points.push({ x: x0, y: y0 });
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }

  return points;
}

/** Get all points in a rectangle (for preview) */
export function getRectPoints(
  x0: number,
  y0: number,
  x1: number,
  y1: number
): GridPoint[] {
  const points: GridPoint[] = [];
  const minX = Math.min(x0, x1);
  const maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1);
  const maxY = Math.max(y0, y1);

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      points.push({ x, y });
    }
  }
  return points;
}

/** Get all points in a circle (for preview) */
export function getCirclePoints(cx: number, cy: number, r: number): GridPoint[] {
  const points: GridPoint[] = [];
  if (r <= 0) {
    points.push({ x: cx, y: cy });
    return points;
  }

  const seen = new Set<string>();
  let x = r;
  let y = 0;
  let err = 0;

  while (x >= y) {
    for (let i = cx - x; i <= cx + x; i++) {
      const k1 = `${i},${cy + y}`;
      const k2 = `${i},${cy - y}`;
      if (!seen.has(k1)) {
        seen.add(k1);
        points.push({ x: i, y: cy + y });
      }
      if (!seen.has(k2)) {
        seen.add(k2);
        points.push({ x: i, y: cy - y });
      }
    }
    for (let i = cx - y; i <= cx + y; i++) {
      const k1 = `${i},${cy + x}`;
      const k2 = `${i},${cy - x}`;
      if (!seen.has(k1)) {
        seen.add(k1);
        points.push({ x: i, y: cy + x });
      }
      if (!seen.has(k2)) {
        seen.add(k2);
        points.push({ x: i, y: cy - x });
      }
    }

    y += 1;
    err += 1 + 2 * y;
    if (2 * (err - x) + 1 > 0) {
      x -= 1;
      err += 1 - 2 * x;
    }
  }

  return points;
}
