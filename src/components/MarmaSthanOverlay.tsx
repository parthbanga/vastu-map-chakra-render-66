
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

// -- Helper: Rectangle from polygon bounding box --
function getBoundingRect(points: Point[]) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return { minX, minY, maxX, maxY };
}

// -- Helper: Direction vector from angle (deg) & rotation --
function dirVec(angleDeg: number, rotation: number) {
  const theta = ((angleDeg + rotation) * Math.PI) / 180;
  return { x: Math.cos(theta), y: Math.sin(theta) };
}

// -- Helper: Intersection of a ray from `center` in `dir` with rectangle boundary --
function intersectRayRect(center: Point, dir: Point, rect: { minX: number; minY: number; maxX: number; maxY: number }) {
  // Parametric line: center + t*dir, t >= 0
  let tMin = Infinity;
  let hit: Point | null = null;

  // For each rectangle side
  const sides = [
    // top edge
    [{ x: rect.minX, y: rect.minY }, { x: rect.maxX, y: rect.minY }],
    // right edge
    [{ x: rect.maxX, y: rect.minY }, { x: rect.maxX, y: rect.maxY }],
    // bottom edge
    [{ x: rect.maxX, y: rect.maxY }, { x: rect.minX, y: rect.maxY }],
    // left edge
    [{ x: rect.minX, y: rect.maxY }, { x: rect.minX, y: rect.minY }],
  ];

  for (const [a, b] of sides) {
    // Edge as segment: a--b. Ray is center + t*dir, t >= 0
    // Compute intersection
    const dx = b.x - a.x;
    const dy = b.y - a.y;

    const det = dir.x * (-dy) + dir.y * dx;
    if (Math.abs(det) < 1e-10) continue;
    const t = ((a.x - center.x) * (-dy) + (a.y - center.y) * dx) / det;
    const u = ((a.x - center.x) * dir.y - (a.y - center.y) * dir.x) / det;

    if (t >= 0 && u >= 0 && u <= 1) {
      if (t < tMin) {
        tMin = t;
        hit = {
          x: center.x + dir.x * t,
          y: center.y + dir.y * t,
        };
      }
    }
  }
  return hit;
}

// 16 major Vastu directions (every 22.5°, starting from North/up)
const directions = [
  { angle: 0 },
  { angle: 22.5 },
  { angle: 45 },
  { angle: 67.5 },
  { angle: 90 },
  { angle: 112.5 },
  { angle: 135 },
  { angle: 157.5 },
  { angle: 180 },
  { angle: 202.5 },
  { angle: 225 },
  { angle: 247.5 },
  { angle: 270 },
  { angle: 292.5 },
  { angle: 315 },
  { angle: 337.5 }
];

export const MarmaSthanOverlay: React.FC<MarmaSthanOverlayProps> = ({
  polygonPoints,
  center,
  rotation,
  opacity,
  scale,
}) => {
  if (!polygonPoints || polygonPoints.length < 3) return null;

  // Get bounding rectangle
  const rect = getBoundingRect(polygonPoints);

  // Directions: get intersection points with rectangle
  const rays = directions.map(({ angle }) => {
    const dir = dirVec(angle, rotation);
    const pt = intersectRayRect(center, dir, rect);
    return { angle, pt };
  });

  // SVG Viewbox
  const vbPad = 40;
  const xs = polygonPoints.map((p) => p.x);
  const ys = polygonPoints.map((p) => p.y);
  const rayXs = rays.map(r => r.pt?.x ?? center.x);
  const rayYs = rays.map(r => r.pt?.y ?? center.y);
  const vbMinX = Math.min(...xs, ...rayXs, center.x) - vbPad;
  const vbMaxX = Math.max(...xs, ...rayXs, center.x) + vbPad;
  const vbMinY = Math.min(...ys, ...rayYs, center.y) - vbPad;
  const vbMaxY = Math.max(...ys, ...rayYs, center.y) + vbPad;

  // Rectangle polygon string
  const rectPath = [
    `M${rect.minX},${rect.minY}`,
    `L${rect.maxX},${rect.minY}`,
    `L${rect.maxX},${rect.maxY}`,
    `L${rect.minX},${rect.maxY}`,
    "Z"
  ].join(" ");

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
      <path d={rectPath} fill="none" stroke="#6366f1" strokeWidth={3} opacity={0.65} />

      {/* Marma grid: 16 main lines */}
      {rays.map((r, idx) => r.pt && (
        <g key={idx}>
          {/* Ray line */}
          <line
            x1={center.x}
            y1={center.y}
            x2={r.pt.x}
            y2={r.pt.y}
            stroke="#cd1818"
            strokeWidth={2.7}
            opacity={0.62}
          />
          {/* Dot at intersection */}
          <circle
            cx={r.pt.x}
            cy={r.pt.y}
            r={9}
            fill="#000"
            stroke="#fff"
            strokeWidth={2}
          />
        </g>
      ))}

      {/* Center dot */}
      <circle
        cx={center.x}
        cy={center.y}
        r={13}
        fill="#2563eb"
        stroke="#a21caf"
        strokeWidth={5}
      />
    </svg>
  );
};
