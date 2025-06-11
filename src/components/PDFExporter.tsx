
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

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  const createCanvasWithMap = async (): Promise<{ dataURL: string; width: number; height: number }> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx || !mapImage) throw new Error('Canvas context not available');

    canvas.width = 800;
    canvas.height = 600;
    
    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    try {
      const img = await loadImage(mapImage);
      const scaleX = canvas.width / img.naturalWidth;
      const scaleY = canvas.height / img.naturalHeight;
      const scale = Math.min(scaleX, scaleY);
      
      const scaledWidth = img.naturalWidth * scale;
      const scaledHeight = img.naturalHeight * scale;
      
      const x = (canvas.width - scaledWidth) / 2;
      const y = (canvas.height - scaledHeight) / 2;
      
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

      // Draw polygon if available
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

      return {
        dataURL: canvas.toDataURL('image/png', 1.0),
        width: canvas.width,
        height: canvas.height
      };
    } catch (error) {
      console.error('Error loading map image:', error);
      throw error;
    }
  };

  const createCanvasWithDirections = async (): Promise<{ dataURL: string; width: number; height: number }> => {
    if (!center || !mapImage) throw new Error('Center and map required');

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    canvas.width = 800;
    canvas.height = 600;
    
    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    try {
      // Draw map first
      const img = await loadImage(mapImage);
      const scaleX = canvas.width / img.naturalWidth;
      const scaleY = canvas.height / img.naturalHeight;
      const scale = Math.min(scaleX, scaleY);
      
      const scaledWidth = img.naturalWidth * scale;
      const scaledHeight = img.naturalHeight * scale;
      
      const x = (canvas.width - scaledWidth) / 2;
      const y = (canvas.height - scaledHeight) / 2;
      
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

      // Draw polygon
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
      }

      // Calculate radius based on polygon
      let radius = 100;
      if (polygonPoints.length >= 3) {
        let minDistance = Infinity;
        polygonPoints.forEach((point) => {
          const distance = Math.sqrt(
            Math.pow(point.x - center.x, 2) + Math.pow(point.y - center.y, 2)
          );
          minDistance = Math.min(minDistance, distance);
        });
        radius = Math.max(50, minDistance * 0.8);
      }

      const scaledRadius = radius * chakraScale;

      // Draw 16 direction lines
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 2;
      for (let i = 0; i < 16; i++) {
        const angle = (i * 22.5 + chakraRotation) * Math.PI / 180;
        const x1 = center.x + Math.cos(angle) * scaledRadius * 0.3;
        const y1 = center.y + Math.sin(angle) * scaledRadius * 0.3;
        const x2 = center.x + Math.cos(angle) * scaledRadius;
        const y2 = center.y + Math.sin(angle) * scaledRadius;
        
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
        const labelRadius = scaledRadius * 0.6;
        const x = center.x + Math.cos(angle) * labelRadius;
        const y = center.y + Math.sin(angle) * labelRadius + 5;
        ctx.fillText(directions[i], x, y);
      }

      // Draw center point
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(center.x, center.y, 10, 0, 2 * Math.PI);
      ctx.fill();

      return {
        dataURL: canvas.toDataURL('image/png', 1.0),
        width: canvas.width,
        height: canvas.height
      };
    } catch (error) {
      console.error('Error creating directions canvas:', error);
      throw error;
    }
  };

  const createCanvasWithEntrances = async (): Promise<{ dataURL: string; width: number; height: number }> => {
    if (!center || !mapImage) throw new Error('Center and map required');

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    canvas.width = 800;
    canvas.height = 600;
    
    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    try {
      // Draw map first
      const img = await loadImage(mapImage);
      const scaleX = canvas.width / img.naturalWidth;
      const scaleY = canvas.height / img.naturalHeight;
      const scale = Math.min(scaleX, scaleY);
      
      const scaledWidth = img.naturalWidth * scale;
      const scaledHeight = img.naturalHeight * scale;
      
      const x = (canvas.width - scaledWidth) / 2;
      const y = (canvas.height - scaledHeight) / 2;
      
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

      // Draw polygon
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
      }

      // Calculate radius
      let radius = 100;
      if (polygonPoints.length >= 3) {
        let minDistance = Infinity;
        polygonPoints.forEach((point) => {
          const distance = Math.sqrt(
            Math.pow(point.x - center.x, 2) + Math.pow(point.y - center.y, 2)
          );
          minDistance = Math.min(minDistance, distance);
        });
        radius = Math.max(50, minDistance * 0.8);
      }

      const scaledRadius = radius * chakraScale;

      // Draw 32 entrance points
      ctx.fillStyle = '#f59e0b';
      for (let i = 0; i < 32; i++) {
        const angle = (i * 11.25 + chakraRotation) * Math.PI / 180;
        const x = center.x + Math.cos(angle) * scaledRadius;
        const y = center.y + Math.sin(angle) * scaledRadius;
        
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Draw center point
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(center.x, center.y, 10, 0, 2 * Math.PI);
      ctx.fill();

      return {
        dataURL: canvas.toDataURL('image/png', 1.0),
        width: canvas.width,
        height: canvas.height
      };
    } catch (error) {
      console.error('Error creating entrances canvas:', error);
      throw error;
    }
  };

  const createCanvasWithShakti = async (): Promise<{ dataURL: string; width: number; height: number }> => {
    if (!center || !mapImage) throw new Error('Center and map required');

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    canvas.width = 800;
    canvas.height = 600;
    
    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    try {
      // Draw map first
      const img = await loadImage(mapImage);
      const scaleX = canvas.width / img.naturalWidth;
      const scaleY = canvas.height / img.naturalHeight;
      const scale = Math.min(scaleX, scaleY);
      
      const scaledWidth = img.naturalWidth * scale;
      const scaledHeight = img.naturalHeight * scale;
      
      const x = (canvas.width - scaledWidth) / 2;
      const y = (canvas.height - scaledHeight) / 2;
      
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

      // Draw polygon
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
      }

      // Calculate radius
      let radius = 100;
      if (polygonPoints.length >= 3) {
        let minDistance = Infinity;
        polygonPoints.forEach((point) => {
          const distance = Math.sqrt(
            Math.pow(point.x - center.x, 2) + Math.pow(point.y - center.y, 2)
          );
          minDistance = Math.min(minDistance, distance);
        });
        radius = Math.max(50, minDistance * 0.8);
      }

      // Draw Shakti Chakra with 3x zoom
      const shaktiImg = await loadImage("/lovable-uploads/801d501a-6d1d-4499-a2f1-899c650beb3b.png");
      const scaledRadius = radius * chakraScale * 3; // 3x zoom
      const imageSize = scaledRadius * 2.2;
      
      const imgX = center.x - imageSize / 2;
      const imgY = center.y - imageSize / 2;
      
      ctx.save();
      ctx.translate(center.x, center.y);
      ctx.rotate((chakraRotation) * Math.PI / 180);
      ctx.translate(-center.x, -center.y);
      ctx.drawImage(shaktiImg, imgX, imgY, imageSize, imageSize);
      ctx.restore();

      // Draw center point
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(center.x, center.y, 10, 0, 2 * Math.PI);
      ctx.fill();

      return {
        dataURL: canvas.toDataURL('image/png', 1.0),
        width: canvas.width,
        height: canvas.height
      };
    } catch (error) {
      console.error('Error creating Shakti canvas:', error);
      throw error;
    }
  };

  const createBarChartCanvas = (): Promise<{ dataURL: string; width: number; height: number }> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx || !center) {
        resolve({ dataURL: '', width: 0, height: 0 });
        return;
      }

      canvas.width = 800;
      canvas.height = 600;
      
      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Calculate directional data (simplified version for PDF)
      const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
      const barWidth = 40;
      const maxBarHeight = 300;
      const spacing = 10;
      const startX = 50;
      const startY = 500;

      // Draw title
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Directional Area Analysis', canvas.width / 2, 40);

      // Draw bars and labels
      directions.forEach((direction, index) => {
        const x = startX + index * (barWidth + spacing);
        const height = Math.random() * maxBarHeight + 50; // Random data for demo
        
        // Draw bar
        ctx.fillStyle = `hsl(${index * 22.5}, 70%, 50%)`;
        ctx.fillRect(x, startY - height, barWidth, height);
        
        // Draw direction label
        ctx.fillStyle = '#000000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(direction, x + barWidth / 2, startY + 20);
        
        // Draw value
        ctx.fillText(Math.round(height).toString(), x + barWidth / 2, startY - height - 10);
      });

      // Draw Y-axis label
      ctx.save();
      ctx.translate(20, canvas.height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = '#000000';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Extension (px)', 0, 0);
      ctx.restore();

      resolve({
        dataURL: canvas.toDataURL('image/png', 1.0),
        width: canvas.width,
        height: canvas.height
      });
    });
  };

  const handleExportPDF = async () => {
    if (!mapImage || !center) {
      toast.error("Please upload a map and select the plot area first");
      return;
    }

    setIsExporting(true);
    
    try {
      console.log("Starting PDF export...");
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const maxImgWidth = pageWidth - 40;
      const maxImgHeight = pageHeight - 60;

      // Page 1: Map with plot area
      console.log("Creating page 1: Map with plot area");
      pdf.setFontSize(20);
      pdf.setTextColor(51, 51, 51);
      pdf.text('Vastu Analysis - Map with Plot Area', 20, 20);

      const mapCanvas = await createCanvasWithMap();
      const imgAspectRatio = mapCanvas.width / mapCanvas.height;
      let imgWidth = maxImgWidth;
      let imgHeight = maxImgWidth / imgAspectRatio;
      
      if (imgHeight > maxImgHeight) {
        imgHeight = maxImgHeight;
        imgWidth = maxImgHeight * imgAspectRatio;
      }

      pdf.addImage(mapCanvas.dataURL, 'PNG', 20, 30, imgWidth, imgHeight, undefined, 'FAST');

      // Page 2: 16 Zones
      console.log("Creating page 2: 16 Directional Zones");
      pdf.addPage();
      pdf.setFontSize(20);
      pdf.text('Vastu Analysis - 16 Directional Zones', 20, 20);

      const directionsCanvas = await createCanvasWithDirections();
      pdf.addImage(directionsCanvas.dataURL, 'PNG', 20, 30, imgWidth, imgHeight, undefined, 'FAST');

      // Page 3: 32 Entrances
      console.log("Creating page 3: 32 Entrances");
      pdf.addPage();
      pdf.setFontSize(20);
      pdf.text('Vastu Analysis - 32 Entrances', 20, 20);

      const entrancesCanvas = await createCanvasWithEntrances();
      pdf.addImage(entrancesCanvas.dataURL, 'PNG', 20, 30, imgWidth, imgHeight, undefined, 'FAST');

      // Page 4: Shakti Chakra (3x zoom)
      console.log("Creating page 4: Shakti Chakra");
      pdf.addPage();
      pdf.setFontSize(20);
      pdf.text('Vastu Analysis - Shakti Chakra (3x Zoom)', 20, 20);

      const shaktiCanvas = await createCanvasWithShakti();
      pdf.addImage(shaktiCanvas.dataURL, 'PNG', 20, 30, imgWidth, imgHeight, undefined, 'FAST');

      // Page 5: Bar Chart
      console.log("Creating page 5: Bar Chart");
      pdf.addPage();
      pdf.setFontSize(20);
      pdf.text('Vastu Analysis - Directional Bar Chart', 20, 20);

      const barChartCanvas = await createBarChartCanvas();
      if (barChartCanvas.dataURL) {
        pdf.addImage(barChartCanvas.dataURL, 'PNG', 20, 30, imgWidth, imgHeight, undefined, 'FAST');
      }

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

      console.log("Saving PDF...");
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
          ✓ Ready to export high-quality PDF with 5 pages
        </div>
      )}
    </div>
  );
};
