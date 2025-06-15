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

// Helper: Ray-segment intersection
function raySegmentIntersection(
  rayStart: Point,
  rayDir: Point,
  segA: Point,
  segB: Point
): Point | null {
  // Ray: rayStart + t*rayDir, t>=0
  // Segment: segA + u*(segB-segA), u in [0,1]
  const vx = segB.x - segA.x;
  const vy = segB.y - segA.y;
  const wx = rayDir.x;
  const wy = rayDir.y;
  const dx = segA.x - rayStart.x;
  const dy = segA.y - rayStart.y;

  const det = wx * vy - wy * vx;
  if (Math.abs(det) < 1e-8) return null;

  const t = (vx * dy - vy * dx) / det;
  const u = (wx * dy - wy * dx) / det;

  if (t >= 0 && u >= 0 && u <= 1) {
    return {
      x: rayStart.x + t * wx,
      y: rayStart.y + t * wy,
    };
  }
  return null;
}

// Helper: from angle, get unit vector (with optional rotation)
function getDirVec(angleDeg: number, rotation: number) {
  const theta = ((angleDeg + rotation) * Math.PI) / 180;
  return { x: Math.cos(theta), y: Math.sin(theta) };
}

// Helper: Given a direction angle, get intersection of ray with polygon boundary
function getPolygonRayIntersection(center: Point, dir: Point, polygon: Point[]): Point | null {
  let minDist = Infinity;
  let result: Point | null = null;
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    const pt = raySegmentIntersection(center, dir, a, b);
    if (pt) {
      const dist = Math.hypot(pt.x - center.x, pt.y - center.y);
      if (dist < minDist) {
        minDist = dist;
        result = pt;
      }
    }
  }
  return result;
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

// New helper: returns point on polygon boundary in given direction, or the closest vertex if no intersection
function getSafePolygonRayIntersection(center: Point, dir: Point, polygon: Point[]): Point {
  const intersection = getPolygonRayIntersection(center, dir, polygon);
  if (intersection) return intersection;

  // No ray intersection found; fallback: use closest point on the polygon
  let minDist = Infinity;
  let closest = polygon[0];
  for (const p of polygon) {
    const dist = Math.hypot(p.x - center.x, p.y - center.y);
    if (dist < minDist) {
      minDist = dist;
      closest = p;
    }
  }
  // Debugging: notify if fallback is needed
  // @ts-ignore
  if (typeof window !== "undefined" && window.console) {
    console.warn("[MarmaSthanOverlay] No intersection at dir", dir, ". Using closest vertex.", {center, closest});
  }
  return closest;
}

