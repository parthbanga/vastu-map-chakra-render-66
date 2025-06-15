
import { useState, useRef } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { MathematicalChakra } from "./MathematicalChakra";

interface Point {
  x: number;
  y: number;
}

interface PDFExporterProps {
  mapImage: string | null;
  polygonPoints: Point[];
  center: Point | null;
  chakraRotation: number;
  chakraScale: number;
  chakraOpacity: number;
}

// Find the actual visible canvas rendered by VastuCanvas (for legacy fallback)
function getVisibleVastuCanvasNode(): HTMLElement | null {
  const allCanvases = document.querySelectorAll<HTMLCanvasElement>('canvas');
  for (const canvas of allCanvases) {
    const style = window.getComputedStyle(canvas);
    if (!canvas.closest('[style*="left: -9999px"]')) {
      return canvas as HTMLElement;
    }
  }
  return null;
}

export const PDFExporter = ({
  mapImage,
  polygonPoints,
  center,
  chakraRotation,
  chakraScale,
  chakraOpacity
}: PDFExporterProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Fixed export size: should match your main canvas (or adjust as you wish)
  const EXPORT_WIDTH = 800;
  const EXPORT_HEIGHT = 600;

  const handleExportPDF = async () => {
    if (!mapImage || !center) {
      toast.error("Please upload a map and select the plot area first");
      return;
    }
    setIsExporting(true);

    try {
      const exportNode = exportRef.current;
      if (!exportNode) throw new Error("Export view not available");
      // Wait for the DOM/layout paint (this ensures overlays render)
      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 1: Capture the hidden export area with html2canvas
      const canvas = await html2canvas(exportNode, {
        backgroundColor: "#fff",
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      const dataURL = canvas.toDataURL("image/png", 1.0);

      // Step 2: Compose PDF and fit image to page
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const marginX = 20;
      const marginY = 20;
      const maxImgWidth = pageWidth - marginX * 2;
      const maxImgHeight = pageHeight - marginY * 2 - 10;
      const imgAspectRatio = canvas.width / canvas.height;
      let imgWidth = maxImgWidth;
      let imgHeight = imgWidth / imgAspectRatio;
      if (imgHeight > maxImgHeight) {
        imgHeight = maxImgHeight;
        imgWidth = imgHeight * imgAspectRatio;
      }

      pdf.setFontSize(18);
      pdf.text('Vastu Analysis - Map with Plot Area, 16 Zones, 32 Entrances', pageWidth / 2, marginY, { align: 'center' });
      pdf.addImage(dataURL, 'PNG', marginX, marginY + 10, imgWidth, imgHeight, undefined, 'FAST');

      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      pdf.save(`vastu-chakra-analysis-${timestamp}.pdf`);
      toast.success("PDF exported successfully!");

    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const canExport = mapImage && center && polygonPoints.length >= 3;

  return (
    <>
      {/* Export Button */}
      <div className="space-y-4">
        <Button
          onClick={handleExportPDF}
          disabled={!canExport || isExporting}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </>
          )}
        </Button>
        {!canExport && (
          <div className="text-sm text-gray-500 text-center">
            <FileText className="w-4 h-4 mx-auto mb-1" />
            Complete all steps to enable PDF export
          </div>
        )}
        {canExport && (
          <div className="text-xs text-green-600 text-center">
            ✓ Ready to export screen-accurate PDF
          </div>
        )}
      </div>

      {/* Hidden export view with all overlays: polygon, center, 16 zones, 32 entrances */}
      <div
        ref={exportRef}
        style={{
          position: "absolute",
          left: "-9999px",
          top: 0,
          width: `800px`,
          height: `600px`,
          pointerEvents: "none",
          opacity: 1,
          background: "#fff",
          zIndex: -999
        }}
        aria-hidden="true"
      >
        {/* Map background and polygon overlay */}
        <div style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: `800px`,
          height: `600px`,
        }}>
          <img
            src={mapImage || ""}
            alt="Map"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain"
            }}
          />
          {/* Polygon overlay */}
          {polygonPoints.length >= 2 && (
            <svg width={800} height={600} style={{ position: "absolute", left: 0, top: 0 }}>
              <polyline
                points={polygonPoints.map(p => `${p.x},${p.y}`).join(" ")}
                fill="rgba(59,130,246,0.1)"
                stroke="#3b82f6"
                strokeWidth="3"
              />
              {polygonPoints.map((p, i) => (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r={8} fill="#3b82f6" />
                  <text x={p.x} y={p.y+5} fontSize="14" fontWeight="bold" textAnchor="middle" fill="#fff">{i+1}</text>
                </g>
              ))}
              {center && (
                <>
                  <circle cx={center.x} cy={center.y} r={10} fill="#ef4444" />
                  <circle cx={center.x} cy={center.y} r={10} stroke="#fff" strokeWidth="3" fill="none" />
                </>
              )}
            </svg>
          )}
        </div>
        {/* MathematicalChakra overlay always with 16 zones and 32 entrances! */}
        {center && (
          <div style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: `800px`,
            height: `600px`,
            pointerEvents: "none"
          }}>
            <MathematicalChakra
              center={center}
              radius={Math.min(800, 600) * 0.3}
              rotation={chakraRotation}
              opacity={chakraOpacity}
              scale={chakraScale}
              showDirections={true}
              showEntrances={true}
              polygonPoints={polygonPoints}
            />
          </div>
        )}
      </div>
    </>
  );
};
