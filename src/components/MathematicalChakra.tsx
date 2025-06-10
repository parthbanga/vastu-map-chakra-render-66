
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
  const compassDirections = calculator.getCompassDirections();
  const directionLabels = calculator.getDirectionLabels();
  const entrancePoints = calculator.getEntrancePoints();

  const scaledRadius = radius * scale;
  
  // Reduced viewBox size since we're only showing lines within map boundary
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
      {/* Zone sectors for coloring - no circles, just sectors */}
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

      {/* Radial lines for 16 zones - extending from center to map boundary */}
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

      {/* 32 Entrance points - positioned along radial lines */}
      {showEntrances && entrancePoints.map((entrance, index) => {
        return (
          <g key={`entrance-${index}`}>
            {/* Entrance circle */}
            <circle
              cx={entrance.point.x}
              cy={entrance.point.y}
              r="4"
              fill="#ff0000"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
            
            {/* Entrance label - larger and bolder */}
            <text
              x={entrance.point.x}
              y={entrance.point.y - 10}
              textAnchor="middle"
              fontSize="8"
              fontWeight="bold"
              fill="#000"
              stroke="#fff"
              strokeWidth="0.8"
            >
              {entrance.entrance.name}
            </text>
          </g>
        );
      })}

      {/* Main compass directions */}
      {compassDirections.map((dir, index) => (
        <g key={`compass-${index}`}>
          <circle
            cx={dir.point.x}
            cy={dir.point.y}
            r="10"
            fill="#fff"
            stroke="#333"
            strokeWidth="2"
          />
          <text
            x={dir.point.x}
            y={dir.point.y + 4}
            textAnchor="middle"
            fontSize="14"
            fontWeight="bold"
            fill="#333"
          >
            {dir.direction}
          </text>
        </g>
      ))}

      {/* Zone labels - darker, bigger, and bolder */}
      {showDirections && directionLabels.map((label, index) => (
        <text
          key={`label-${index}`}
          x={label.point.x}
          y={label.point.y}
          textAnchor="middle"
          fontSize="12"
          fill="#000"
          fontWeight="bold"
          stroke="#fff"
          strokeWidth="1"
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
