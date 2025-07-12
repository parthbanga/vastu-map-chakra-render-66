interface Point {
  x: number;
  y: number;
}

interface AstroVastuProps {
  center: Point;
  radius: number;
  rotation: number;
  opacity: number;
  scale: number;
}

export const AstroVastu = ({ 
  center, 
  radius, 
  rotation, 
  opacity, 
  scale 
}: AstroVastuProps) => {
  const scaledRadius = radius * scale;
  const imageSize = scaledRadius * 2;
  
  return (
    <div
      style={{
        position: 'absolute',
        top: center.y - scaledRadius,
        left: center.x - scaledRadius,
        width: scaledRadius * 2,
        height: scaledRadius * 2,
        opacity,
        pointerEvents: 'none',
        transform: `rotate(${rotation}deg)`,
        transformOrigin: `${scaledRadius}px ${scaledRadius}px`,
      }}
    >
      <img
        src="/lovable-uploads/5c7549ba-4000-4ff0-8083-187d64bc4934.png"
        alt="AstroVastu"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      />
    </div>
  );
};