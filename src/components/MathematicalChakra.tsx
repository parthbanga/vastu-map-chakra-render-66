
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
  showDirections?: boolean;
  showEntrances?: boolean;
}

export const MathematicalChakra = ({ 
  center, 
  radius, 
  rotation, 
  opacity, 
  scale,
  showDirections = true,
  showEntrances = true
}: MathematicalChakraProps) => {
  const [calculator, setCalculator] = useState<DirectionCalculator | null>(null);

  useEffect(() => {
    const scaledRadius = radius * scale;
    const calc = new DirectionCalculator({
      center,
      radius: scaledRadius,
      rotation,
      scale
    });
    setCalculator(calc);
  }, [center, radius, rotation, scale]);

  if (!calculator) return null;

  const zoneSectors = calculator.getZoneSectors();
  const directionLabels = calculator.getDirectionLabels();
  const entrancePoints = calculator.getEntrancePoints();

  const scaledRadius = radius * scale;
  
  const maxPossibleRadius = scaledRadius * 1.1;
  const textPadding = 30;
  const viewBoxSize = (maxPossibleRadius + textPadding) * 2;
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
      {/* Zone sectors for coloring - triangular sectors from center to boundary */}
      {zoneSectors.map((sector, index) => (
        <path
          key={`sector-${index}`}
          d={sector.path}
          fill={sector.color}
          fillOpacity="0.3"
          stroke="none"
        />
      ))}

      {/* Radial lines from center to map boundary - 16 main direction lines */}
      {Array.from({ length: 16 }, (_, i) => {
        const angle = i * (360 / 16) + rotation;
        const radian = (angle * Math.PI) / 180;
        const outerPoint = {
          x: center.x + Math.sin(radian) * scaledRadius,
          y: center.y - Math.cos(radian) * scaledRadius
        };
        
        return (
          <line
            key={`radial-${i}`}
            x1={center.x}
            y1={center.y}
            x2={outerPoint.x}
            y2={outerPoint.y}
            stroke="#333"
            strokeWidth="2"
          />
        );
      })}

      {/* 32 Entrance points - text labels positioned along radial lines */}
      {showEntrances && entrancePoints.map((entrance, index) => {
        return (
          <text
            key={`entrance-${index}`}
            x={entrance.point.x}
            y={entrance.point.y}
            textAnchor="middle"
            fontSize="12"
            fontWeight="bold"
            fill="#000"
            stroke="#fff"
            strokeWidth="1"
          >
            {entrance.entrance.name}
          </text>
        );
      })}

      {/* Direction labels - positioned along the radial lines */}
      {showDirections && directionLabels.map((label, index) => (
        <text
          key={`label-${index}`}
          x={label.point.x}
          y={label.point.y}
          textAnchor="middle"
          fontSize="16"
          fill="#000"
          fontWeight="bold"
          stroke="#fff"
          strokeWidth="1.5"
          transform={`rotate(${label.angle > 90 && label.angle < 270 ? label.angle + 180 : label.angle}, ${label.point.x}, ${label.point.y})`}
        >
          {label.label}
        </text>
      ))}
    </svg>
  );
};
