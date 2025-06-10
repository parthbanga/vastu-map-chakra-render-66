import { useState, useRef, useCallback } from "react";
import { Upload, RotateCw, Download, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { VastuCanvas } from "@/components/VastuCanvas";
import { ChakraControls } from "@/components/ChakraControls";
import { PDFExporter } from "@/components/PDFExporter";

interface Point {
  x: number;
  y: number;
}

const Index = () => {
  const [mapImage, setMapImage] = useState<string | null>(null);
  const [polygonPoints, setPolygonPoints] = useState<Point[]>([]);
  const [chakraRotation, setChakraRotation] = useState(0);
  const [chakraScale, setChakraScale] = useState(1);
  const [chakraOpacity, setChakraOpacity] = useState(0.7);
  const [showDirections, setShowDirections] = useState(true);
  const [showEntrances, setShowEntrances] = useState(true);
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
      toast.success("Map uploaded successfully! Tap on the map to select your plot area.");
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
    toast.success(`Plot area selected! Chakra positioned at center (${Math.round(calculatedCenter.x)}, ${Math.round(calculatedCenter.y)})`);
  }, [calculateCenter]);

  const handleClearPolygon = useCallback(() => {
    setPolygonPoints([]);
    setCenter(null);
    toast.info("Plot selection cleared. You can now select a new area.");
  }, []);

  const handleRotationChange = useCallback((rotation: number) => {
    setChakraRotation(rotation);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-green-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      <div className="relative container mx-auto px-4 py-8">
        {/* Modern Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-600 bg-clip-text text-transparent">
              Vastu Shakti Chakra
            </h1>
          </div>
          <p className="text-gray-600 max-w-3xl mx-auto text-lg leading-relaxed">
            Professional tool for Vastu practitioners to visualize the 16 zones, 32 entrances, 
            and devtas by overlaying the Shakti Chakra on house maps with precision alignment.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-3 rounded-full border border-blue-200">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">Advanced Mathematical Calculations</span>
          </div>
        </div>

        {/* Simplified Controls Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Upload Section */}
          <Card className="p-8 bg-gradient-to-br from-white to-blue-50/50 border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Upload Map</h3>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-full mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                size="lg"
              >
                <Upload className="w-5 h-5 mr-2" />
                Choose Image
              </Button>
              {mapImage && (
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Map loaded successfully
                  </div>
                  {!center && (
                    <p className="text-xs text-blue-600 font-medium">
                      Now tap on the map to select your plot area
                    </p>
                  )}
                  {polygonPoints.length > 0 && (
                    <Button
                      onClick={handleClearPolygon}
                      variant="outline"
                      className="w-full border-2 hover:bg-gray-50 mt-2"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear Selection ({polygonPoints.length} points)
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Chakra Controls */}
          <ChakraControls
            rotation={chakraRotation}
            scale={chakraScale}
            opacity={chakraOpacity}
            showDirections={showDirections}
            showEntrances={showEntrances}
            onRotationChange={handleRotationChange}
            onScaleChange={setChakraScale}
            onOpacityChange={setChakraOpacity}
            onShowDirectionsChange={setShowDirections}
            onShowEntrancesChange={setShowEntrances}
            disabled={!center}
          />

          {/* Export */}
          <Card className="p-8 bg-gradient-to-br from-white to-green-50/50 border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Download className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-6">Export</h3>
              <PDFExporter
                mapImage={mapImage}
                polygonPoints={polygonPoints}
                center={center}
                chakraRotation={chakraRotation}
                chakraScale={chakraScale}
                chakraOpacity={chakraOpacity}
              />
            </div>
          </Card>
        </div>

        {/* Main Canvas Area */}
        <Card className="p-4 md:p-8 bg-white/80 backdrop-blur-sm border-0 shadow-2xl">
          <VastuCanvas
            mapImage={mapImage}
            polygonPoints={polygonPoints}
            isSelectingPolygon={!center} // Always allow selection until center is set
            onPolygonPointAdd={(point) => {
              if (!center) { // Only add points if chakra is not placed yet
                const newPoints = [...polygonPoints, point];
                setPolygonPoints(newPoints);
              }
            }}
            onPolygonComplete={handlePolygonComplete}
            center={center}
            chakraRotation={chakraRotation}
            chakraScale={chakraScale}
            chakraOpacity={chakraOpacity}
            showDirections={showDirections}
            showEntrances={showEntrances}
          />
        </Card>

        {/* Updated Instructions */}
        <Card className="p-8 mt-8 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-0 shadow-xl">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">How to Use</h3>
            <p className="text-gray-600">Follow these simple steps to create your Vastu analysis</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "1",
                title: "Upload Map",
                description: "Upload your house map in JPG/PNG format",
                icon: Upload,
                color: "from-blue-500 to-indigo-600"
              },
              {
                step: "2", 
                title: "Select Plot Area",
                description: "Tap corners to outline your building. Use 'Finish Selection' button to complete",
                icon: Upload,
                color: "from-purple-500 to-pink-600"
              },
              {
                step: "3",
                title: "Adjust Chakra", 
                description: "Fine-tune rotation, scale, opacity and visibility options",
                icon: RotateCw,
                color: "from-orange-500 to-red-600"
              },
              {
                step: "4",
                title: "Export Result",
                description: "Download the final result as a high-quality PDF",
                icon: Download,
                color: "from-green-500 to-emerald-600"
              }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <div className="bg-white rounded-xl p-4 shadow-lg">
                  <div className={`inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br ${item.color} text-white rounded-full text-sm font-bold mb-3`}>
                    {item.step}
                  </div>
                  <h4 className="font-bold text-gray-800 mb-2">{item.title}</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Index;
