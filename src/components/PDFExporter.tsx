
import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import jsPDF from "jspdf";

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

  const handleExportPDF = async () => {
    if (!mapImage || !center) {
      toast.error("Please upload a map and select the plot area first");
      return;
    }

    setIsExporting(true);
    
    try {
      // Get high-quality canvas data directly from Fabric.js
      const canvasData = (window as any).exportVastuCanvas?.();
      
      if (!canvasData) {
        throw new Error("Canvas export function not available");
      }

      const { dataURL, width, height } = canvasData;
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: width > height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Add title
      pdf.setFontSize(20);
      pdf.setTextColor(51, 51, 51);
      pdf.text('Vastu Shakti Chakra Analysis', 20, 20);

      // Calculate image dimensions to fit page while maintaining aspect ratio
      const maxImgWidth = pageWidth - 40; // 20mm margin on each side
      const maxImgHeight = pageHeight - 80; // Space for title and metadata
      
      const imgAspectRatio = width / height;
      let imgWidth = maxImgWidth;
      let imgHeight = maxImgWidth / imgAspectRatio;
      
      if (imgHeight > maxImgHeight) {
        imgHeight = maxImgHeight;
        imgWidth = maxImgHeight * imgAspectRatio;
      }

      // Add high-quality image
      pdf.addImage(dataURL, 'PNG', 20, 30, imgWidth, imgHeight, undefined, 'FAST');

      // Add metadata
      const metadataY = 35 + imgHeight;
      pdf.setFontSize(12);
      pdf.setTextColor(85, 85, 85);
      
      pdf.text('Analysis Details:', 20, metadataY);
      pdf.setFontSize(10);
      
      const details = [
        `Center Point: (${Math.round(center.x)}, ${Math.round(center.y)})`,
        `Chakra Rotation: ${chakraRotation}°`,
        `Chakra Scale: ${chakraScale.toFixed(2)}`,
        `Chakra Opacity: ${Math.round(chakraOpacity * 100)}%`,
        `Plot Points: ${polygonPoints.length} corners`,
        `Generated: ${new Date().toLocaleString()}`
      ];

      details.forEach((detail, index) => {
        if (metadataY + 10 + (index * 5) < pageHeight - 10) {
          pdf.text(detail, 20, metadataY + 10 + (index * 5));
        }
      });

      // Save the PDF
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      pdf.save(`vastu-chakra-analysis-${timestamp}.pdf`);
      
      toast.success("High-quality PDF exported successfully!");
      
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const canExport = mapImage && center && polygonPoints.length >= 3;

  return (
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
          ✓ Ready to export high-quality PDF
        </div>
      )}
    </div>
  );
};
