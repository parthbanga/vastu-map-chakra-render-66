
import { useState } from "react";
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
      // Find the canvas element
      const canvasElement = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvasElement) {
        throw new Error("Canvas not found");
      }

      // Create a higher resolution version for PDF
      const canvas = await html2canvas(canvasElement, {
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff"
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Add title
      pdf.setFontSize(20);
      pdf.setTextColor(51, 51, 51);
      pdf.text('Vastu Shakti Chakra Analysis', 20, 20);

      // Add image
      const imgWidth = 250;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 20, 30, imgWidth, imgHeight);

      // Add metadata
      const metadataY = 30 + imgHeight + 20;
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
        pdf.text(detail, 20, metadataY + 10 + (index * 5));
      });

      // Add zones information
      const zonesY = metadataY + 50;
      pdf.setFontSize(12);
      pdf.setTextColor(51, 51, 51);
      pdf.text('Shakti Chakra Information:', 20, zonesY);
      
      pdf.setFontSize(9);
      pdf.setTextColor(85, 85, 85);
      const zonesInfo = [
        '• 16 Zones: Each zone represents specific energies and influences',
        '• 32 Entrances: Strategic entry points for optimal energy flow',
        '• Devta Positions: Divine energies placed according to Vastu principles',
        '• Directional Alignment: Proper orientation for maximum benefits',
        '• Center Point: Brahmasthan - the most sacred energy center'
      ];

      zonesInfo.forEach((info, index) => {
        pdf.text(info, 20, zonesY + 10 + (index * 4));
      });

      // Save the PDF
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
