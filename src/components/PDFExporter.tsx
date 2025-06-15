import { useState, useRef } from "react";
import { Download, FileText, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

// Checkmarks/Steps
const EXPORT_STEPS = [
  {
    key: "directions",
    label: "16 Direction Zones"
  },
  {
    key: "entrances",
    label: "32 Entrances"
  }
  // Add more overlays as needed here
];

// Helper to screenshot the visible VastuCanvas area as PNG
async function screenshotVisibleCanvas(): Promise<string | null> {
  // Use the reliable id for the canvas container now
  const canvasContainer = document.getElementById("vastu-canvas-container");
  if (!canvasContainer) {
    console.error(
      "PDF Export: Failed to find canvas container by id='vastu-canvas-container'."
    );
    return null;
  }
  const canvas = canvasContainer.querySelector("canvas");
  if (!canvas) {
    console.error("PDF Export: Failed to find canvas element inside container.");
    return null;
  }
  // Screenshot the whole container (captures overlays as well)
  const dataUrl = await html2canvas(canvasContainer as HTMLElement, {
    backgroundColor: "#fff",
    scale: 2,
    useCORS: true,
    allowTaint: true
  }).then(c => c.toDataURL("image/png", 1));
  return dataUrl;
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

  // Overlay check: which overlays have been "marked as done" by user
  const [completedSteps, setCompletedSteps] = useState<{[key: string]: boolean}>({
    directions: false,
    entrances: false
  });
  // Images for each overlay step
  const [screenshots, setScreenshots] = useState<{[key: string]: string | null}>({
    directions: null,
    entrances: null
  });
  // Loading state per screenshot
  const [capturing, setCapturing] = useState<{[key: string]: boolean}>({
    directions: false,
    entrances: false
  });

  // Export enabled only if all steps complete and screenshot exist
  const canExport = Object.keys(completedSteps).every(
    k => completedSteps[k] && screenshots[k]
  );

  // For ticking and screenshotting each step
  const handleStepCheckbox = async (key: string, checked: boolean) => {
    setCompletedSteps(prev => ({
      ...prev,
      [key]: checked
    }));
    if (checked) {
      setCapturing(prev => ({...prev, [key]: true}));
      toast.info(`Capturing screenshot for "${EXPORT_STEPS.find(s=>s.key===key)?.label}"...`);
      const img = await screenshotVisibleCanvas();
      setScreenshots(prev => ({
        ...prev,
        [key]: img
      }));
      setCapturing(prev => ({...prev, [key]: false}));
      toast.success(
        <span className="flex items-center"><Check className="w-4 h-4 mr-2 text-green-600" />Captured: {EXPORT_STEPS.find(s=>s.key===key)?.label}</span>
      );
    } else {
      setScreenshots(prev => ({...prev, [key]: null}));
    }
  };

  // Export PDF with screenshots, one per page
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      let added = 0;
      for (const step of EXPORT_STEPS) {
        if (completedSteps[step.key] && screenshots[step.key]) {
          // Add title page for each overlay
          if (added > 0) pdf.addPage();
          pdf.setFontSize(16);
          pdf.text(step.label, pdf.internal.pageSize.getWidth()/2, 20, {align:"center"});
          // Place image below
          const imgData = screenshots[step.key]!;
          // Calculate dimensions for a4 within margins
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          const marginX = 15, marginY = 30;
          const maxW = pageWidth - marginX*2, maxH = pageHeight - marginY*2;
          const img = new window.Image();
          img.src = imgData;
          await new Promise(r=>{
            img.onload = r;
          });
          let iw = img.width, ih = img.height;
          let w = maxW, h = w*(ih/iw);
          if (h > maxH) { h = maxH; w = h*(iw/ih);}
          pdf.addImage(imgData, "PNG", (pageWidth-w)/2, marginY, w, h, undefined, 'FAST');
          added++;
        }
      }
      if (added === 0) throw new Error("Nothing to export.");
      const timestamp = new Date().toISOString().slice(0,19).replace(/:/g,"-");
      pdf.save(`vastu-chakra-analysis-${timestamp}.pdf`);
      toast.success("PDF exported with overlays!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Checklist for overlays */}
      <div className="space-y-3 p-2">
        <div className="text-sm font-bold mb-2 text-gray-800 text-left border-b pb-2">
          Step checklist: Capture overlays by checking when done
        </div>
        {EXPORT_STEPS.map(step => (
          <div
            className="flex items-center gap-3 px-2 py-2 bg-gray-50 rounded border"
            key={step.key}
            data-testid={`checkbox-step-${step.key}`}
          >
            {/* Explicitly wrap Checkbox and add visible border/background */}
            <div className="flex items-center">
              <Checkbox
                checked={completedSteps[step.key]}
                onCheckedChange={c => handleStepCheckbox(step.key, !!c)}
                disabled={capturing[step.key] || isExporting}
                className="!border-2 !border-green-600 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 bg-white"
                style={{ minWidth: 20, minHeight: 20 }} // Ensures checkbox always has space
              />
              {/* Fallback text if not visible (debug aid) */}
              <noscript className="text-red-500 text-xs ml-1">(Checkbox not rendering)</noscript>
            </div>
            <label className="text-sm select-none">{step.label}</label>
            {capturing[step.key] && (
              <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
            )}
            {screenshots[step.key] && (
              <span className="text-green-600 flex items-center ml-2"><Check className="w-4 h-4 mr-1"/>Done</span>
            )}
          </div>
        ))}
      </div>

      {/* Export Button */}
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
        <div className="text-xs text-gray-500 text-center mt-1">
          Perform each step and tick the checkbox before exporting.
        </div>
      )}
      {canExport && (
        <div className="text-xs text-green-600 text-center mt-1">
          ✓ Ready to export all screenshots as a PDF!
        </div>
      )}

      {/* (Optional) Tiny previews of each screenshot */}
      <div className="flex gap-3 mt-2 justify-center">
        {EXPORT_STEPS.map(step => (screenshots[step.key] ? (
          <img
            key={step.key}
            src={screenshots[step.key]!}
            alt={step.label}
            style={{ width: 64, height: 48, border: "1px solid #ddd", borderRadius: 4, objectFit:"contain", background:"#fff" }}
          />
        ) : null))}
      </div>
    </div>
  );
};

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
