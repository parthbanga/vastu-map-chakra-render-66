
import { useEffect, useState } from 'react';
import { DirectionCalculator } from './DirectionCalculator';

interface Point {
  x: number;
  y: number;
}

interface PlanetsChakraProps {
  center: Point;
  radius: number;
  rotation: number;
  opacity: number;
  scale: number;
  polygonPoints?: Point[];
}

export const PlanetsChakra = ({ 
  center, 
  radius, 
  rotation, 
  opacity, 
  scale,
  polygonPoints = []
}: PlanetsChakraProps) => {
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

  const scaledRadius = radius * scale;
  
  // Define the 8 planets with their colors and positions
  const planets = [
    { name: 'Sun', color: '#FFD700', angle: 0 },
    { name: 'Moon', color: '#C0C0C0', angle: 45 },
    { name: 'Mars', color: '#CD5C5C', angle: 90 },
    { name: 'Mercury', color: '#87CEEB', angle: 135 },
    { name: 'Jupiter', color: '#FFA500', angle: 180 },
    { name: 'Venus', color: '#FFB6C1', angle: 225 },
    { name: 'Saturn', color: '#800080', angle: 270 },
    { name: 'Rahu', color: '#2F4F4F', angle: 315 }
  ];

  const maxPossibleRadius = scaledRadius * 1.1;
  const textPadding = 30;
  const viewBoxSize = (maxPossibleRadius + textPadding) * 2;
  const viewBoxOffset = viewBoxSize / 2;

  // Calculate planet positions based on rotation
  const getPlanetPosition = (planetAngle: number) => {
    const totalAngle = (planetAngle + rotation) * (Math.PI / 180);
    const planetRadius = scaledRadius * 0.8; // Position planets inside the chakra
    return {
      x: center.x + Math.cos(totalAngle) * planetRadius,
      y: center.y + Math.sin(totalAngle) * planetRadius
    };
  };

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
      {/* Main chakra circle */}
      <circle
        cx={center.x}
        cy={center.y}
        r={scaledRadius}
        fill="none"
        stroke="#8B4513"
        strokeWidth="3"
        strokeDasharray="5,5"
      />

      {/* Planet circles and labels */}
      {planets.map((planet, index) => {
        const position = getPlanetPosition(planet.angle);
        return (
          <g key={`planet-${index}`}>
            {/* Planet circle */}
            <circle
              cx={position.x}
              cy={position.y}
              r="15"
              fill={planet.color}
              stroke="#333"
              strokeWidth="2"
            />
            {/* Planet name */}
            <text
              x={position.x}
              y={position.y + 25}
              textAnchor="middle"
              fontSize="8"
              fontWeight="bold"
              fill="#000"
              stroke="#fff"
              strokeWidth="0.5"
              dominantBaseline="middle"
            >
              {planet.name}
            </text>
          </g>
        );
      })}

      {/* Center star pattern */}
      <g transform={`rotate(${rotation} ${center.x} ${center.y})`}>
        {/* 8-pointed star */}
        {Array.from({ length: 8 }, (_, i) => {
          const angle = (i * 45) * (Math.PI / 180);
          const innerRadius = scaledRadius * 0.2;
          const outerRadius = scaledRadius * 0.4;
          
          const innerX = center.x + Math.cos(angle) * innerRadius;
          const innerY = center.y + Math.sin(angle) * innerRadius;
          const outerX = center.x + Math.cos(angle) * outerRadius;
          const outerY = center.y + Math.sin(angle) * outerRadius;
          
          return (
            <line
              key={`star-line-${i}`}
              x1={innerX}
              y1={innerY}
              x2={outerX}
              y2={outerY}
              stroke="#8B4513"
              strokeWidth="2"
            />
          );
        })}
      </g>
    </svg>
  );
};
