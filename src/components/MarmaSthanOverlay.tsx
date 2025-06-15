
import React from "react";

interface Point {
  x: number;
  y: number;
}

interface MarmaSthanOverlayProps {
  polygonPoints: Point[];
  center: Point;
  rotation: number;
  opacity: number;
  scale: number;
}

// Determines if a point is inside a polygon (ray-casting algorithm)
function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi + 0.000001) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export const MarmaSthanOverlay: React.FC<MarmaSthanOverlayProps> = ({
  polygonPoints,
  center,
  rotation,
  opacity,
  scale,
}) => {
  if (polygonPoints.length < 3) {
    return null;
  }

  // Compute the bounding box of the polygon
  const minX = Math.min(...polygonPoints.map((p) => p.x));
  const maxX = Math.max(...polygonPoints.map((p) => p.x));
  const minY = Math.min(...polygonPoints.map((p) => p.y));
  const maxY = Math.max(...polygonPoints.map((p) => p.y));

  // Marma Sthan: 9x9 grid for bounding box
  const gridRows = 9;
  const gridCols = 9;
  const cellWidth = (maxX - minX) / gridCols;
  const cellHeight = (maxY - minY) / gridRows;

  // Center Marma 3x3: from col 3~5, row 3~5
  const marmaStartCol = 3, marmaEndCol = 5;
  const marmaStartRow = 3, marmaEndRow = 5;

  // For rotation (if rotation !== 0), rotate around plot center
  const rotatePoint = (px: number, py: number) => {
    const radians = (rotation * Math.PI) / 180;
    const cx = center.x;
    const cy = center.y;
    const x0 = px - cx;
    const y0 = py - cy;
    const x1 = x0 * Math.cos(radians) - y0 * Math.sin(radians);
    const y1 = x0 * Math.sin(radians) + y0 * Math.cos(radians);
    return { x: cx + x1, y: cy + y1 };
  };

  // SVG viewbox boundary
  const viewboxPad = 40;
  const vbMinX = minX - viewboxPad;
  const vbMinY = minY - viewboxPad;
  const vbWidth = (maxX - minX) + 2 * viewboxPad;
  const vbHeight = (maxY - minY) + 2 * viewboxPad;

  // Prepare Marma Sthan grid rects (center 3x3)
  const marmaRects: { x: number; y: number; w: number; h: number; poly: Point[] }[] = [];
  for (let row = marmaStartRow; row <= marmaEndRow; row++) {
    for (let col = marmaStartCol; col <= marmaEndCol; col++) {
      const x0 = minX + col * cellWidth;
      const y0 = minY + row * cellHeight;
      // Four corners, rotated
      const tl = rotatePoint(x0, y0);
      const tr = rotatePoint(x0 + cellWidth, y0);
      const br = rotatePoint(x0 + cellWidth, y0 + cellHeight);
      const bl = rotatePoint(x0, y0 + cellHeight);
      // Test if cell is at least partially inside the polygon: check center point
      const cx = x0 + cellWidth / 2;
      const cy = y0 + cellHeight / 2;
      const cRot = rotatePoint(cx, cy);
      if (isPointInPolygon(cRot, polygonPoints)) {
        marmaRects.push({
          x: x0,
          y: y0,
          w: cellWidth,
          h: cellHeight,
          poly: [tl, tr, br, bl]
        });
      }
    }
  }

  // Draw main polygon outline
  const polygonPath = polygonPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + " Z";

  // Center Brahmasthan pointer
  const maxCellDim = Math.max(cellWidth, cellHeight);

  return (
    <svg
      style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none", opacity, zIndex: 21 }}
      width="100%"
      height="100%"
      viewBox={`${vbMinX} ${vbMinY} ${vbWidth} ${vbHeight}`}
    >
      {/* Plot outline */}
      <path d={polygonPath} fill="none" stroke="#6366f1" strokeWidth={3} opacity={0.6} />
      {/* Highlight Marma Sthan cells */}
      {marmaRects.map((rect, i) => (
        <polygon
          key={i}
          points={rect.poly.map(p => `${p.x},${p.y}`).join(" ")}
          fill="#eab308"
          fillOpacity="0.35"
          stroke="#b45309"
          strokeWidth="2"
        />
      ))}
      {/* Center Brahmasthan pointer */}
      <circle
        cx={center.x}
        cy={center.y}
        r={maxCellDim * 0.4}
        fill="#8b5cf6"
        stroke="#c7d2fe"
        strokeWidth="3"
      />
    </svg>
  );
};
