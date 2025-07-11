
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
  // Debug: Check center positioning
  console.log('AstroVastu Debug:', {
    centerX: center.x,
    centerY: center.y,
    radius,
    scale,
    rotation
  });

  const scaledRadius = radius * scale;
  const imageSize = scaledRadius * 1.6; // Further reduced to ensure proper centering
  
  // Debug: Check calculated positioning
  console.log('AstroVastu Positioning:', {
    scaledRadius,
    imageSize,
    containerTop: center.y - imageSize / 2,
    containerLeft: center.x - imageSize / 2,
    transformOriginX: imageSize / 2,
    transformOriginY: imageSize / 2
  });
  
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
        src="/lovable-uploads/93526fdf-864e-490b-bfcf-d711194548b2.png"
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
