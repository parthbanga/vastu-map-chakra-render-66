
import { useEffect, useState } from 'react';
import { DirectionCalculator } from './DirectionCalculator';

interface Point {
  x: number;
  y: number;
}

interface MathematicalChakraProps {
  center: Point;
  radius: number;
  rotation: number;
  opacity: number;
  scale: number;
}

export const MathematicalChakra = ({ 
  center, 
  radius, 
  rotation, 
  opacity, 
  scale 
}: MathematicalChakraProps) => {
  const [calculator, setCalculator] = useState<DirectionCalculator | null>(null);

  useEffect(() => {
    const scaledRadius = radius * scale;
    const calc = new DirectionCalculator({
      center,
      radius: scaledRadius,
      rotation
    });
    setCalculator(calc);
  }, [center, radius, rotation, scale]);

  if (!calculator) return null;

  const zoneSectors = calculator.getZoneSectors();
  const compassDirections = calculator.getCompassDirections();
  const directionLabels = calculator.getDirectionLabels();
  const entrancePoints = calculator.getEntrancePoints();

  const scaledRadius = radius * scale;
  const viewBoxSize = scaledRadius * 2.5;
  const viewBoxOffset = viewBoxSize / 2;

  return (
    <svg
      width={viewBoxSize}
      height={viewBoxSize}
      viewBox={`${center.x - viewBoxOffset} ${center.y - viewBoxOffset} ${viewBoxSize} ${viewBoxSize}`}
      style={{ 
        position: 'absolute',
        top: center.y - viewBoxOffset,
        left: center.x - viewBoxOffset,
        opacity,
        pointerEvents: 'none',
        overflow: 'visible'
      }}
    >
      {/* Outer circle */}
      <circle
        cx={center.x}
        cy={center.y}
        r={scaledRadius}
        fill="none"
        stroke="#333"
        strokeWidth="2"
      />

      {/* Inner circle */}
      <circle
        cx={center.x}
        cy={center.y}
        r={scaledRadius * 0.3}
        fill="none"
        stroke="#333"
        strokeWidth="1"
      />

      {/* Zone sectors */}
      {zoneSectors.map((sector, index) => (
        <path
          key={`sector-${index}`}
          d={sector.path}
          fill={sector.color}
          fillOpacity="0.3"
          stroke="#333"
          strokeWidth="1"
        />
      ))}

      {/* Radial lines for 16 zones */}
      {Array.from({ length: 16 }, (_, i) => {
        const angle = i * (360 / 16) + rotation;
        const radian = (angle * Math.PI) / 180;
        const innerPoint = {
          x: center.x + Math.sin(radian) * scaledRadius * 0.3,
          y: center.y - Math.cos(radian) * scaledRadius * 0.3
        };
        const outerPoint = {
          x: center.x + Math.sin(radian) * scaledRadius,
          y: center.y - Math.cos(radian) * scaledRadius
        };
        
        return (
          <line
            key={`radial-${i}`}
            x1={innerPoint.x}
            y1={innerPoint.y}
            x2={outerPoint.x}
            y2={outerPoint.y}
            stroke="#333"
            strokeWidth="1"
          />
        );
      })}

      {/* Entrance points (32 small circles) */}
      {entrancePoints.map((entrance, index) => (
        <circle
          key={`entrance-${index}`}
          cx={entrance.point.x}
          cy={entrance.point.y}
          r="3"
          fill="#ff6b6b"
          stroke="#fff"
          strokeWidth="1"
        />
      ))}

      {/* Main compass directions */}
      {compassDirections.map((dir, index) => (
        <g key={`compass-${index}`}>
          <circle
            cx={dir.point.x}
            cy={dir.point.y}
            r="8"
            fill="#fff"
            stroke="#333"
            strokeWidth="2"
          />
          <text
            x={dir.point.x}
            y={dir.point.y + 4}
            textAnchor="middle"
            fontSize="12"
            fontWeight="bold"
            fill="#333"
          >
            {dir.direction}
          </text>
        </g>
      ))}

      {/* Zone labels */}
      {directionLabels.map((label, index) => (
        <text
          key={`label-${index}`}
          x={label.point.x}
          y={label.point.y}
          textAnchor="middle"
          fontSize="10"
          fill="#333"
          fontWeight="500"
          transform={`rotate(${label.angle > 90 && label.angle < 270 ? label.angle + 180 : label.angle}, ${label.point.x}, ${label.point.y})`}
        >
          {label.label}
        </text>
      ))}

      {/* Center point */}
      <circle
        cx={center.x}
        cy={center.y}
        r="4"
        fill="#333"
        stroke="#fff"
        strokeWidth="2"
      />
    </svg>
  );
};
