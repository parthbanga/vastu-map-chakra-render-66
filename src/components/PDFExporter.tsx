
import { useState, useRef } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import jsPDF from "jspdf";
// New: import html2canvas
import html2canvas from "html2canvas";

import { VastuCanvas } from "./VastuCanvas"; // For hidden export view

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

export const PDFExporter = ({
  mapImage,
  polygonPoints,
  center,
  chakraRotation,
  chakraScale,
  chakraOpacity
}: PDFExporterProps) => {
  const [isExporting, setIsExporting] = useState(false);
  // Ref to hidden printable view
  const exportRef = useRef<HTMLDivElement>(null);

  // Helper for dom-to-image with html2canvas
  const captureExportView = async (node: HTMLElement) => {
    // Use high DPI scale for PDF clarity
    return await html2canvas(node, {
      backgroundColor: "#fff",
      scale: 2,
      useCORS: true,
      allowTaint: true
    });
  };

  const handleExportPDF = async () => {
    if (!mapImage || !center) {
      toast.error("Please upload a map and select the plot area first");
      return;
    }
    setIsExporting(true);

    try {
      // Step 1: Ensure hidden element is rendered
      const exportNode = exportRef.current;
      if (!exportNode) throw new Error("Export view not available");

      // Step 2: Wait for browser to paint (guarantee up-to-date DOM)
      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 3: Capture export view with html2canvas
      const canvas = await captureExportView(exportNode);
      const dataURL = canvas.toDataURL("image/png", 1.0);

      // Step 4: Compose PDF with this screenshot
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const maxImgWidth = pageWidth - 40;
      const maxImgHeight = pageHeight - 60;

      const imgAspectRatio = canvas.width / canvas.height;
      let imgWidth = maxImgWidth;
      let imgHeight = maxImgWidth / imgAspectRatio;
      if (imgHeight > maxImgHeight) {
        imgHeight = maxImgHeight;
        imgWidth = maxImgHeight * imgAspectRatio;
      }

      pdf.setFontSize(20);
      pdf.text('Vastu Analysis - Map with Plot Area', 20, 20);
      pdf.addImage(dataURL, 'PNG', 20, 30, imgWidth, imgHeight, undefined, 'FAST');

      // TODO: Future - Add more pages using the same technique for directions/entrances
      // For now, do 1 page for accurate user visual

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
      {/* Hidden export view */}
      <div
        ref={exportRef}
        style={{
          position: "absolute",
          left: "-9999px",
          top: 0,
          width: "800px",
          height: "600px",
          pointerEvents: "none",
          opacity: 1,
          background: "#fff",
          zIndex: -999
        }}
        aria-hidden="true"
      >
        <VastuCanvas
          mapImage={mapImage}
          polygonPoints={polygonPoints}
          isSelectingPolygon={false}
          onPolygonPointAdd={() => {}}
          onPolygonComplete={() => {}}
          center={center}
          chakraRotation={chakraRotation}
          chakraScale={chakraScale}
          chakraOpacity={chakraOpacity}
          showDirections={false}
          showEntrances={false}
          showShaktiChakra={false}
          showPlanetsChakra={false}
          showVastuPurush={false}
          showBarChart={false}
        />
      </div>
    </>
  );
};
