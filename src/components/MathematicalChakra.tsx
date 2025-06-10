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
  polygonPoints?: Point[]; // Add polygon points prop
}

export const MathematicalChakra = ({ 
  center, 
  radius, 
  rotation, 
  opacity, 
  scale,
  showDirections = true,
  showEntrances = true,
  polygonPoints = []
}: MathematicalChakraProps) => {
  const [calculator, setCalculator] = useState<DirectionCalculator | null>(null);

  useEffect(() => {
    const scaledRadius = radius * scale;
    const calc = new DirectionCalculator({
      center,
      radius: scaledRadius,
      rotation,
      scale,
      polygonPoints
    });
    setCalculator(calc);
  }, [center, radius, rotation, scale, polygonPoints]);

  if (!calculator) return null;

  const zoneSectors = calculator.getZoneSectors();
  const directionLabels = calculator.getDirectionLabels();
  const entrancePoints = calculator.getEntrancePoints();
  const radialLines = calculator.getRadialLineEndpoints();

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

      {/* Radial lines from center to polygon boundary */}
      {radialLines.map((line, index) => (
        <line
          key={`radial-${index}`}
          x1={line.start.x}
          y1={line.start.y}
          x2={line.end.x}
          y2={line.end.y}
          stroke="#333"
          strokeWidth="2"
        />
      ))}

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

      {/* Direction labels - smaller, black, bold text positioned between radial lines */}
      {showDirections && directionLabels.map((label, index) => (
        <text
          key={`label-${index}`}
          x={label.point.x}
          y={label.point.y}
          textAnchor="middle"
          fontSize="10"
          fill="#000"
          fontWeight="bold"
          dominantBaseline="middle"
        >
          {label.label}
        </text>
      ))}
    </svg>
  );
};
