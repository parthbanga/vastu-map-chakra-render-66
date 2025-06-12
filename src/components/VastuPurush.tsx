
interface Point {
  x: number;
  y: number;
}

interface VastuPurushProps {
  center: Point;
  radius: number;
  rotation: number;
  opacity: number;
  scale: number;
}

export const VastuPurush = ({ 
  center, 
  radius, 
  rotation, 
  opacity, 
  scale 
}: VastuPurushProps) => {
  const scaledRadius = radius * scale;
  const imageSize = scaledRadius * 2.2; // Make the image cover the full chakra area
  
  return (
    <div
      style={{
        position: 'absolute',
        top: center.y - imageSize / 2,
        left: center.x - imageSize / 2,
        width: imageSize,
        height: imageSize,
        opacity,
        pointerEvents: 'none',
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center',
      }}
    >
      <img
        src="/lovable-uploads/375e8a62-28de-4842-b2d6-6d8352bc9e93.png"
        alt="Vastu Purush"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      />
    </div>
  );
};
