import { useState, useRef, useCallback } from "react";
import { Upload, RotateCw, Download, Trash2, Sparkles, Settings, Home } from "lucide-react";
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

const ROTATION_OFFSET = 9; // Subtract 9 degrees for calculation, per updated user request.

const Index = () => {
  const [mapImage, setMapImage] = useState<string | null>(null);
  const [polygonPoints, setPolygonPoints] = useState<Point[]>([]);
  const [chakraRotation, setChakraRotation] = useState(0);
  const [chakraScale, setChakraScale] = useState(1);
  const [chakraOpacity, setChakraOpacity] = useState(0.7);
  const [showDirections, setShowDirections] = useState(true);
  const [showEntrances, setShowEntrances] = useState(true);
  const [showShaktiChakra, setShowShaktiChakra] = useState(false);
  const [showPlanetsChakra, setShowPlanetsChakra] = useState(false);
  const [showVastuPurush, setShowVastuPurush] = useState(false);
  const [showBarChart, setShowBarChart] = useState(false);
  const [center, setCenter] = useState<Point | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'controls' | 'export'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [forceOverlay, setForceOverlay] = useState<{directions?: boolean; entrances?: boolean}>({});
  const [showMarmaSthan, setShowMarmaSthan] = useState(false);

  const actualShowDirections =
    typeof forceOverlay.directions === "boolean" ? forceOverlay.directions : showDirections;
  const actualShowEntrances =
    typeof forceOverlay.entrances === "boolean" ? forceOverlay.entrances : showEntrances;

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
      setActiveTab('controls');
      toast.success("Map uploaded! Tap on the map to select your plot area.");
    };
    reader.readAsDataURL(file);
  }, []);

  // New helper for area (Shoelace formula)
  const calculatePolygonArea = (points: Point[]): number => {
    if (points.length < 3) return 0;
    let area = 0;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      area += (points[j].x + points[i].x) * (points[j].y - points[i].y);
    }
    return Math.abs(area / 2);
  };

  const calculateCenter = useCallback((points: Point[]): Point => {
    if (points.length === 0) return { x: 0, y: 0 };
    if (points.length < 3) {
      const sumX = points.reduce((sum, point) => sum + point.x, 0);
      const sumY = points.reduce((sum, point) => sum + point.y, 0);
      return {
        x: sumX / points.length,
        y: sumY / points.length
      };
    }

    let area = 0;
    let centroidX = 0;
    let centroidY = 0;

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
      const sumX = points.reduce((sum, point) => sum + point.x, 0);
      const sumY = points.reduce((sum, point) => sum + point.y, 0);
      return {
        x: sumX / points.length,
        y: sumY / points.length
      };
    }

    centroidX = centroidX / (6 * area);
    centroidY = centroidY / (6 * area);

    return {
      x: centroidX,
      y: centroidY
    };
  }, []);

  const handlePolygonComplete = useCallback((points: Point[]) => {
    setPolygonPoints(points);
    const calculatedCenter = calculateCenter(points);
    setCenter(calculatedCenter);
    setActiveTab('controls');
    toast.success(`Chakra positioned! You can now adjust the settings.`);
  }, [calculateCenter]);

  const handleClearPolygon = useCallback(() => {
    setPolygonPoints([]);
    setCenter(null);
    toast.info("Plot selection cleared.");
  }, []);

  const handleRotationChange = useCallback((rotation: number) => {
    setChakraRotation(rotation);
  }, []);

  // Calculate analysis info for passing to PDFExporter
  const totalArea = calculatePolygonArea(polygonPoints);
  const northAngle = chakraRotation;
  const zonesCount = 16; // As per overlay (static)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* App Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
            <img 
              src="/lovable-uploads/18945461-d60b-4bfe-bfb7-5763f60d2ca3.png" 
              alt="Astroshala Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Astroshala</h1>
            <p className="text-xs text-gray-500">BY Somnath Banga</p>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 p-4">
        <Card className="h-full bg-white shadow-sm border-gray-200">
          <VastuCanvas
            mapImage={mapImage}
            polygonPoints={polygonPoints}
            isSelectingPolygon={!center}
            onPolygonPointAdd={(point) => {
              if (!center) {
                const newPoints = [...polygonPoints, point];
                setPolygonPoints(newPoints);
              }
            }}
            onPolygonComplete={handlePolygonComplete}
            center={center}
            chakraRotation={
              chakraRotation - ROTATION_OFFSET
            }
            chakraScale={chakraScale}
            chakraOpacity={chakraOpacity}
            showDirections={actualShowDirections}
            showEntrances={actualShowEntrances}
            showShaktiChakra={showShaktiChakra}
            showPlanetsChakra={showPlanetsChakra}
            showVastuPurush={showVastuPurush}
            showBarChart={showBarChart}
            showMarmaSthan={!!showMarmaSthan} // ensure boolean
          />
        </Card>
      </div>

      {/* Bottom Tab Bar */}
      <div className="bg-white border-t border-gray-200 px-4 py-2 shadow-lg">
        <div className="flex justify-around">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
              activeTab === 'upload' 
                ? 'bg-blue-50 text-blue-600' 
                : 'text-gray-500'
            }`}
          >
            <Upload className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Upload</span>
          </button>
          
          <button
            onClick={() => setActiveTab('controls')}
            className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
              activeTab === 'controls' 
                ? 'bg-blue-50 text-blue-600' 
                : 'text-gray-500'
            }`}
          >
            <Settings className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Controls</span>
          </button>
          
          <button
            onClick={() => setActiveTab('export')}
            className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
              activeTab === 'export' 
                ? 'bg-blue-50 text-blue-600' 
                : 'text-gray-500'
            }`}
          >
            <Download className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Export</span>
          </button>
        </div>
      </div>

      {/* Bottom Sheet Content */}
      <div className="bg-white border-t border-gray-200">
        {activeTab === 'upload' && (
          <div className="p-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Upload Map</h3>
              <p className="text-sm text-gray-600 mb-4">Upload your house plan to get started</p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleImageUpload}
                className="hidden"
              />
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-full mb-3 bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                <Upload className="w-5 h-5 mr-2" />
                Choose Image
              </Button>
              
              {mapImage && (
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Map loaded successfully
                  </div>
                  {polygonPoints.length > 0 && (
                    <Button
                      onClick={handleClearPolygon}
                      variant="outline"
                      className="w-full"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear Selection ({polygonPoints.length} points)
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'controls' && (
          <div className="p-4">
            <ChakraControls
              rotation={chakraRotation}
              scale={chakraScale}
              opacity={chakraOpacity}
              showDirections={actualShowDirections}
              showEntrances={actualShowEntrances}
              showShaktiChakra={showShaktiChakra}
              showPlanetsChakra={showPlanetsChakra}
              showVastuPurush={showVastuPurush}
              showBarChart={showBarChart}
              showMarmaSthan={!!showMarmaSthan} // ensure boolean
              onRotationChange={handleRotationChange}
              onScaleChange={setChakraScale}
              onOpacityChange={setChakraOpacity}
              onShowDirectionsChange={setShowDirections}
              onShowEntrancesChange={setShowEntrances}
              onShowShaktiChakraChange={setShowShaktiChakra}
              onShowPlanetsChakraChange={setShowPlanetsChakra}
              onShowVastuPurushChange={setShowVastuPurush}
              onShowBarChartChange={setShowBarChart}
              onShowMarmaSthanChange={setShowMarmaSthan} // direct setter
              disabled={!center}
            />
          </div>
        )}

        {activeTab === 'export' && (
          <div className="p-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Download className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Export Analysis</h3>
              <p className="text-sm text-gray-600 mb-4">Download your Vastu analysis as PDF</p>
              
              <PDFExporter
                mapImage={mapImage}
                polygonPoints={polygonPoints}
                center={center}
                chakraRotation={chakraRotation}
                chakraScale={chakraScale}
                chakraOpacity={chakraOpacity}
                setForceOverlay={setForceOverlay}
                forceOverlay={forceOverlay}
                totalArea={totalArea}
                northAngle={northAngle}
                zonesCount={zonesCount}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
