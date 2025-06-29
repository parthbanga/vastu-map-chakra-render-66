
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
  // Increase the scaling effect - make it more responsive to scale changes
  const scaledRadius = radius * scale * 1.5; // Increased multiplier for better scaling
  const imageSize = scaledRadius * 2.4; // Adjusted for better coverage
  
  return (
    <div
      style={{
        position: 'absolute',
        // Precisely center the container on the polygon center
        top: center.y,
        left: center.x,
        width: imageSize,
        height: imageSize,
        opacity,
        pointerEvents: 'none',
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        transformOrigin: '50% 50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <img
        src="/lovable-uploads/93526fdf-864e-490b-bfcf-d711194548b2.png"
        alt="AstroVastu"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          objectPosition: 'center center',
          display: 'block',
        }}
      />
    </div>
  );
};
