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

  const captureCanvasView = async (): Promise<{ dataURL: string; width: number; height: number }> => {
    const canvasElement = document.querySelector('[data-testid="vastu-canvas"]') as HTMLElement;
    
    if (!canvasElement) {
      // Fallback to main canvas area
      const mainCanvas = document.querySelector('.min-h-screen .flex-1 .card') as HTMLElement;
      if (!mainCanvas) {
        throw new Error('Canvas element not found');
      }
      
      const canvas = await html2canvas(mainCanvas, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        scale: 2, // High quality
        logging: false,
        ignoreElements: (element) => {
          // Ignore UI controls and buttons - return boolean only
          return element.classList.contains('pointer-events-none') === false && 
                 (element.tagName === 'BUTTON' || 
                  element.classList.contains('bg-white') ||
                  Boolean(element.closest('.bg-white.border-t')));
        }
      });

      return {
        dataURL: canvas.toDataURL('image/png', 1.0),
        width: canvas.width,
        height: canvas.height
      };
    }

    const canvas = await html2canvas(canvasElement, {
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      scale: 2, // High quality export
      logging: false
    });

    return {
      dataURL: canvas.toDataURL('image/png', 1.0),
      width: canvas.width,
      height: canvas.height
    };
  };

  const captureBarChartView = async (): Promise<{ dataURL: string; width: number; height: number } | null> => {
    const barChartElement = document.querySelector('[style*="position: absolute"][style*="backgroundColor: rgba(255, 255, 255, 0.95)"]') as HTMLElement;
    
    if (!barChartElement) {
      return null;
    }

    const canvas = await html2canvas(barChartElement, {
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false
    });

    return {
      dataURL: canvas.toDataURL('image/png', 1.0),
      width: canvas.width,
      height: canvas.height
    };
  };

  const handleExportPDF = async () => {
    if (!mapImage || !center) {
      toast.error("Please upload a map and select the plot area first");
      return;
    }

    setIsExporting(true);
    
    try {
      console.log("Starting PDF export with html2canvas...");
      
      // Capture the main canvas view
      const mainView = await captureCanvasView();
      
      // Determine optimal PDF orientation and size based on canvas dimensions
      const isLandscape = mainView.width > mainView.height;
      const orientation = isLandscape ? 'landscape' : 'portrait';
      
      // Create PDF with custom dimensions to match canvas
      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'px',
        format: [mainView.width, mainView.height]
      });

      // Add the main view to PDF
      pdf.addImage(
        mainView.dataURL, 
        'PNG', 
        0, 
        0, 
        mainView.width, 
        mainView.height, 
        undefined, 
        'FAST'
      );

      // Try to capture bar chart separately if it exists
      const barChartView = await captureBarChartView();
      
      if (barChartView) {
        // Add new page for bar chart
        pdf.addPage([barChartView.width, barChartView.height], barChartView.width > barChartView.height ? 'landscape' : 'portrait');
        
        pdf.addImage(
          barChartView.dataURL,
          'PNG',
          0,
          0,
          barChartView.width,
          barChartView.height,
          undefined,
          'FAST'
        );
      }

      // Add metadata page
      const metadataPageWidth = 800;
      const metadataPageHeight = 600;
      pdf.addPage([metadataPageWidth, metadataPageHeight], 'landscape');

      // Add title
      pdf.setFontSize(24);
      pdf.setTextColor(51, 51, 51);
      pdf.text('Vastu Analysis Report', 50, 80);

      // Add analysis details
      pdf.setFontSize(16);
      pdf.setTextColor(85, 85, 85);
      pdf.text('Analysis Details:', 50, 140);

      pdf.setFontSize(12);
      const details = [
        `Center Point: (${Math.round(center.x)}, ${Math.round(center.y)})`,
        `Chakra Rotation: ${chakraRotation}°`,
        `Chakra Scale: ${chakraScale.toFixed(2)}x`,
        `Chakra Opacity: ${Math.round(chakraOpacity * 100)}%`,
        `Plot Points: ${polygonPoints.length} corners`,
        `Generated: ${new Date().toLocaleString()}`
      ];

      details.forEach((detail, index) => {
        pdf.text(detail, 50, 180 + (index * 25));
      });

      // Add instructions
      pdf.setFontSize(14);
      pdf.setTextColor(51, 51, 51);
      pdf.text('Instructions:', 50, 400);

      pdf.setFontSize(10);
      pdf.setTextColor(85, 85, 85);
      const instructions = [
        '1. This report shows your property layout with Vastu analysis overlay',
        '2. The chakra is positioned at the calculated center point of your plot',
        '3. Directional zones are marked according to traditional Vastu principles',
        '4. Bar chart (if included) shows area distribution by direction'
      ];

      instructions.forEach((instruction, index) => {
        pdf.text(instruction, 50, 430 + (index * 15));
      });

      console.log("Saving PDF...");
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      pdf.save(`vastu-analysis-${timestamp}.pdf`);
      
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
            Capturing & Exporting...
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" />
            Export High-Quality PDF
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
          ✓ Ready to export exact browser view as PDF
        </div>
      )}
      
      <div className="text-xs text-gray-500 text-center">
        Export captures the exact view from your browser including all overlays and charts
      </div>
    </div>
  );
};
