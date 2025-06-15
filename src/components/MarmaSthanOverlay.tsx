
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

// Helper: Ray-segment intersection (returns intersection point, or null)
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

// Helper: from angle, get unit vector (with rotation)
function getDirVec(angleDeg: number, rotation: number) {
  const theta = ((angleDeg + rotation) * Math.PI) / 180;
  return { x: Math.cos(theta), y: Math.sin(theta) };
}

// Helper: get intersection of direction ray with polygon boundary (or closest point)
function getPolygonRayIntersection(center: Point, dir: Point, polygon: Point[]): Point {
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
  // fallback
  if (result) return result;
  let closest = polygon[0];
  minDist = Math.hypot(closest.x - center.x, closest.y - center.y);
  for (const p of polygon) {
    const dist = Math.hypot(p.x - center.x, p.y - center.y);
    if (dist < minDist) {
      minDist = dist;
      closest = p;
    }
  }
  return closest;
}

// 16 major directions, labels and compass angles (0°=N=up)
const directionLabels = [
  { name: "N", angle: 0 },
  { name: "NNE", angle: 22.5 },
  { name: "NE", angle: 45 },
  { name: "ENE", angle: 67.5 },
  { name: "E", angle: 90 },
  { name: "ESE", angle: 112.5 },
  { name: "SE", angle: 135 },
  { name: "SSE", angle: 157.5 },
  { name: "S", angle: 180 },
  { name: "SSW", angle: 202.5 },
  { name: "SW", angle: 225 },
  { name: "WSW", angle: 247.5 },
  { name: "W", angle: 270 },
  { name: "WNW", angle: 292.5 },
  { name: "NW", angle: 315 },
  { name: "NNW", angle: 337.5 },
];

export const MarmaSthanOverlay: React.FC<MarmaSthanOverlayProps> = ({
  polygonPoints,
  center,
  rotation,
  opacity,
  scale
}) => {
  if (!polygonPoints || polygonPoints.length < 3) return null;

  // Get the intersection point for each direction ray
  const rays = directionLabels.map(({ name, angle }) => {
    const dir = getDirVec(angle, rotation);
    const pt = getPolygonRayIntersection(center, dir, polygonPoints);
    return { name, angle, pt };
  });

  // Polygon outline for context
  const polygonPath = polygonPoints
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ") + " Z";

  // SVG Viewbox bounds
  const vbPad = 40;
  const xs = polygonPoints.map((p) => p.x);
  const ys = polygonPoints.map((p) => p.y);
  const rayXs = rays.map(r => r.pt.x);
  const rayYs = rays.map(r => r.pt.y);
  const vbMinX = Math.min(...xs, ...rayXs, center.x) - vbPad;
  const vbMaxX = Math.max(...xs, ...rayXs, center.x) + vbPad;
  const vbMinY = Math.min(...ys, ...rayYs, center.y) - vbPad;
  const vbMaxY = Math.max(...ys, ...rayYs, center.y) + vbPad;

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

      {/* Draw 16 direction rays */}
      {rays.map((ray, idx) => (
        <g key={`direction-ray-${ray.name}`}>
          <line
            x1={center.x} y1={center.y} x2={ray.pt.x} y2={ray.pt.y}
            stroke="#d97706"
            strokeWidth={2.8}
            opacity={0.55}
            strokeDasharray="7 5"
          />
          {/* Direction Point */}
          <circle
            cx={ray.pt.x}
            cy={ray.pt.y}
            r={10}
            fill="#000"
            stroke="#fde68a"
            strokeWidth={3}
          />
          {/* Label: direction name */}
          <text
            x={ray.pt.x}
            y={ray.pt.y - 16}
            fontSize="15"
            fontWeight="bold"
            fill="#1e40af"
            stroke="#fff"
            strokeWidth="1"
            textAnchor="middle"
            alignmentBaseline="middle"
            style={{
              pointerEvents: "none",
              userSelect: "none",
              fontFamily: "monospace"
            }}
          >
            {ray.name}
          </text>
          {/* Label: coordinates */}
          <text
            x={ray.pt.x}
            y={ray.pt.y + 18}
            fontSize="12.5"
            fill="#020202"
            stroke="#fff"
            strokeWidth="0.65"
            textAnchor="middle"
            alignmentBaseline="middle"
            style={{
              pointerEvents: "none",
              userSelect: "none"
            }}
          >
            ({ray.pt.x.toFixed(1)}, {ray.pt.y.toFixed(1)})
          </text>
        </g>
      ))}

      {/* Central Brahmasthan */}
      <circle
        cx={center.x}
        cy={center.y}
        r={16}
        fill="#2563eb"
        stroke="#a21caf"
        strokeWidth={5}
      />
      <text
        x={center.x}
        y={center.y}
        fontSize="15"
        fontWeight="bold"
        fill="#fff"
        stroke="#333"
        strokeWidth="1.1"
        textAnchor="middle"
        alignmentBaseline="middle"
        style={{
          pointerEvents: "none",
          userSelect: "none",
          fontFamily: "monospace"
        }}
      >
        CENTER
      </text>
      {/* Center coordinates below */}
      <text
        x={center.x}
        y={center.y + 22}
        fontSize="13"
        fill="#0a0a0a"
        stroke="#fff"
        strokeWidth="0.7"
        textAnchor="middle"
        alignmentBaseline="middle"
        style={{
          pointerEvents: "none",
          userSelect: "none"
        }}
      >
        ({center.x.toFixed(1)}, {center.y.toFixed(1)})
      </text>
    </svg>
  );
};
