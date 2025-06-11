
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
  const entranceRadialLines = calculator.getEntranceRadialLines();

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

      {/* Radial lines from center to polygon boundary for 16 directions - only show when directions are enabled */}
      {showDirections && radialLines.map((line, index) => (
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

      {/* Radial lines for 32 entrances - only show when entrances are enabled */}
      {showEntrances && entranceRadialLines.map((line, index) => (
        <line
          key={`entrance-radial-${index}`}
          x1={line.start.x}
          y1={line.start.y}
          x2={line.end.x}
          y2={line.end.y}
          stroke="#666"
          strokeWidth="1"
          strokeDasharray="3,3"
        />
      ))}

      {/* 32 Entrance points - positioned at polygon boundary without colors or circles */}
      {showEntrances && entrancePoints.map((entrance, index) => {
        return (
          <text
            key={`entrance-${index}`}
            x={entrance.point.x}
            y={entrance.point.y}
            textAnchor="middle"
            fontSize="10"
            fontWeight="bold"
            fill="#000"
            stroke="#fff"
            strokeWidth="0.5"
            dominantBaseline="middle"
          >
            {entrance.entrance.name}
          </text>
        );
      })}

      {/* Direction labels - abbreviated names positioned in center of zone sectors */}
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
          style={{ userSelect: 'none' }}
        >
          {label.label}
        </text>
      ))}
    </svg>
  );
};
