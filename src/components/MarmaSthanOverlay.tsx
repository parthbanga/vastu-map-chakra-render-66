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

  // Standard compass angles: N, NE, E, SE, S, SW, W, NW
  const compassAngles = [0, 45, 90, 135, 180, 225, 270, 315];

  const labelOffsets = [
    { dx: 0, dy: -18 },   // N
    { dx: 18, dy: -18 },  // NE
    { dx: 20, dy: 0 },    // E
    { dx: 15, dy: 18 },   // SE
    { dx: 0, dy: 24 },    // S
    { dx: -15, dy: 18 },  // SW
    { dx: -22, dy: 0 },   // W
    { dx: -17, dy: -17 }  // NW
  ];

  // Store info whether fallback was used (for diagnostics)
  const marmaBoundaryPoints: { pt: Point; usedFallback: boolean; angle: number; label: string }[] = compassAngles.map((ang, idx) => {
    const dir = getDirVec(ang, rotation);
    const intersection = getPolygonRayIntersection(center, dir, polygonPoints);
    let usedFallback = false;
    let pt: Point;
    if (intersection) {
      pt = intersection;
    } else {
      // Fallback: get closest polygon point
      let minDist = Infinity;
      let closest = polygonPoints[0];
      for (const p of polygonPoints) {
        const dist = Math.hypot(p.x - center.x, p.y - center.y);
        if (dist < minDist) {
          minDist = dist;
          closest = p;
        }
      }
      usedFallback = true;
      pt = closest;
    }

    // Debug log for troubleshooting which points use fallback
    if (typeof window !== "undefined" && window.console && usedFallback) {
      console.warn(`[MarmaSthanOverlay] Fallback used for angle ${ang} (${["N","NE","E","SE","S","SW","W","NW"][idx]}), using vertex:`, pt);
    }

    // Optional: add text label for debugging/clarity (not shown in UI unless wanted)
    return { pt, usedFallback, angle: ang, label: ["N","NE","E","SE","S","SW","W","NW"][idx] };
  });

  // --- Draw Marma Sthan square grid (keep existing logic) ---
  const orthAngles = [0, 90, 180, 270];
  const sides = orthAngles.map((ang) => {
    const dir = getDirVec(ang, rotation);
    const pt = getSafePolygonRayIntersection(center, dir, polygonPoints);
    return Math.hypot(pt.x - center.x, pt.y - center.y);
  });

  const minSide = Math.max(1, Math.min(...sides)) * 0.95 * scale;
  const halfSide = minSide;
  const squareSide = halfSide * 2;

  // Compute grid lines (just like before, in square)
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = -1; i <= 1; i += 2) {
    lines.push({
      x1: center.x + (i * squareSide) / 6,
      y1: center.y - halfSide,
      x2: center.x + (i * squareSide) / 6,
      y2: center.y + halfSide,
    });
    lines.push({
      x1: center.x - halfSide,
      y1: center.y + (i * squareSide) / 6,
      x2: center.x + halfSide,
      y2: center.y + (i * squareSide) / 6,
    });
  }

  // --- Viewbox calculation for overlay (just like before) ---
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

  const gridTL = rotate(center.x - halfSide, center.y - halfSide);
  const gridTR = rotate(center.x + halfSide, center.y - halfSide);
  const gridBR = rotate(center.x + halfSide, center.y + halfSide);
  const gridBL = rotate(center.x - halfSide, center.y + halfSide);

  const polygonPath = polygonPoints
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ") + " Z";

  const vbPad = 40;
  const xs = polygonPoints.map((p) => p.x);
  const ys = polygonPoints.map((p) => p.y);
  const vbMinX = Math.min(...xs, gridTL.x, gridTR.x, gridBR.x, gridBL.x) - vbPad;
  const vbMaxX = Math.max(...xs, gridTL.x, gridTR.x, gridBR.x, gridBL.x) + vbPad;
  const vbMinY = Math.min(...ys, gridTL.y, gridTR.y, gridBR.y, gridBL.y) - vbPad;
  const vbMaxY = Math.max(...ys, gridTL.y, gridTR.y, gridBR.y, gridBL.y) + vbPad;

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
      <polygon
        points={`${gridTL.x},${gridTL.y} ${gridTR.x},${gridTR.y} ${gridBR.x},${gridBR.y} ${gridBL.x},${gridBL.y}`}
        fill="#fde68a"
        fillOpacity="0.20"
        stroke="#facc15"
        strokeWidth={2.5}
      />

      {/* Marma Sthan inner grid lines */}
      {lines.map((l, idx) => {
        const p1 = rotate(l.x1, l.y1);
        const p2 = rotate(l.x2, l.y2);
        return (
          <line
            key={idx}
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke="#b45309"
            strokeWidth="2"
            strokeDasharray="9 3"
            opacity={0.75}
          />
        );
      })}

      {/* --- Draw all 8 Marma Sthan boundary points as bold black circles with labels --- */}
      {marmaBoundaryPoints.map(({ pt, usedFallback, label }, idx) => (
        <g key={`marma-pt-label-${idx}`}>
          <circle
            cx={pt.x}
            cy={pt.y}
            r={usedFallback ? 12 : 10}
            fill="#111"
            stroke="#fff"
            strokeWidth={usedFallback ? 4.5 : 3.5}
          />
          <text
            x={pt.x + (labelOffsets[idx]?.dx ?? 15)}
            y={pt.y + (labelOffsets[idx]?.dy ?? 0)}
            fontSize="17"
            fontWeight="bold"
            fill="#1e293b"
            stroke="#f8fafc"
            strokeWidth="1"
            paintOrder="stroke"
            alignmentBaseline="middle"
            textAnchor="middle"
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            {label}
          </text>
        </g>
      ))}

      {/* Center (Brahmasthan): also bold black */}
      <circle
        cx={center.x}
        cy={center.y}
        r={12}
        fill="#111"
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
