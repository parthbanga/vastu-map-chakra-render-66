
import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas as FabricCanvas, FabricImage, Polygon, Circle } from "fabric";

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

    canvas.on("mouse:down", (e) => {
      if (!isSelectingPolygon || !e.pointer) return;
      
      const point = { x: e.pointer.x, y: e.pointer.y };
      onPolygonPointAdd(point);
    });

    // Double-click to complete polygon
    canvas.on("mouse:dblclick", () => {
      if (isSelectingPolygon && polygonPoints.length >= 3) {
        onPolygonComplete(polygonPoints);
      }
    });

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, []);

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
      fabricCanvas.sendToBack(img);
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
    }

    fabricCanvas.renderAll();
  }, [fabricCanvas, polygonPoints]);

  // Load and update Shakti Chakra
  useEffect(() => {
    if (!fabricCanvas || !center) return;

    // Create transparent version of the uploaded Shakti Chakra
    const chakraUrl = "/lovable-uploads/e824cac3-4bde-4c8d-831a-eb96d1098e85.png";

    FabricImage.fromURL(chakraUrl).then((img) => {
      // Remove existing chakra
      if (chakraImageObject) {
        fabricCanvas.remove(chakraImageObject);
      }

      // Make background transparent and apply styling
      img.set({
        left: center.x,
        top: center.y,
        originX: "center",
        originY: "center",
        scaleX: chakraScale * 0.3, // Base scale for good fit
        scaleY: chakraScale * 0.3,
        angle: chakraRotation,
        opacity: chakraOpacity,
        selectable: false,
        evented: false,
      });

      // Apply filters to make white background transparent
      img.filters = [];
      fabricCanvas.add(img);
      setChakraImageObject(img);
      fabricCanvas.renderAll();
    });
  }, [fabricCanvas, center, chakraRotation, chakraScale, chakraOpacity]);

  // Update center point indicator
  useEffect(() => {
    if (!fabricCanvas) return;

    // Remove existing center point
    if (centerPointObject) {
      fabricCanvas.remove(centerPointObject);
      setCenterPointObject(null);
    }

    if (center) {
      const centerPoint = new Circle({
        left: center.x,
        top: center.y,
        radius: 4,
        fill: "#ef4444",
        stroke: "#ffffff",
        strokeWidth: 2,
        originX: "center",
        originY: "center",
        selectable: false,
        evented: false,
      });

      fabricCanvas.add(centerPoint);
      setCenterPointObject(centerPoint);
    }

    fabricCanvas.renderAll();
  }, [fabricCanvas, center]);

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow-lg p-4 border-2 border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Vastu Analysis Canvas
          </h3>
          {isSelectingPolygon && (
            <div className="text-sm text-blue-600 font-medium">
              Click to add points • Double-click to finish
            </div>
          )}
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
      </div>
    </div>
  );
};
