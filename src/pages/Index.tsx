
import { useState, useRef, useCallback } from "react";
import { Upload, RotateCw, Download, Trash2, Move, MousePointer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { VastuCanvas } from "@/components/VastuCanvas";
import { PolygonSelector } from "@/components/PolygonSelector";
import { ChakraControls } from "@/components/ChakraControls";
import { PDFExporter } from "@/components/PDFExporter";

interface Point {
  x: number;
  y: number;
}

const Index = () => {
  const [mapImage, setMapImage] = useState<string | null>(null);
  const [polygonPoints, setPolygonPoints] = useState<Point[]>([]);
  const [isSelectingPolygon, setIsSelectingPolygon] = useState(false);
  const [chakraRotation, setChakraRotation] = useState(0);
  const [chakraScale, setChakraScale] = useState(1);
  const [chakraOpacity, setChakraOpacity] = useState(0.7);
  const [center, setCenter] = useState<Point | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
      toast.error("Please upload a JPG or PNG image");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      setMapImage(imageData);
      setPolygonPoints([]);
      setCenter(null);
      toast.success("Map uploaded successfully!");
    };
    reader.readAsDataURL(file);
  }, []);

  const calculateCenter = useCallback((points: Point[]): Point => {
    if (points.length === 0) return { x: 0, y: 0 };
    if (points.length < 3) {
      // For less than 3 points, just use average
      const sumX = points.reduce((sum, point) => sum + point.x, 0);
      const sumY = points.reduce((sum, point) => sum + point.y, 0);
      return {
        x: sumX / points.length,
        y: sumY / points.length
      };
    }

    // Calculate polygon centroid (area-weighted center)
    let area = 0;
    let centroidX = 0;
    let centroidY = 0;

    // Use shoelace formula for polygon area and centroid
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      const xi = points[i].x;
      const yi = points[i].y;
      const xj = points[j].x;
      const yj = points[j].y;
      
      const crossProduct = xi * yj - xj * yi;
      area += crossProduct;
      centroidX += (xi + xj) * crossProduct;
      centroidY += (yi + yj) * crossProduct;
    }

    area = area / 2;
    
    if (Math.abs(area) < 0.001) {
      // Fallback to simple average if area is too small
      const sumX = points.reduce((sum, point) => sum + point.x, 0);
      const sumY = points.reduce((sum, point) => sum + point.y, 0);
      return {
        x: sumX / points.length,
        y: sumY / points.length
      };
    }

    centroidX = centroidX / (6 * area);
    centroidY = centroidY / (6 * area);

    console.log("Polygon area:", Math.abs(area));
    console.log("Calculated centroid:", { x: centroidX, y: centroidY });

    return {
      x: centroidX,
      y: centroidY
    };
  }, []);

  const handlePolygonComplete = useCallback((points: Point[]) => {
    setPolygonPoints(points);
    const calculatedCenter = calculateCenter(points);
    setCenter(calculatedCenter);
    setIsSelectingPolygon(false);
    toast.success(`Polygon area selected! Center calculated at (${Math.round(calculatedCenter.x)}, ${Math.round(calculatedCenter.y)})`);
  }, [calculateCenter]);

  const handleClearPolygon = useCallback(() => {
    setPolygonPoints([]);
    setCenter(null);
    setIsSelectingPolygon(false);
    toast.info("Polygon selection cleared");
  }, []);

  const handleRotationChange = useCallback((rotation: number) => {
    setChakraRotation(rotation);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            Vastu Shakti Chakra Tool
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Professional tool for Vastu practitioners to visualize the 16 zones, 32 entrances, 
            and devtas by overlaying the Shakti Chakra on house maps with precision alignment.
          </p>
        </div>

        {/* Controls Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Upload Section */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              Upload Map
            </h3>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="w-full mb-4"
              variant="outline"
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose Map Image
            </Button>
            {mapImage && (
              <div className="text-sm text-green-600 font-medium">
                ✓ Map loaded successfully
              </div>
            )}
          </Card>

          {/* Polygon Selection */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MousePointer className="w-5 h-5 text-purple-600" />
              Plot Area
            </h3>
            <div className="space-y-3">
              <Button
                onClick={() => setIsSelectingPolygon(!isSelectingPolygon)}
                className="w-full"
                variant={isSelectingPolygon ? "destructive" : "default"}
                disabled={!mapImage}
              >
                {isSelectingPolygon ? "Cancel Selection" : "Select Plot Area"}
              </Button>
              {polygonPoints.length > 0 && (
                <Button
                  onClick={handleClearPolygon}
                  variant="outline"
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Selection
                </Button>
              )}
              {center && (
                <div className="text-sm text-green-600">
                  ✓ Center: ({Math.round(center.x)}, {Math.round(center.y)})
                </div>
              )}
            </div>
          </Card>

          {/* Chakra Controls */}
          <ChakraControls
            rotation={chakraRotation}
            scale={chakraScale}
            opacity={chakraOpacity}
            onRotationChange={handleRotationChange}
            onScaleChange={setChakraScale}
            onOpacityChange={setChakraOpacity}
            disabled={!center}
          />

          {/* Export */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Download className="w-5 h-5 text-green-600" />
              Export
            </h3>
            <PDFExporter
              mapImage={mapImage}
              polygonPoints={polygonPoints}
              center={center}
              chakraRotation={chakraRotation}
              chakraScale={chakraScale}
              chakraOpacity={chakraOpacity}
            />
          </Card>
        </div>

        {/* Main Canvas Area */}
        <Card className="p-6">
          <VastuCanvas
            mapImage={mapImage}
            polygonPoints={polygonPoints}
            isSelectingPolygon={isSelectingPolygon}
            onPolygonPointAdd={(point) => {
              if (isSelectingPolygon) {
                const newPoints = [...polygonPoints, point];
                setPolygonPoints(newPoints);
              }
            }}
            onPolygonComplete={handlePolygonComplete}
            center={center}
            chakraRotation={chakraRotation}
            chakraScale={chakraScale}
            chakraOpacity={chakraOpacity}
          />
        </Card>

        {/* Instructions */}
        <Card className="p-6 mt-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold mb-3 text-blue-800">How to Use</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-blue-700">
            <div className="flex items-start gap-2">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
              <span>Upload your house map (JPG/PNG format)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
              <span>Click "Select Plot Area" and define the building outline by clicking corners</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
              <span>Adjust Shakti Chakra rotation, scale, and opacity as needed</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">4</span>
              <span>Export the final result as a high-quality PDF</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Index;
