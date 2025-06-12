
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

export const ShaktiChakra = ({ 
  center, 
  radius, 
  rotation, 
  opacity, 
  scale 
}: ShaktiChakraProps) => {
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
        src="/lovable-uploads/2ff9c545-321e-482d-8cf2-d6017d2313f8.png"
        alt="Shakti Chakra"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      />
    </div>
  );
};
