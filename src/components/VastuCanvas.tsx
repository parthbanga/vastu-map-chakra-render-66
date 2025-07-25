
import { useRef, useEffect, useState, useCallback } from "react";
import { MathematicalChakra } from "./MathematicalChakra";
import { ShaktiChakra } from "./ShaktiChakra";
import { AstroVastu } from "./AstroVastu";
import { PlanetsChakra } from "./PlanetsChakra";
import { VastuPurush } from "./VastuPurush";
import { VastuPurush2 } from "./VastuPurush2";
import { DirectionalBarChart } from "./DirectionalBarChart";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { MarmaSthanOverlay } from "./MarmaSthanOverlay";

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
  showAstroVastu: boolean;
  showPlanetsChakra: boolean;
  showVastuPurush: boolean;
  showVastuPurush2: boolean;
  showBarChart: boolean;
  /** If true: overlays are drawn directly onto the main canvas (for PDF/screenshot exporting) */
  drawOverlaysOnCanvas?: boolean;
  showMarmaSthan?: boolean;
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
  showAstroVastu,
  showPlanetsChakra,
  showVastuPurush,
  showVastuPurush2,
  showBarChart,
  drawOverlaysOnCanvas = false,
  showMarmaSthan,
}: VastuCanvasProps & { showMarmaSthan?: boolean }) => {
  // DEBUG: Quick log for blank render diagnosis
  console.log("Rendering VastuCanvas with:", { mapImage, polygonPoints, isSelectingPolygon, center });

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

  // Helper to draw MathematicalChakra overlays onto the main canvas for export/print
  const drawMathematicalChakraOntoCanvas = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      center: Point,
      radius: number,
      rotation: number,
      scale: number,
      polygonPoints: Point[],
      drawDirections: boolean,
      drawEntrances: boolean
    ) => {
      // The logic here mimics DirectionCalculator used in MathematicalChakra
      // (But simplified: radial lines, direction labels, entrance points)
      if (!center || radius < 10) return;

      // Directions: 16
      const directionLabels = [
        "N", "NNE", "NE", "ENE",
        "E", "ESE", "SE", "SSE",
        "S", "SSW", "SW", "WSW",
        "W", "WNW", "NW", "NNW"
      ];
      const directionAngles = Array.from({length: 16}, (_, i) => rotation + i * (360/16));

      const deg2rad = (deg: number) => (deg * Math.PI) / 180;

      // Draw radial lines + labels for directions
      if (drawDirections) {
        for (let i = 0; i < 16; i++) {
          const angle = deg2rad(directionAngles[i]-90);
          const x2 = center.x + radius * scale * Math.cos(angle);
          const y2 = center.y + radius * scale * Math.sin(angle);

          // Radial line
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(center.x, center.y);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = "#333";
          ctx.lineWidth = 2;
          ctx.globalAlpha = 1;
          ctx.stroke();
          ctx.restore();

          // Direction label
          const labelR = radius * scale * 1.14;
          const lx = center.x + labelR * Math.cos(angle);
          const ly = center.y + labelR * Math.sin(angle);

          ctx.save();
          ctx.font = "bold 14px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#000";
          ctx.globalAlpha = 1;
          ctx.fillText(directionLabels[i], lx, ly);
          ctx.restore();
        }
      }

      // Entrances: 32 -- show as black bold label with white outline
      if (drawEntrances) {
        for (let i = 0; i < 32; i++) {
          const angle = deg2rad(rotation + i * (360/32) - 90);
          const er = radius * scale * 1.08;
          const ex = center.x + er * Math.cos(angle);
          const ey = center.y + er * Math.sin(angle);

          const entranceName = String(i+1);

          ctx.save();
          ctx.font = "bold 10px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = "#fff";
          ctx.globalAlpha = 1;
          ctx.strokeText(entranceName, ex, ey);
          ctx.fillStyle = "#000";
          ctx.fillText(entranceName, ex, ey);
          ctx.restore();
        }
      }
    }, []
  );

  // Draw polygon points and lines + overlays (when exporting)
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

        // Drawing user polygon
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

        // Draw center dot
        if (center) {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(center.x, center.y, 10, 0, 2 * Math.PI);
          ctx.fill();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.stroke();
        }

        // Overlay directions and entrances DIRECTLY ON CANVAS when exporting!
        // **THIS IS CRUCIAL:**
        if (
          drawOverlaysOnCanvas &&
          center &&
          polygonPoints.length >= 3
        ) {
          let minDistance = Infinity;
          polygonPoints.forEach((point) => {
            const distance = Math.sqrt(
              Math.pow(point.x - center.x, 2) + Math.pow(point.y - center.y, 2)
            );
            minDistance = Math.min(minDistance, distance);
          });
          const radius = Math.max(50, minDistance * 0.8);
          // Both overlays ON during export for compatibility
          drawMathematicalChakraOntoCanvas(
            ctx,
            center,
            radius,
            chakraRotation,
            chakraScale,
            polygonPoints,
            showDirections,
            showEntrances
          );
        }
      };
      img.src = mapImage;
    }
  }, [
    polygonPoints,
    center,
    mapImage,
    imageLoaded,
    drawOverlaysOnCanvas,
    drawMathematicalChakraOntoCanvas,
    chakraRotation,
    chakraScale,
    showDirections,
    showEntrances
  ]);

  // DIAGNOSTICS: Log relevant Marma Sthan data
  useEffect(() => {
    if (showMarmaSthan) {
      console.log('[VastuCanvas] MarmaSthanOverlay check:', {
        showMarmaSthan,
        polygonPointsLength: polygonPoints.length,
        polygonPoints,
        center,
        chakraRotation,
        chakraOpacity,
        chakraScale
      });
    }
  }, [showMarmaSthan, polygonPoints, center, chakraRotation, chakraOpacity, chakraScale]);

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

  // Calculate overlay radius for MathematicalChakra (SVG overlay)
  const getOverlayRadius = useCallback(() => {
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
    <>
      {/* Main Canvas Area */}
      <div
        ref={containerRef}
        id="vastu-canvas-container"
        className="relative w-full h-full min-h-[400px] bg-white rounded-lg overflow-hidden border border-gray-200"
        style={{ background: "#fff" }}
      >
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
            touchAction: "none",
            userSelect: "none",
            WebkitUserSelect: "none",
            zIndex: 0
          }}
        />

        {/* Overlay: No Map Uploaded */}
        {!mapImage && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 z-[3000] pointer-events-none bg-white bg-opacity-90">
            <div className="text-center p-8">
              <div className="text-5xl mb-4">🗺️</div>
              <p className="text-lg font-medium mb-2">No Map Uploaded</p>
              <p className="text-sm text-gray-400">Go to Upload tab to add your house plan</p>
            </div>
          </div>
        )}

        {/* Overlay: Map uploaded, but no polygon yet */}
        {mapImage && polygonPoints.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-[2000] pointer-events-none">
            <div className="text-center bg-white/90 px-8 py-8 rounded-lg shadow-lg border mx-auto">
              <div className="text-4xl mb-2 text-blue-500">✏️</div>
              <p className="font-semibold text-lg mb-1">Draw Your Plot</p>
              <p className="text-sm text-gray-700">Click on the map to select at least 3 points defining your house plot.</p>
              <p className="text-xs text-gray-400 mt-2">Polygon selection required to enable Vastu overlays.</p>
            </div>
          </div>
        )}

        {/* When not exporting, render SVG overlays as before */}
        {!drawOverlaysOnCanvas && center && polygonPoints.length >= 3 && (
          <>
            {/* Directions + Entrances Chakra */}
            <MathematicalChakra
              center={center}
              radius={getOverlayRadius()}
              rotation={chakraRotation}
              opacity={chakraOpacity}
              scale={chakraScale}
              showDirections={showDirections}
              showEntrances={showEntrances}
              polygonPoints={polygonPoints}
            />

            {/* Show Shakti Chakra image overlay if toggle is enabled */}
            {showShaktiChakra && (
              <ShaktiChakra
                center={center}
                radius={getOverlayRadius()}
                rotation={chakraRotation + 9} // Use the user-entered rotation (not offset), compensating for the -9 elsewhere
                opacity={chakraOpacity}
                scale={chakraScale}
              />
            )}

            {/* Show AstroVastu image overlay if toggle is enabled */}
            {showAstroVastu && (
              <AstroVastu
                center={center}
                radius={getOverlayRadius()}
                rotation={chakraRotation + 9} // Use the user-entered rotation (not offset), compensating for the -9 elsewhere
                opacity={chakraOpacity}
                scale={chakraScale}
              />
            )}

            {/* Show Planets Chakra overlay if toggle is enabled */}
            {showPlanetsChakra && (
              <PlanetsChakra
                center={center}
                radius={getOverlayRadius()}
                rotation={chakraRotation}
                opacity={chakraOpacity}
                scale={chakraScale}
                polygonPoints={polygonPoints}
              />
            )}

            {/* Show Vastu Purush image overlay if toggle is enabled */}
            {showVastuPurush && (
              <VastuPurush
                center={center}
                radius={getOverlayRadius()}
                rotation={chakraRotation + 9} // Use the user-entered rotation (not offset), compensating for the -9 elsewhere
                opacity={chakraOpacity}
                scale={chakraScale}
              />
            )}

            {/* Show second Vastu Purush image overlay if toggle is enabled */}
            {showVastuPurush2 && (
              <VastuPurush2
                center={center}
                radius={getOverlayRadius()}
                rotation={chakraRotation + 9} // Use the user-entered rotation (not offset), compensating for the -9 elsewhere
                opacity={chakraOpacity}
                scale={chakraScale}
              />
            )}

            {/* Show Directional Bar Chart if enabled */}
            {showBarChart && (
              <DirectionalBarChart
                center={center}
                polygonPoints={polygonPoints}
                rotation={chakraRotation}
              />
            )}

            {/* Show Marma Sthan if enabled and 3+ sided plot */}
            {(showMarmaSthan && polygonPoints.length >= 3) ? (
              <MarmaSthanOverlay
                polygonPoints={polygonPoints}
                center={center}
                rotation={chakraRotation}
                opacity={chakraOpacity}
                scale={chakraScale}
              />
            ) : null}
          </>
        )}
      </div>

      {/* Finish Polygon Button - move OUTSIDE of the overlayed canvas, keep it below */}
      {isSelectingPolygon && polygonPoints.length >= 3 && (
        <div className="w-full flex justify-center mt-4 mb-2">
          <Button
            onClick={handleFinishPolygon}
            className="bg-green-600 hover:bg-green-700 text-white shadow-lg w-full max-w-xs"
            size="lg"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Finish Polygon ({polygonPoints.length} points)
          </Button>
        </div>
      )}
    </>
  );
};