export const MarmaSthanOverlay: React.FC<MarmaSthanOverlayProps> = ({
  polygonPoints,
  center,
  rotation,
  opacity,
  scale,
}) => {
  if (!polygonPoints || polygonPoints.length < 3) return null;

  // --- MarmaSthan GRID LOGIC ---

  // Get square aligned with center and the four cardinal directions
  const orthAngles = [0, 90, 180, 270];
  const sides = orthAngles.map((ang) => {
    const dir = getDirVec(ang, rotation);
    const pt = getSafePolygonRayIntersection(center, dir, polygonPoints);
    return Math.hypot(pt.x - center.x, pt.y - center.y);
  });

  // The side is ~distance from center to closest edge x2
  const minSide = Math.max(1, Math.min(...sides)) * 0.95 * scale;
  const halfSide = minSide;
  const squareSide = halfSide * 2;

  // The square bounds (rotated)
  const rot = (deg: number) => {
    const theta = (rotation * Math.PI) / 180;
    const cos = Math.cos(theta),
      sin = Math.sin(theta);
    return (x: number, y: number) => ({
      x: center.x + (x - center.x) * cos - (y - center.y) * sin,
      y: center.y + (x - center.x) * sin + (y - center.y) * cos,
    });
  };
  const rotate = rot(rotation);

  // 9x9 grid (default for Vastu Marma overlays)
  const N = 9;
  const step = squareSide / (N - 1);

  // Top-left corner (unrotated)
  const gridX0 = center.x - halfSide;
  const gridY0 = center.y - halfSide;

  // Find grid cell indices for Brahmasthan (center 3x3 in 9x9)
  // 0-based indices: 3, 4, 5 (Rows and Columns)
  const centralIdx = Math.floor(N / 2); // 4
  const brahmaStart = centralIdx - 1; // 3
  const brahmaEnd = centralIdx + 1;   // 5

  // Helper: Is grid cell in Brahmasthan (center 3x3)
  function isBrahmasthanCell(i: number, j: number) {
    return (
      i >= brahmaStart &&
      i <= brahmaEnd &&
      j >= brahmaStart &&
      j <= brahmaEnd
    );
  }

  // Helper: Is grid cell in Marma Sthan ("donut" around Brahmasthan)
  function isMarmaSthanCell(i: number, j: number) {
    // Marma: 1-cell border ring around Brahmasthan
    return (
      ((i === brahmaStart - 1 || i === brahmaEnd + 1) && (j >= brahmaStart - 1 && j <= brahmaEnd + 1)) ||
      ((j === brahmaStart - 1 || j === brahmaEnd + 1) && (i >= brahmaStart - 1 && i <= brahmaEnd + 1))
    ) && !isBrahmasthanCell(i, j);
  }

  // Calculate grid points and types
  const gridPoints: {pt: Point, i: number, j: number, type: "brahma" | "marma" | "normal"}[] = [];
  for (let i = 0; i < N; ++i) {
    for (let j = 0; j < N; ++j) {
      // Grid point before rotation
      const px = gridX0 + step * j;
      const py = gridY0 + step * i;
      // Rotate around center by rotation deg
      const { x, y } = rotate(px, py);

      let type: "brahma" | "marma" | "normal" = "normal";
      if (isBrahmasthanCell(i, j)) type = "brahma";
      else if (isMarmaSthanCell(i, j)) type = "marma";

      gridPoints.push({ pt: { x, y }, i, j, type });
    }
  }

  // For bounding and svg viewbox, reuse previous logic
  const polygonPath = polygonPoints
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ") + " Z";

  const vbPad = 40;
  const xs = polygonPoints.map((p) => p.x);
  const ys = polygonPoints.map((p) => p.y);

  // For grid, find extremes
  const allGridXs = gridPoints.map(g => g.pt.x);
  const allGridYs = gridPoints.map(g => g.pt.y);

  const vbMinX = Math.min(...xs, ...allGridXs) - vbPad;
  const vbMaxX = Math.max(...xs, ...allGridXs) + vbPad;
  const vbMinY = Math.min(...ys, ...allGridYs) - vbPad;
  const vbMaxY = Math.max(...ys, ...allGridYs) + vbPad;

  return (
    <svg
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        pointerEvents: "none",
        opacity,
        zIndex: 21,
        width: "100%",
        height: "100%",
      }}
      viewBox={`${vbMinX} ${vbMinY} ${vbMaxX - vbMinX} ${vbMaxY - vbMinY}`}
    >
      {/* Plot outline */}
      <path d={polygonPath} fill="none" stroke="#6366f1" strokeWidth={3} opacity={0.6} />

      {/* Marma Sthan bounding square outline */}
      <rect
        x={gridX0}
        y={gridY0}
        width={squareSide}
        height={squareSide}
        fill="#fde68a"
        fillOpacity="0.18"
        stroke="#facc15"
        strokeWidth={2.5}
        transform={`rotate(${rotation},${center.x},${center.y})`}
      />

      {/* Draw grid lines */}
      {Array.from({length: N}, (_, idx) => {
        // verticals
        const startV = rotate(gridX0 + step * idx, gridY0);
        const endV = rotate(gridX0 + step * idx, gridY0 + squareSide);
        // horizontals
        const startH = rotate(gridX0, gridY0 + step * idx);
        const endH = rotate(gridX0 + squareSide, gridY0 + step * idx);
        return (
          <g key={"grid-" + idx}>
            {/* Vertical */}
            <line
              x1={startV.x} y1={startV.y} x2={endV.x} y2={endV.y}
              stroke="#bbb"
              strokeWidth={1.1}
              opacity={0.7}
            />
            {/* Horizontal */}
            <line
              x1={startH.x} y1={startH.y} x2={endH.x} y2={endH.y}
              stroke="#bbb"
              strokeWidth={1.1}
              opacity={0.7}
            />
          </g>
        );
      })}

      {/* Render all grid intersections (Marma and Brahma highlights) */}
      {gridPoints.map(({ pt, type }, idx) => (
        <g key={`marma-grid-pt-${idx}`}>
          {/* Dot */}
          <circle
            cx={pt.x}
            cy={pt.y}
            r={type === "brahma" ? 11 : type === "marma" ? 9 : 6.5}
            fill={
              type === "brahma"
                ? "#2563eb"    // Blue center
                : type === "marma"
                ? "#facc15"    // Gold highlight for Marma Sthan ring
                : "#222"       // Normal point
            }
            stroke={
              type === "brahma"
                ? "#7dd3fc"
                : type === "marma"
                ? "#fde68a"
                : "#e5e7eb"
            }
            strokeWidth={type === "brahma" ? 5 : type === "marma" ? 3.5 : 2.5}
            opacity={type === "normal" ? 0.8 : 1}
          />
          {/* (x, y) label */}
          <text
            x={pt.x}
            y={pt.y - 16}
            fontSize="12"
            fontWeight="bold"
            fill="#1e293b"
            stroke="#f8fafc"
            strokeWidth="0.7"
            paintOrder="stroke"
            alignmentBaseline="middle"
            textAnchor="middle"
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            ({pt.x.toFixed(1)}, {pt.y.toFixed(1)})
          </text>
        </g>
      ))}

      {/* Central Brahmasthan central point indicator */}
      <circle
        cx={center.x}
        cy={center.y}
        r={12}
        fill="#2563eb"
        stroke="#a21caf"
        strokeWidth={3.5}
      />

      {/* Classic Brahmasthan center indicator */}
      <circle
        cx={center.x}
        cy={center.y}
        r={halfSide * 0.25}
        fill="#a21caf"
        stroke="#ede9fe"
        strokeWidth="3"
        opacity={0.6}
      />
    </svg>
  );
};
