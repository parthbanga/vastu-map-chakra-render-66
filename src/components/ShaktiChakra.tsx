interface Point {
  x: number;
  y: number;
}

interface ShaktiChakraProps {
  center: Point;
  radius: number;
  rotation: number;
  opacity: number;
  scale: number;
}

export const ShaktiChakra = ({ center, radius, rotation, opacity, scale }: ShaktiChakraProps) => {
  // Deity names as they appear in the traditional Shakti Chakra
  const deities = [
    "INDRA", "AGNI", "YAMA", "NIRRIT", "VARUN", "VAYU", "KUBER", "ISAAN",
    "BRAHMA", "VISHNU", "RUDRA", "SURYA", "CHANDRA", "MANGAL", "BUDHA", "GURU",
    "SHUKRA", "SHANI", "RAHU", "KETU", "GANESHA", "KARTIKEYA", "DURGA", "LAKSHMI",
    "SARASWATI", "KALI", "PARVATI", "HANUMAN", "BHAIRAV", "DEVI", "SHAKTI", "SHIVA"
  ];

  const scaledRadius = radius * scale;
  const maxPossibleRadius = scaledRadius * 1.2;
  const textPadding = 50;
  const viewBoxSize = (maxPossibleRadius + textPadding) * 2;
  const viewBoxOffset = viewBoxSize / 2;

  // Create concentric circles for different deity groups
  const innerRadius = scaledRadius * 0.3;
  const middleRadius = scaledRadius * 0.6;
  const outerRadius = scaledRadius * 0.9;

  const getPositionOnCircle = (angle: number, r: number): Point => {
    const radian = (angle + rotation) * (Math.PI / 180);
    return {
      x: center.x + r * Math.cos(radian),
      y: center.y + r * Math.sin(radian)
    };
  };

  // Group deities into different rings
  const innerDeities = deities.slice(0, 8); // 8 main directions
  const middleDeities = deities.slice(8, 20); // 12 deities
  const outerDeities = deities.slice(20, 32); // 12 outer deities

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
      {/* Inner circle */}
      <circle
        cx={center.x}
        cy={center.y}
        r={innerRadius}
        fill="none"
        stroke="#ff6b35"
        strokeWidth="2"
        strokeDasharray="5,5"
      />

      {/* Middle circle */}
      <circle
        cx={center.x}
        cy={center.y}
        r={middleRadius}
        fill="none"
        stroke="#ff6b35"
        strokeWidth="2"
        strokeDasharray="5,5"
      />

      {/* Outer circle */}
      <circle
        cx={center.x}
        cy={center.y}
        r={outerRadius}
        fill="none"
        stroke="#ff6b35"
        strokeWidth="2"
        strokeDasharray="5,5"
      />

      {/* Inner deities (8 main directions) */}
      {innerDeities.map((deity, index) => {
        const angle = index * 45 - 90; // Start from top, every 45 degrees
        const position = getPositionOnCircle(angle, innerRadius);
        return (
          <text
            key={`inner-${index}`}
            x={position.x}
            y={position.y}
            textAnchor="middle"
            fontSize="8"
            fontWeight="bold"
            fill="#ff6b35"
            stroke="#ffffff"
            strokeWidth="0.3"
            dominantBaseline="middle"
            style={{ userSelect: 'none' }}
          >
            {deity}
          </text>
        );
      })}

      {/* Middle deities (12 deities) */}
      {middleDeities.map((deity, index) => {
        const angle = index * 30 - 90; // Start from top, every 30 degrees
        const position = getPositionOnCircle(angle, middleRadius);
        return (
          <text
            key={`middle-${index}`}
            x={position.x}
            y={position.y}
            textAnchor="middle"
            fontSize="7"
            fontWeight="bold"
            fill="#e74c3c"
            stroke="#ffffff"
            strokeWidth="0.3"
            dominantBaseline="middle"
            style={{ userSelect: 'none' }}
          >
            {deity}
          </text>
        );
      })}

      {/* Outer deities (12 deities) */}
      {outerDeities.map((deity, index) => {
        const angle = index * 30 - 90; // Start from top, every 30 degrees
        const position = getPositionOnCircle(angle, outerRadius);
        return (
          <text
            key={`outer-${index}`}
            x={position.x}
            y={position.y}
            textAnchor="middle"
            fontSize="6"
            fontWeight="bold"
            fill="#c0392b"
            stroke="#ffffff"
            strokeWidth="0.3"
            dominantBaseline="middle"
            style={{ userSelect: 'none' }}
          >
            {deity}
          </text>
        );
      })}

      {/* Center text */}
      <text
        x={center.x}
        y={center.y}
        textAnchor="middle"
        fontSize="10"
        fontWeight="bold"
        fill="#8b0000"
        stroke="#ffffff"
        strokeWidth="0.5"
        dominantBaseline="middle"
        style={{ userSelect: 'none' }}
      >
        ॐ
      </text>
    </svg>
  );
};