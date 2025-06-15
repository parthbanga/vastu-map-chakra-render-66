
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

export const MarmaSthanOverlay: React.FC<MarmaSthanOverlayProps> = ({
  polygonPoints,
  center,
  rotation,
  opacity,
  scale,
}) => {
  // Step 1: Ensure 4 points (rectangle/square)
  if (polygonPoints.length !== 4) return null;

  // Sort corners to [top-left, top-right, bottom-right, bottom-left]
  const sorted = [...polygonPoints].sort((a, b) =>
    a.y === b.y ? a.x - b.x : a.y - b.y
  );
  const [p1, p2, p3, p4] = sorted;

  // Get grid bounds
  const minX = Math.min(...polygonPoints.map((p) => p.x));
  const maxX = Math.max(...polygonPoints.map((p) => p.x));
  const minY = Math.min(...polygonPoints.map((p) => p.y));
  const maxY = Math.max(...polygonPoints.map((p) => p.y));

  // Determine grid size
  const gridRows = 9;
  const gridCols = 9;
  const cellWidth = (maxX - minX) / gridCols;
  const cellHeight = (maxY - minY) / gridRows;

  // Marma Sthan: center 3x3 grid
  const marmaStartCol = 3, marmaEndCol = 5;
  const marmaStartRow = 3, marmaEndRow = 5;

  // For rotation, we'll center the rotation at Brahmasthan
  const rotatePoint = (px: number, py: number) => {
    const radians = ((rotation) * Math.PI) / 180;
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

  // Prepare grid lines
  const gridLines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i <= gridCols; i++) {
    const xx = minX + i * cellWidth;
    const start = rotatePoint(xx, minY);
    const end = rotatePoint(xx, maxY);
    gridLines.push({ x1: start.x, y1: start.y, x2: end.x, y2: end.y });
  }
  for (let i = 0; i <= gridRows; i++) {
    const yy = minY + i * cellHeight;
    const start = rotatePoint(minX, yy);
    const end = rotatePoint(maxX, yy);
    gridLines.push({ x1: start.x, y1: start.y, x2: end.x, y2: end.y });
  }

  // Prepare Marma Sthan rects (center 3x3)
  const marmaRects: { x: number; y: number; w: number; h: number }[] = [];
  for (let row = marmaStartRow; row <= marmaEndRow; row++) {
    for (let col = marmaStartCol; col <= marmaEndCol; col++) {
      // Top-left of cell before rotation
      const x0 = minX + col * cellWidth;
      const y0 = minY + row * cellHeight;
      // Rotated top-left and four corners for actual cells (for perspective, just use top-left for rect since slight error is OK in flat grid)
      marmaRects.push({
        x: x0,
        y: y0,
        w: cellWidth,
        h: cellHeight,
      });
    }
  }

  // Marma cell rectangles, all rotated
  const marmaPolys = marmaRects.map(({ x, y, w, h }) => {
    const tl = rotatePoint(x, y);
    const tr = rotatePoint(x + w, y);
    const br = rotatePoint(x + w, y + h);
    const bl = rotatePoint(x, y + h);
    return [tl, tr, br, bl];
  });

  // 16 radial direction lines
  const radialLines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i < 16; i++) {
    const angleDeg = rotation + i * (360 / 16);
    const angleRad = (angleDeg * Math.PI) / 180;
    // Find the farthest corner from center for line length
    const farRadius = Math.max(maxX - minX, maxY - minY) * 0.7;
    const ex = center.x + Math.cos(angleRad) * farRadius;
    const ey = center.y + Math.sin(angleRad) * farRadius;
    radialLines.push({ x1: center.x, y1: center.y, x2: ex, y2: ey });
  }

  // Direction labels
  const directionLabels = [
    "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"
  ];
  const labelPoints = directionLabels.map((lbl, i) => {
    const angleDeg = rotation + i * (360 / 16);
    const angleRad = (angleDeg * Math.PI) / 180;
    const labelRadius = Math.max(maxX - minX, maxY - minY) * 0.44;
    return {
      label: lbl,
      ...rotatePoint(center.x + Math.cos(angleRad) * labelRadius, center.y + Math.sin(angleRad) * labelRadius),
    };
  });

  return (
    <svg
      style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none", opacity, zIndex: 21 }}
      width="100%"
      height="100%"
      viewBox={`${vbMinX} ${vbMinY} ${vbWidth} ${vbHeight}`}
    >
      {/* Grid lines */}
      {gridLines.map((line, i) => (
        <line
          key={`grid-${i}`}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke="#B5B5B5"
          strokeWidth={i <= gridCols || (i > gridCols && (i - gridCols) % 3 !== 0) ? 1 : 2}
          opacity="0.6"
        />
      ))}
      {/* Highlight Marma Sthan blocks */}
      {marmaPolys.map((rect, i) => (
        <polygon
          key={`marma-${i}`}
          points={rect.map(p => `${p.x},${p.y}`).join(" ")}
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
        r={Math.max(cellWidth, cellHeight) * 0.4}
        fill="#8b5cf6"
        stroke="#c7d2fe"
        strokeWidth="3"
      />
      {/* 16 direction lines */}
      {radialLines.map((line, i) => (
        <line key={`dir-${i}`} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="#a21caf" strokeWidth="2" />
      ))}
      {/* Direction labels */}
      {labelPoints.map((pt, i) => (
        <text
          key={pt.label}
          x={pt.x}
          y={pt.y}
          fontSize="14"
          fontWeight="bold"
          fill="#2563eb"
          textAnchor="middle"
          alignmentBaseline="middle"
          style={{ userSelect: "none" }}
        >
          {pt.label}
        </text>
      ))}
    </svg>
  );
};
