
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
  
  // Calculate viewBox to contain all elements with proper padding
  // Account for the furthest elements (compass directions at 1.10 * scaledRadius)
  const maxElementRadius = scaledRadius * 1.15; // Slightly more than compass radius of 1.10
  const padding = scaledRadius * 0.3; // Reduced base padding since we account for max element radius
  const viewBoxSize = (maxElementRadius + padding) * 2;
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

      {/* 32 Entrance points - positioned closer to outer circle */}
      {showEntrances && entrancePoints.map((entrance, index) => {
        const angle = entrance.entrance.angle + rotation;
        const radian = (angle * Math.PI) / 180;
        const entranceRadius = scaledRadius * 0.98; // Closer to circle edge
        const labelRadius = scaledRadius * 1.05; // Reduced for better scaling
        
        const entrancePoint = {
          x: center.x + Math.sin(radian) * entranceRadius,
          y: center.y - Math.cos(radian) * entranceRadius
        };
        
        const labelPoint = {
          x: center.x + Math.sin(radian) * labelRadius,
          y: center.y - Math.cos(radian) * labelRadius
        };
        
        return (
          <g key={`entrance-${index}`}>
            {/* Entrance circle - smaller for better mobile visibility */}
            <circle
              cx={entrancePoint.x}
              cy={entrancePoint.y}
              r="4"
              fill="#ff0000"
              stroke="#ffffff"
              strokeWidth="1"
            />
            
            {/* Compact label background */}
            <rect
              x={labelPoint.x - 8}
              y={labelPoint.y - 12}
              width="16"
              height="10"
              fill="rgba(255, 255, 255, 0.9)"
              stroke="#000"
              strokeWidth="0.3"
              rx="1"
            />
            
            {/* Entrance label - smaller font */}
            <text
              x={labelPoint.x}
              y={labelPoint.y - 5}
              textAnchor="middle"
              fontSize="7"
              fontWeight="bold"
              fill="#000"
            >
              {entrance.entrance.name}
            </text>
          </g>
        );
      })}

      {/* Main compass directions - positioned closer */}
      {compassDirections.map((dir, index) => (
        <g key={`compass-${index}`}>
          <circle
            cx={dir.point.x}
            cy={dir.point.y}
            r="6"
            fill="#fff"
            stroke="#333"
            strokeWidth="1.5"
          />
          <text
            x={dir.point.x}
            y={dir.point.y + 3}
            textAnchor="middle"
            fontSize="10"
            fontWeight="bold"
            fill="#333"
          >
            {dir.direction}
          </text>
        </g>
      ))}

      {/* Zone labels - positioned closer to circle */}
      {showDirections && directionLabels.map((label, index) => (
        <text
          key={`label-${index}`}
          x={label.point.x}
          y={label.point.y}
          textAnchor="middle"
          fontSize="8"
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
        r="3"
        fill="#333"
        stroke="#fff"
        strokeWidth="1.5"
      />
    </svg>
  );
};
