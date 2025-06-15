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

export const MarmaSthanOverlay: React.FC<MarmaSthanOverlayProps> = ({
  polygonPoints,
  center,
  rotation,
  opacity,
  scale,
}) => {
  if (!polygonPoints || polygonPoints.length < 3) return null;

  // 3x3 Marma Sthan: 2 vertical and 2 horizontal grid lines (so 9 cells).
  // The grid should be square, centered at center, fully inside the polygon.

  // Find maximum inscribed square side.
  // We'll approximate: pick the distance to boundary in 4 orthogonal directions (vertical/horizontal w/rotation).
  // The minimum of these is half-side; so side = 2*min.
  // Directions: 0° (right), 90° (down), 180° (left), 270° (up), all rotated.
  const orthAngles = [0, 90, 180, 270];
  const sides = orthAngles.map((ang) => {
    const dir = getDirVec(ang, rotation);
    const pt = getPolygonRayIntersection(center, dir, polygonPoints);
    if (!pt) return Infinity;
    return Math.hypot(pt.x - center.x, pt.y - center.y);
  });
  // Clamp to positive values for degenerate cases
  const halfSide = Math.max(1, Math.min(...sides)) * 0.95 * scale;
  const squareSide = halfSide * 2;

  // gridY and gridX: 3 equal intervals
  const lines: {x1:number, y1:number, x2:number, y2:number}[] = [];

  // Compute the 2 vertical and 2 horizontal grid lines, in square space centered at center
  for (let i = -1; i <= 1; i += 2) {
    // i = -1 ("left"/"top"), i = +1 ("right"/"bottom")
    // Vertical lines: x = center.x + (i * squareSide / 6)
    lines.push({
      x1: center.x + (i * squareSide) / 6,
      y1: center.y - halfSide,
      x2: center.x + (i * squareSide) / 6,
      y2: center.y + halfSide,
    });
    // Horizontal lines: y = center.y + (i * squareSide / 6)
    lines.push({
      x1: center.x - halfSide,
      y1: center.y + (i * squareSide) / 6,
      x2: center.x + halfSide,
      y2: center.y + (i * squareSide) / 6,
    });
  }

  // Rotate all corners and grid lines as needed
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

  // Create square corners for Marma bounding box (for 3x3 grid)
  const gridTL = rotate(center.x - halfSide, center.y - halfSide);
  const gridTR = rotate(center.x + halfSide, center.y - halfSide);
  const gridBR = rotate(center.x + halfSide, center.y + halfSide);
  const gridBL = rotate(center.x - halfSide, center.y + halfSide);

  // 3x3 cells: draw as 9 polygons clipped to the inside of the plot polygon (optional, keep simple)
  // We'll just draw the full grid and rely on the plot outline to show the grid is clipped, for better performance.

  // Draw main polygon outline
  const polygonPath = polygonPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + " Z";

  // SVG viewbox boundary for nice padding
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
      {/* Brahmasthan center */}
      <circle
        cx={center.x}
        cy={center.y}
        r={halfSide * 0.25}
        fill="#a21caf"
        stroke="#ede9fe"
        strokeWidth="3"
      />
    </svg>
  );
};
