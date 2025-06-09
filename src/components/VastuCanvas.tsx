
import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas as FabricCanvas, FabricImage, Polygon, Circle } from "fabric";
import { Button } from "@/components/ui/button";
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
  showDirections?: boolean;
  showEntrances?: boolean;
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
  showDirections = true,
  showEntrances = true
}: VastuCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [mapImageObject, setMapImageObject] = useState<FabricImage | null>(null);
  const [polygonObject, setPolygonObject] = useState<Polygon | null>(null);
  const [centerPointObject, setCenterPointObject] = useState<Circle | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Calculate responsive canvas size for mobile
  const calculateCanvasSize = useCallback(() => {
    if (!containerRef.current) return { width: 800, height: 600 };
    
    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const viewportWidth = window.innerWidth;
    
    // Mobile-first responsive sizing
    let maxWidth: number;
    if (viewportWidth < 640) {
      // Mobile phones
      maxWidth = Math.min(containerWidth - 16, viewportWidth - 32);
    } else if (viewportWidth < 1024) {
      // Tablets
      maxWidth = Math.min(containerWidth - 32, 700);
    } else {
      // Desktop
      maxWidth = Math.min(containerWidth - 48, 1200);
    }
    
    const aspectRatio = 4/3;
    const height = Math.floor(maxWidth / aspectRatio);
    const width = Math.floor(maxWidth);
    
    console.log("Canvas size calculated:", { width, height, viewportWidth, containerWidth });
    
    return { width, height };
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const newSize = calculateCanvasSize();
      setCanvasSize(newSize);
      
      if (fabricCanvas) {
        fabricCanvas.setDimensions(newSize);
        fabricCanvas.renderAll();
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial size calculation
    
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateCanvasSize, fabricCanvas]);

  // Initialize canvas with responsive dimensions
  useEffect(() => {
    if (!canvasRef.current) return;

    const initialSize = calculateCanvasSize();
    setCanvasSize(initialSize);

    const canvas = new FabricCanvas(canvasRef.current, {
      width: initialSize.width,
      height: initialSize.height,
      backgroundColor: "#f8fafc",
      selection: false,
    });

    // Mouse event handlers
    const handleMouseDown = (e: any) => {
      console.log("Mouse down event triggered", { isSelectingPolygon, event: e });
      
      if (!isSelectingPolygon) return;
      
      // Get the pointer position relative to the canvas
      const pointer = canvas.getPointer(e.e);
      console.log("Pointer position:", pointer);
      
      const point = { x: pointer.x, y: pointer.y };
      onPolygonPointAdd(point);
    };

    canvas.on("mouse:down", handleMouseDown);

    setFabricCanvas(canvas);

    return () => {
      canvas.off("mouse:down", handleMouseDown);
      canvas.dispose();
    };
  }, [isSelectingPolygon, onPolygonPointAdd, calculateCanvasSize]);

  // Load map image
  useEffect(() => {
    if (!fabricCanvas || !mapImage) return;

    FabricImage.fromURL(mapImage).then((img) => {
      // Clear existing map image
      if (mapImageObject) {
        fabricCanvas.remove(mapImageObject);
      }

      // Scale image to fit canvas while maintaining aspect ratio
      const canvasWidth = fabricCanvas.width || canvasSize.width;
      const canvasHeight = fabricCanvas.height || canvasSize.height;
      const imgWidth = img.width || 1;
      const imgHeight = img.height || 1;
      
      const scaleX = canvasWidth / imgWidth;
      const scaleY = canvasHeight / imgHeight;
      const scale = Math.min(scaleX, scaleY, 1); // Don't upscale

      img.set({
        scaleX: scale,
        scaleY: scale,
        selectable: false,
        evented: false,
        left: (canvasWidth - imgWidth * scale) / 2,
        top: (canvasHeight - imgHeight * scale) / 2,
      });

      fabricCanvas.add(img);
      fabricCanvas.sendObjectToBack(img);
      setMapImageObject(img);
      fabricCanvas.renderAll();
    });
  }, [fabricCanvas, mapImage, canvasSize]);

  // Update polygon display
  useEffect(() => {
    if (!fabricCanvas) return;

    // Remove existing polygon
    if (polygonObject) {
      fabricCanvas.remove(polygonObject);
      setPolygonObject(null);
    }

    if (polygonPoints.length >= 3) {
      const polygon = new Polygon(polygonPoints, {
        fill: "rgba(59, 130, 246, 0.2)",
        stroke: "#3b82f6",
        strokeWidth: 2,
        selectable: false,
        evented: false,
      });

      fabricCanvas.add(polygon);
      setPolygonObject(polygon);
      console.log("Polygon added with points:", polygonPoints);
    }

    fabricCanvas.renderAll();
  }, [fabricCanvas, polygonPoints]);

  // Update center point indicator
  useEffect(() => {
    console.log("Center point effect triggered", { center, fabricCanvas: !!fabricCanvas });
    
    if (!fabricCanvas) return;

    // Remove existing center point
    if (centerPointObject) {
      fabricCanvas.remove(centerPointObject);
      setCenterPointObject(null);
      console.log("Removed existing center point");
    }

    if (center) {
      console.log("Creating center point at:", center);
      
      const centerPoint = new Circle({
        left: center.x,
        top: center.y,
        radius: 8,
        fill: "#ef4444",
        stroke: "#ffffff",
        strokeWidth: 3,
        originX: "center",
        originY: "center",
        selectable: false,
        evented: false,
      });

      fabricCanvas.add(centerPoint);
      setCenterPointObject(centerPoint);
      console.log("Center point added successfully");
    }

    fabricCanvas.renderAll();
  }, [fabricCanvas, center]);

  const handleFinishSelection = () => {
    if (polygonPoints.length >= 3) {
      onPolygonComplete(polygonPoints);
    }
  };

  // Export function for high-quality PDF
  const exportCanvasData = useCallback(() => {
    if (!fabricCanvas) return null;
    
    return {
      dataURL: fabricCanvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 3 // Higher resolution for PDF export
      }),
      width: fabricCanvas.width,
      height: fabricCanvas.height
    };
  }, [fabricCanvas]);

  // Expose export function to parent
  useEffect(() => {
    if (fabricCanvas) {
      (window as any).exportVastuCanvas = exportCanvasData;
    }
  }, [fabricCanvas, exportCanvasData]);

  // Calculate chakra radius based on canvas size
  const chakraRadius = Math.min(canvasSize.width, canvasSize.height) * 0.15;

  return (
    <div className="w-full max-w-full overflow-hidden" ref={containerRef}>
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl p-6 border-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Vastu Analysis Canvas
            </h3>
            <p className="text-gray-600">Interactive workspace for your Vastu calculations</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            {isSelectingPolygon && (
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                Click to add points
              </div>
            )}
            {isSelectingPolygon && polygonPoints.length >= 3 && (
              <Button
                onClick={handleFinishSelection}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
              >
                Finish Selection
              </Button>
            )}
          </div>
        </div>
        
        <div className="w-full overflow-hidden rounded-2xl border-2 border-gray-200 bg-gray-50 relative shadow-inner">
          <div className="w-full flex justify-center">
            <canvas
              ref={canvasRef}
              className="block border-0 max-w-full h-auto rounded-xl"
              style={{ 
                cursor: isSelectingPolygon ? "crosshair" : "default",
                width: `${canvasSize.width}px`,
                height: `${canvasSize.height}px`,
                maxWidth: "100%",
                display: "block"
              }}
            />
            
            {/* Mathematical Chakra Overlay */}
            {center && (
              <MathematicalChakra
                center={center}
                radius={chakraRadius}
                rotation={chakraRotation}
                opacity={chakraOpacity}
                scale={chakraScale}
                showDirections={showDirections}
                showEntrances={showEntrances}
              />
            )}
          </div>
        </div>

        {polygonPoints.length > 0 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="inline-flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="font-medium">Points: {polygonPoints.length}</span>
              </div>
              {center && (
                <div className="inline-flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium">Center: ({Math.round(center.x)}, {Math.round(center.y)})</span>
                </div>
              )}
              {polygonPoints.length >= 3 && !isSelectingPolygon && (
                <div className="inline-flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <span className="text-emerald-700 font-medium">✓ Area defined</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Debug info */}
        {center && (
          <div className="mt-4 text-xs text-gray-400 bg-gray-100 rounded-lg p-3">
            Canvas: {canvasSize.width}×{canvasSize.height} | Center: ({Math.round(center.x)}, {Math.round(center.y)}) | Rotation: {chakraRotation}° | Directions: {showDirections ? 'ON' : 'OFF'} | Entrances: {showEntrances ? 'ON' : 'OFF'}
          </div>
        )}
      </div>
    </div>
  );
};
