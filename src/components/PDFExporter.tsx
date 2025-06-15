
import { useState, useRef } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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

// NEW: Find the *visible* canvas rendered by VastuCanvas
function getVisibleVastuCanvasNode(): HTMLElement | null {
  // Look for a canvas within the app root that matches VastuCanvas's CSS classes
  // We assume only one editable canvas is present (the main one)
  // If more logic is needed to identify the canvas, we can get more specific
  const allCanvases = document.querySelectorAll<HTMLCanvasElement>('canvas');
  // Look for a canvas element that is NOT hidden (left > -9999px)
  for (const canvas of allCanvases) {
    const style = window.getComputedStyle(canvas);
    const left = parseInt(style.left || "0", 10);
    if (!canvas.closest('[style*="left: -9999px"]')) {
      // This is likely the visible canvas!
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

  const handleExportPDF = async () => {
    if (!mapImage || !center) {
      toast.error("Please upload a map and select the plot area first");
      return;
    }
    setIsExporting(true);

    try {
      // NEW: Select the visible canvas DOM node
      const exportNode = getVisibleVastuCanvasNode();
      if (!exportNode) throw new Error("Visual canvas not found!");
      // Wait a little in case any overlay/transition is in progress
      await new Promise(resolve => setTimeout(resolve, 300));
      // Render with html2canvas directly from the visible node
      const canvas = await html2canvas(exportNode as HTMLElement, {
        backgroundColor: "#fff",
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      const dataURL = canvas.toDataURL("image/png", 1.0);

      // Step 2: Compose PDF with this screenshot
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
      pdf.text('Vastu Analysis - Map with Plot Area', pageWidth / 2, marginY, { align: 'center' });
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
    </>
  );
};
