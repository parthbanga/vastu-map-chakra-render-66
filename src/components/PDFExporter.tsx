
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

  const createCanvasFromElements = async (includeMap: boolean, includeDirections: boolean, includeEntrances: boolean, includeShakti: boolean, shaktiScale = 1) => {
    return new Promise<{ dataURL: string; width: number; height: number }>((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      canvas.width = 800;
      canvas.height = 600;
      
      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let loadCount = 0;
      const expectedLoads = includeMap ? (includeShakti ? 2 : 1) : (includeShakti ? 1 : 0);

      const checkComplete = () => {
        loadCount++;
        if (loadCount >= expectedLoads) {
          resolve({
            dataURL: canvas.toDataURL('image/png', 1.0),
            width: canvas.width,
            height: canvas.height
          });
        }
      };

      if (includeMap && mapImage) {
        const img = new Image();
        img.onload = () => {
          const scaleX = canvas.width / img.naturalWidth;
          const scaleY = canvas.height / img.naturalHeight;
          const scale = Math.min(scaleX, scaleY);
          
          const scaledWidth = img.naturalWidth * scale;
          const scaledHeight = img.naturalHeight * scale;
          
          const x = (canvas.width - scaledWidth) / 2;
          const y = (canvas.height - scaledHeight) / 2;
          
          ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

          // Draw polygon if map is included
          if (polygonPoints.length > 0 && center) {
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

            // Draw center point
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(center.x, center.y, 10, 0, 2 * Math.PI);
            ctx.fill();
          }

          if (!includeShakti) checkComplete();
        };
        img.src = mapImage;
      }

      // Draw directions and entrances
      if (center && (includeDirections || includeEntrances)) {
        const centerX = center.x;
        const centerY = center.y;
        const radius = Math.max(50, Math.min(centerX, centerY, canvas.width - centerX, canvas.height - centerY) * 0.8);

        if (includeDirections) {
          // Draw 16 direction lines
          ctx.strokeStyle = '#4ade80';
          ctx.lineWidth = 2;
          for (let i = 0; i < 16; i++) {
            const angle = (i * 22.5 + chakraRotation) * Math.PI / 180;
            const x1 = centerX + Math.cos(angle) * radius * 0.3;
            const y1 = centerY + Math.sin(angle) * radius * 0.3;
            const x2 = centerX + Math.cos(angle) * radius;
            const y2 = centerY + Math.sin(angle) * radius;
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }

          // Draw direction labels
          ctx.fillStyle = '#059669';
          ctx.font = 'bold 14px Arial';
          ctx.textAlign = 'center';
          const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
          
          for (let i = 0; i < 16; i++) {
            const angle = (i * 22.5 + chakraRotation) * Math.PI / 180;
            const labelRadius = radius * 0.6;
            const x = centerX + Math.cos(angle) * labelRadius;
            const y = centerY + Math.sin(angle) * labelRadius + 5;
            ctx.fillText(directions[i], x, y);
          }
        }

        if (includeEntrances) {
          // Draw 32 entrance points
          ctx.fillStyle = '#f59e0b';
          for (let i = 0; i < 32; i++) {
            const angle = (i * 11.25 + chakraRotation) * Math.PI / 180;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
          }
        }
      }

      // Draw Shakti Chakra
      if (includeShakti) {
        const shaktiImg = new Image();
        shaktiImg.onload = () => {
          const scaledRadius = (Math.max(50, Math.min(center!.x, center!.y, canvas.width - center!.x, canvas.height - center!.y) * 0.8)) * shaktiScale;
          const imageSize = scaledRadius * 2.2;
          
          const x = center!.x - imageSize / 2;
          const y = center!.y - imageSize / 2;
          
          ctx.save();
          ctx.translate(center!.x, center!.y);
          ctx.rotate((chakraRotation) * Math.PI / 180);
          ctx.translate(-center!.x, -center!.y);
          ctx.drawImage(shaktiImg, x, y, imageSize, imageSize);
          ctx.restore();
          
          checkComplete();
        };
        shaktiImg.src = "/lovable-uploads/801d501a-6d1d-4499-a2f1-899c650beb3b.png";
      }

      if (expectedLoads === 0) {
        checkComplete();
      }
    });
  };

  const handleExportPDF = async () => {
    if (!mapImage || !center) {
      toast.error("Please upload a map and select the plot area first");
      return;
    }

    setIsExporting(true);
    
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Page 1: Map with plot area
      pdf.setFontSize(20);
      pdf.setTextColor(51, 51, 51);
      pdf.text('Vastu Analysis - Map with Plot Area', 20, 20);

      const mapCanvas = await createCanvasFromElements(true, false, false, false);
      const maxImgWidth = pageWidth - 40;
      const maxImgHeight = pageHeight - 60;
      
      const imgAspectRatio = mapCanvas.width / mapCanvas.height;
      let imgWidth = maxImgWidth;
      let imgHeight = maxImgWidth / imgAspectRatio;
      
      if (imgHeight > maxImgHeight) {
        imgHeight = maxImgHeight;
        imgWidth = maxImgHeight * imgAspectRatio;
      }

      pdf.addImage(mapCanvas.dataURL, 'PNG', 20, 30, imgWidth, imgHeight, undefined, 'FAST');

      // Page 2: 16 Zones
      pdf.addPage();
      pdf.setFontSize(20);
      pdf.text('Vastu Analysis - 16 Directional Zones', 20, 20);

      const directionsCanvas = await createCanvasFromElements(true, true, false, false);
      pdf.addImage(directionsCanvas.dataURL, 'PNG', 20, 30, imgWidth, imgHeight, undefined, 'FAST');

      // Page 3: 32 Entrances
      pdf.addPage();
      pdf.setFontSize(20);
      pdf.text('Vastu Analysis - 32 Entrances', 20, 20);

      const entrancesCanvas = await createCanvasFromElements(true, false, true, false);
      pdf.addImage(entrancesCanvas.dataURL, 'PNG', 20, 30, imgWidth, imgHeight, undefined, 'FAST');

      // Page 4: Shakti Chakra (3x zoom)
      pdf.addPage();
      pdf.setFontSize(20);
      pdf.text('Vastu Analysis - Shakti Chakra (3x)', 20, 20);

      const shaktiCanvas = await createCanvasFromElements(true, false, false, true, 3);
      pdf.addImage(shaktiCanvas.dataURL, 'PNG', 20, 30, imgWidth, imgHeight, undefined, 'FAST');

      // Add metadata on last page
      const metadataY = 30 + imgHeight + 20;
      if (metadataY < pageHeight - 60) {
        pdf.setFontSize(12);
        pdf.setTextColor(85, 85, 85);
        
        pdf.text('Analysis Details:', 20, metadataY);
        pdf.setFontSize(10);
        
        const details = [
          `Center Point: (${Math.round(center.x)}, ${Math.round(center.y)})`,
          `Chakra Rotation: ${chakraRotation}°`,
          `Chakra Scale: ${chakraScale.toFixed(2)}`,
          `Plot Points: ${polygonPoints.length} corners`,
          `Generated: ${new Date().toLocaleString()}`
        ];

        details.forEach((detail, index) => {
          if (metadataY + 15 + (index * 6) < pageHeight - 10) {
            pdf.text(detail, 20, metadataY + 15 + (index * 6));
          }
        });
      }

      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      pdf.save(`vastu-chakra-analysis-${timestamp}.pdf`);
      
      toast.success("Multi-page PDF exported successfully!");
      
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
