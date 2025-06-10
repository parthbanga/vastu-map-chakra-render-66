import { useRef, useEffect, useState, useCallback } from "react";
import { MathematicalChakra } from "./MathematicalChakra";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

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

  // Calculate canvas dimensions based on container with larger minimum size for mobile
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        const isMobile = window.innerWidth < 768;
        const minWidth = isMobile ? Math.max(rect.width - 16, 360) : Math.max(800, rect.width - 32);
        const minHeight = isMobile ? Math.max(rect.height - 16, 500) : Math.max(600, rect.height - 32);
        setCanvasSize({ width: minWidth, height: minHeight });
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

    const rect = canvas.getBoundingClientRect();
    
    let clientX: number, clientY: number;
    
    if ('touches' in event) {
      if (event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      } else if (event.changedTouches && event.changedTouches.length > 0) {
        clientX = event.changedTouches[0].clientX;
        clientY = event.changedTouches[0].clientY;
      } else {
        return null;
      }
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }
    
    const canvasX = clientX - rect.left;
    const canvasY = clientY - rect.top;
    
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    const displayWidth = rect.width;
    const displayHeight = rect.height;
    
    const scaleX = canvasWidth / displayWidth;
    const scaleY = canvasHeight / displayHeight;
    
    const x = canvasX * scaleX;
    const y = canvasY * scaleY;

    return { x, y };
  }, []);

  // Handle canvas clicks - always allow polygon selection when map is loaded
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!mapImage || center) return; // Don't allow selection if chakra is already placed

    event.preventDefault();
    const coords = getEventCoordinates(event);
    
    if (coords) {
      onPolygonPointAdd(coords);
    }
  }, [mapImage, center, onPolygonPointAdd, getEventCoordinates]);

  // Handle touch events - always allow polygon selection when map is loaded
  const handleTouchEnd = useCallback((event: React.TouchEvent<HTMLCanvasElement>) => {
    if (!mapImage || center) return; // Don't allow selection if chakra is already placed
    
    event.preventDefault();
    event.stopPropagation();
    
    const coords = getEventCoordinates(event);
    
    if (coords) {
      onPolygonPointAdd(coords);
    }
  }, [mapImage, center, onPolygonPointAdd, getEventCoordinates]);

  const handleTouchStart = useCallback((event: React.TouchEvent<HTMLCanvasElement>) => {
    if (!mapImage || center) return;
    event.preventDefault();
  }, [mapImage, center]);

  const handleTouchMove = useCallback((event: React.TouchEvent<HTMLCanvasElement>) => {
    if (!mapImage || center) return;
    event.preventDefault();
  }, [mapImage, center]);

  // Handle polygon completion (double-click for desktop)
  const handleCanvasDoubleClick = useCallback(() => {
    if (polygonPoints.length >= 3) {
      onPolygonComplete(polygonPoints);
    }
  }, [polygonPoints, onPolygonComplete]);

  // Calculate radius for chakra based on polygon
  const calculateRadius = useCallback(() => {
    if (!center || polygonPoints.length < 3) return 100;

    let minDistance = Infinity;
    
    polygonPoints.forEach((point) => {
      const distance = Math.sqrt(
        Math.pow(point.x - center.x, 2) + Math.pow(point.y - center.y, 2)
      );
      minDistance = Math.min(minDistance, distance);
    });

    return Math.max(50, minDistance * 0.8);
  }, [center, polygonPoints]);

  return (
    <div ref={containerRef} className="relative w-full min-h-[500px] md:h-[600px] border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50">
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
            className={`absolute inset-0 w-full h-full ${!center ? 'cursor-crosshair' : 'cursor-default'}`}
            style={{ 
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
      
      {/* Instructions and finish button for mobile */}
      {mapImage && !center && (
        <div className="absolute bottom-4 left-4 right-4 space-y-2">
          <div className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
            <p className="text-sm font-medium">
              Tap to add corner points of your plot area
            </p>
            {polygonPoints.length > 0 && (
              <p className="text-xs opacity-90 mt-1">
                Points added: {polygonPoints.length}
              </p>
            )}
          </div>
          
          {/* Mobile finish button */}
          {polygonPoints.length >= 3 && (
            <Button
              onClick={() => onPolygonComplete(polygonPoints)}
              className="w-full bg-green-600 hover:bg-green-700 text-white shadow-lg"
              size="lg"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Finish Selection
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
