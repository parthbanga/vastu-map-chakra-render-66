import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas as FabricCanvas, FabricImage, Polygon, Circle } from "fabric";
import { Button } from "@/components/ui/button";

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
  chakraOpacity
}: VastuCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [mapImageObject, setMapImageObject] = useState<FabricImage | null>(null);
  const [polygonObject, setPolygonObject] = useState<Polygon | null>(null);
  const [chakraImageObject, setChakraImageObject] = useState<FabricImage | null>(null);
  const [centerPointObject, setCenterPointObject] = useState<Circle | null>(null);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
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
  }, [isSelectingPolygon, onPolygonPointAdd]);

  // Load map image
  useEffect(() => {
    if (!fabricCanvas || !mapImage) return;

    FabricImage.fromURL(mapImage).then((img) => {
      // Clear existing map image
      if (mapImageObject) {
        fabricCanvas.remove(mapImageObject);
      }

      // Scale image to fit canvas while maintaining aspect ratio
      const canvasWidth = fabricCanvas.width || 800;
      const canvasHeight = fabricCanvas.height || 600;
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
  }, [fabricCanvas, mapImage]);

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

  // Load and update Shakti Chakra with canvas bounds constraint
  useEffect(() => {
    console.log("Chakra effect triggered", { center, fabricCanvas: !!fabricCanvas });
    
    if (!fabricCanvas || !center) {
      console.log("Skipping chakra - no canvas or center");
      return;
    }

    const chakraUrl = "/lovable-uploads/e824cac3-4bde-4c8d-831a-eb96d1098e85.png";
    console.log("Loading chakra from:", chakraUrl);

    FabricImage.fromURL(chakraUrl).then((img) => {
      console.log("Chakra image loaded successfully");
      
      // Remove existing chakra
      if (chakraImageObject) {
        fabricCanvas.remove(chakraImageObject);
        console.log("Removed existing chakra");
      }

      const canvasWidth = fabricCanvas.width || 800;
      const canvasHeight = fabricCanvas.height || 600;
      const imgWidth = img.width || 1;
      const imgHeight = img.height || 1;

      // Calculate maximum scale that keeps chakra within canvas bounds
      const maxScaleX = canvasWidth / imgWidth;
      const maxScaleY = canvasHeight / imgHeight;
      const maxScale = Math.min(maxScaleX, maxScaleY) * 0.9; // 90% of max to add some padding
      
      // Constrain the user's scale to not exceed canvas bounds
      const constrainedScale = Math.min(chakraScale * 0.5, maxScale);

      // Configure chakra image
      img.set({
        left: center.x,
        top: center.y,
        originX: "center",
        originY: "center",
        scaleX: constrainedScale,
        scaleY: constrainedScale,
        angle: chakraRotation,
        opacity: chakraOpacity,
        selectable: false,
        evented: false,
      });

      fabricCanvas.add(img);
      setChakraImageObject(img);
      console.log("Chakra added at center:", center, "with constrained scale:", constrainedScale);
      fabricCanvas.renderAll();
    }).catch((error) => {
      console.error("Failed to load chakra image:", error);
    });
  }, [fabricCanvas, center, chakraRotation, chakraScale, chakraOpacity]);

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

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow-lg p-4 border-2 border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Vastu Analysis Canvas
          </h3>
          <div className="flex items-center gap-3">
            {isSelectingPolygon && (
              <div className="text-sm text-blue-600 font-medium">
                Click to add points
              </div>
            )}
            {isSelectingPolygon && polygonPoints.length >= 3 && (
              <Button
                onClick={handleFinishSelection}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                Finish Selection
              </Button>
            )}
          </div>
        </div>
        
        <div className="relative overflow-hidden rounded-lg border border-gray-300">
          <canvas
            ref={canvasRef}
            className="max-w-full block"
            style={{ cursor: isSelectingPolygon ? "crosshair" : "default" }}
          />
        </div>

        {polygonPoints.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            <div className="flex flex-wrap gap-4">
              <span>Points selected: {polygonPoints.length}</span>
              {center && (
                <span>Center: ({Math.round(center.x)}, {Math.round(center.y)})</span>
              )}
              {polygonPoints.length >= 3 && !isSelectingPolygon && (
                <span className="text-green-600 font-medium">✓ Area defined</span>
              )}
            </div>
          </div>
        )}

        {/* Debug info */}
        {center && (
          <div className="mt-2 text-xs text-gray-500">
            Debug: Center point should be visible at ({Math.round(center.x)}, {Math.round(center.y)})
            {chakraImageObject && " | Shakti Chakra loaded"}
          </div>
        )}
      </div>
    </div>
  );
};
