import { useRef, useEffect, useState, useCallback } from "react";
import { MathematicalChakra } from "./MathematicalChakra";
import { ShaktiChakra } from "./ShaktiChakra";
import { PlanetsChakra } from "./PlanetsChakra";
import { VastuPurush } from "./VastuPurush";
import { DirectionalBarChart } from "./DirectionalBarChart";
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
  showShaktiChakra: boolean;
  showPlanetsChakra: boolean;
  showVastuPurush: boolean;
  showBarChart: boolean;
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
  showShaktiChakra,
  showPlanetsChakra,
  showVastuPurush,
  showBarChart,
}: VastuCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 });

  // Calculate canvas dimensions for mobile-first design
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        const width = Math.max(rect.width - 16, 320);
        const height = Math.max(rect.height - 16, 400);
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
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const scaleX = canvas.width / img.naturalWidth;
      const scaleY = canvas.height / img.naturalHeight;
      const scale = Math.min(scaleX, scaleY);
      
      const scaledWidth = img.naturalWidth * scale;
      const scaledHeight = img.naturalHeight * scale;
      
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
          
          polygonPoints.forEach((point, index) => {
            ctx.fillStyle = '#3b82f6';
            ctx.beginPath();
            ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText((index + 1).toString(), point.x, point.y + 5);
          });
        }

        if (center) {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(center.x, center.y, 10, 0, 2 * Math.PI);
          ctx.fill();
          
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      };
      img.src = mapImage;
    }
  }, [polygonPoints, center, mapImage, imageLoaded]);

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

  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!mapImage || center) return;

    event.preventDefault();
    const coords = getEventCoordinates(event);
    
    if (coords) {
      onPolygonPointAdd(coords);
    }
  }, [mapImage, center, onPolygonPointAdd, getEventCoordinates]);

  const handleTouchEnd = useCallback((event: React.TouchEvent<HTMLCanvasElement>) => {
    if (!mapImage || center) return;
    
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

  const handleFinishPolygon = useCallback(() => {
    if (polygonPoints.length >= 3) {
      onPolygonComplete(polygonPoints);
    }
  }, [polygonPoints, onPolygonComplete]);

  return (
    // ***** THIS is the KEY WRAPPER for the screenshot *****
    <div
      ref={containerRef}
      id="vastu-canvas-container"
      className="relative w-full h-full min-h-[400px] bg-white rounded-lg overflow-hidden border border-gray-200"
      style={{ background: "#fff" }}
    >
      {/* == TEST BADGE - should show up in PDF == */}
      <div className="absolute top-4 left-4 z-[2000] bg-yellow-500 text-black px-4 py-2 text-lg font-bold rounded shadow pointer-events-none">
        TEST BADGE
      </div>

      {!mapImage ? (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
          <div className="text-center p-8">
            <div className="text-5xl mb-4">🗺️</div>
            <p className="text-lg font-medium mb-2">No Map Uploaded</p>
            <p className="text-sm text-gray-400">Go to Upload tab to add your house plan</p>
          </div>
        </div>
      ) : (
        <>
          {/* MAIN CANVAS */}
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            onClick={handleCanvasClick}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`absolute inset-0 w-full h-full ${!center ? 'cursor-crosshair' : 'cursor-default'}`}
            style={{ 
              touchAction: 'none',
              userSelect: 'none',
              WebkitUserSelect: 'none'
            }}
          />
          
          {/* Finish Button - appears when selecting polygon and have 3+ points */}
          {isSelectingPolygon && polygonPoints.length >= 3 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
              <Button
                onClick={handleFinishPolygon}
                className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
                size="lg"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Finish Polygon ({polygonPoints.length} points)
              </Button>
            </div>
          )}
          
          {/* == OVERLAYS are rendered HERE, inside the container with id="vastu-canvas-container"! == */}
          {center && (
            <>
              <MathematicalChakra
                center={center}
                radius={calculateRadius()}
                rotation={chakraRotation}
                opacity={chakraOpacity}
                scale={chakraScale}
                showDirections={showDirections}
                showEntrances={showEntrances}
                polygonPoints={polygonPoints}
              />
              
              {showShaktiChakra && (
                <ShaktiChakra
                  center={center}
                  radius={calculateRadius()}
                  rotation={chakraRotation}
                  opacity={chakraOpacity}
                  scale={chakraScale}
                />
              )}

              {showPlanetsChakra && (
                <PlanetsChakra
                  center={center}
                  radius={calculateRadius()}
                  rotation={chakraRotation}
                  opacity={chakraOpacity}
                  scale={chakraScale}
                  polygonPoints={polygonPoints}
                />
              )}

              {showVastuPurush && (
                <VastuPurush
                  center={center}
                  radius={calculateRadius()}
                  rotation={chakraRotation}
                  opacity={chakraOpacity}
                  scale={chakraScale}
                />
              )}

              {showBarChart && (
                <DirectionalBarChart
                  center={center}
                  polygonPoints={polygonPoints}
                  rotation={chakraRotation}
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};
