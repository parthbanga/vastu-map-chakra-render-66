import { useRef, useEffect, useState, useCallback } from "react";
import { MathematicalChakra } from "./MathematicalChakra";

interface Point {
  x: number;
  y: number;
}

interface VastuCanvasProps {
  mapImage: string | null;
  polygonPoints: Point[];
  isSelectingPolygon: boolean;
  onPolygonPointAdd: (point: Point) => void;
  onPolygonComplete: (points: Point[]) => void;
  center: Point | null;
  chakraRotation: number;
  chakraScale: number;
  chakraOpacity: number;
  showDirections: boolean;
  showEntrances: boolean;
}

export const VastuCanvas = ({
  mapImage,
  polygonPoints,
  isSelectingPolygon,
  onPolygonPointAdd,
  onPolygonComplete,
  center,
  chakraRotation,
  chakraScale,
  chakraOpacity,
  showDirections,
  showEntrances,
}: VastuCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 });

  // Calculate canvas dimensions based on container
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        const width = Math.max(800, rect.width - 32); // 32px for padding
        const height = Math.max(600, rect.height - 32);
        setCanvasSize({ width, height });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Load and draw the map image
  useEffect(() => {
    if (!mapImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      setImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Calculate scaling to fit image in canvas while maintaining aspect ratio
      const scaleX = canvas.width / img.naturalWidth;
      const scaleY = canvas.height / img.naturalHeight;
      const scale = Math.min(scaleX, scaleY);
      
      const scaledWidth = img.naturalWidth * scale;
      const scaledHeight = img.naturalHeight * scale;
      
      // Center the image
      const x = (canvas.width - scaledWidth) / 2;
      const y = (canvas.height - scaledHeight) / 2;
      
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
      setImageLoaded(true);
    };
    img.src = mapImage;
  }, [mapImage, canvasSize]);

  // Draw polygon points and lines
  useEffect(() => {
    if (!canvasRef.current || !imageLoaded) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Redraw the background image first
    if (mapImage) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const scaleX = canvas.width / img.naturalWidth;
        const scaleY = canvas.height / img.naturalHeight;
        const scale = Math.min(scaleX, scaleY);
        
        const scaledWidth = img.naturalWidth * scale;
        const scaledHeight = img.naturalHeight * scale;
        
        const x = (canvas.width - scaledWidth) / 2;
        const y = (canvas.height - scaledHeight) / 2;
        
        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
        
        // Draw polygon
        if (polygonPoints.length > 0) {
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 3;
          ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
          
          ctx.beginPath();
          ctx.moveTo(polygonPoints[0].x, polygonPoints[0].y);
          
          for (let i = 1; i < polygonPoints.length; i++) {
            ctx.lineTo(polygonPoints[i].x, polygonPoints[i].y);
          }
          
          if (polygonPoints.length > 2) {
            ctx.closePath();
            ctx.fill();
          }
          ctx.stroke();
          
          // Draw points
          polygonPoints.forEach((point, index) => {
            ctx.fillStyle = '#3b82f6';
            ctx.beginPath();
            ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI);
            ctx.fill();
            
            // Draw point numbers
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText((index + 1).toString(), point.x, point.y + 4);
          });
        }

        // Draw center point if it exists
        if (center) {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(center.x, center.y, 8, 0, 2 * Math.PI);
          ctx.fill();
          
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      };
      img.src = mapImage;
    }
  }, [polygonPoints, center, mapImage, imageLoaded]);

  // Get accurate coordinates from touch/mouse events
  const getEventCoordinates = useCallback((event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    // Get the canvas bounding rect
    const rect = canvas.getBoundingClientRect();
    
    let clientX: number, clientY: number;
    
    if ('touches' in event) {
      // Touch event - use the first touch point
      if (event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      } else if (event.changedTouches && event.changedTouches.length > 0) {
        // For touchend events
        clientX = event.changedTouches[0].clientX;
        clientY = event.changedTouches[0].clientY;
      } else {
        return null;
      }
    } else {
      // Mouse event
      clientX = event.clientX;
      clientY = event.clientY;
    }
    
    // Calculate coordinates relative to the canvas element
    const canvasX = clientX - rect.left;
    const canvasY = clientY - rect.top;
    
    // Get the actual canvas internal dimensions
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // Get the displayed canvas dimensions
    const displayWidth = rect.width;
    const displayHeight = rect.height;
    
    // Calculate the scale factors
    const scaleX = canvasWidth / displayWidth;
    const scaleY = canvasHeight / displayHeight;
    
    // Convert to canvas coordinates
    const x = canvasX * scaleX;
    const y = canvasY * scaleY;

    console.log('Touch coordinates:', {
      clientX, clientY,
      canvasX, canvasY,
      rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      canvas: { width: canvasWidth, height: canvasHeight },
      scale: { x: scaleX, y: scaleY },
      final: { x, y }
    });

    return { x, y };
  }, []);

  // Handle canvas clicks with proper coordinate calculation for mobile
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isSelectingPolygon) return;

    event.preventDefault();
    const coords = getEventCoordinates(event);
    
    if (coords) {
      onPolygonPointAdd(coords);
    }
  }, [isSelectingPolygon, onPolygonPointAdd, getEventCoordinates]);

  // Handle touch events specifically
  const handleTouchEnd = useCallback((event: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isSelectingPolygon) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    const coords = getEventCoordinates(event);
    
    if (coords) {
      onPolygonPointAdd(coords);
    }
  }, [isSelectingPolygon, onPolygonPointAdd, getEventCoordinates]);

  // Prevent default touch behaviors
  const handleTouchStart = useCallback((event: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isSelectingPolygon) return;
    event.preventDefault();
  }, [isSelectingPolygon]);

  const handleTouchMove = useCallback((event: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isSelectingPolygon) return;
    event.preventDefault();
  }, [isSelectingPolygon]);

  // Handle polygon completion (double-click or right-click)
  const handleCanvasDoubleClick = useCallback(() => {
    if (isSelectingPolygon && polygonPoints.length >= 3) {
      onPolygonComplete(polygonPoints);
    }
  }, [isSelectingPolygon, polygonPoints, onPolygonComplete]);

  const handleCanvasRightClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    if (isSelectingPolygon && polygonPoints.length >= 3) {
      onPolygonComplete(polygonPoints);
    }
  }, [isSelectingPolygon, polygonPoints, onPolygonComplete]);

  // Calculate radius for chakra based on polygon
  const calculateRadius = useCallback(() => {
    if (!center || polygonPoints.length < 3) return 100;

    // Find the minimum distance from center to any polygon edge
    let minDistance = Infinity;
    
    polygonPoints.forEach((point) => {
      const distance = Math.sqrt(
        Math.pow(point.x - center.x, 2) + Math.pow(point.y - center.y, 2)
      );
      minDistance = Math.min(minDistance, distance);
    });

    return Math.max(50, minDistance * 0.8); // Ensure minimum radius and some padding
  }, [center, polygonPoints]);

  return (
    <div ref={containerRef} className="relative w-full h-[600px] border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50">
      {!mapImage ? (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <div className="text-6xl mb-4">🗺️</div>
            <p className="text-lg font-medium">Upload a map to get started</p>
            <p className="text-sm text-gray-400 mt-2">JPG or PNG format supported</p>
          </div>
        </div>
      ) : (
        <>
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            onClick={handleCanvasClick}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onDoubleClick={handleCanvasDoubleClick}
            onContextMenu={handleCanvasRightClick}
            className={`absolute inset-0 ${isSelectingPolygon ? 'cursor-crosshair' : 'cursor-default'}`}
            style={{ 
              maxWidth: '100%', 
              maxHeight: '100%', 
              touchAction: 'none',
              userSelect: 'none',
              WebkitUserSelect: 'none'
            }}
          />
          
          {center && (
            <MathematicalChakra
              center={center}
              radius={calculateRadius()}
              rotation={chakraRotation}
              opacity={chakraOpacity}
              scale={chakraScale}
              showDirections={showDirections}
              showEntrances={showEntrances}
            />
          )}
        </>
      )}
      
      {isSelectingPolygon && (
        <div className="absolute bottom-4 left-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm font-medium">
            Tap to add points • Double-tap to finish
          </p>
          {polygonPoints.length > 0 && (
            <p className="text-xs opacity-90 mt-1">
              Points added: {polygonPoints.length}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
