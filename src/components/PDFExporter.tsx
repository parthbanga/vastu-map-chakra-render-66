
import { useState } from "react";
import { Download, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { VastuCanvas } from "./VastuCanvas";

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
  setForceOverlay?: (v: {directions?: boolean; entrances?: boolean}) => void;
  forceOverlay?: {directions?: boolean; entrances?: boolean};
  // New props for analysis data
  totalArea?: number;
  northAngle?: number;
  zonesCount?: number;
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

// Helper to screenshot the VastuCanvas with overlays always on
async function screenshotVisibleCanvasWithOverlays(): Promise<string | null> {
  const canvasContainer = document.getElementById("vastu-canvas-exporter-helper");
  if (!canvasContainer) {
    console.error(
      "PDF Export: Failed to find canvas container by id='vastu-canvas-exporter-helper'."
    );
    return null;
  }
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
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
  chakraOpacity,
  setForceOverlay,
  forceOverlay,
  totalArea,
  northAngle,
  zonesCount
}: PDFExporterProps) => {
  // DEBUG: Quick log for blank render diagnosis
  console.log("Rendering PDFExporter with:", { mapImage, polygonPoints, center });

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

  // Force overlay state tracks *exporting* mode
  const [drawOverlaysOnCanvas, setDrawOverlaysOnCanvas] = useState(false);

  // Export enabled only if all steps complete and screenshot exist
  const canExport = Object.keys(completedSteps).every(
    k => completedSteps[k] && screenshots[k]
  );

  // --- NEW: Hidden overlay-rendering container for export only ---
  const [showHiddenExporterCanvas, setShowHiddenExporterCanvas] = useState(false);

  // Handles ticking and screenshotting each overlay step
  const handleStepCheckbox = async (key: string, checked: boolean) => {
    setCompletedSteps(prev => ({
      ...prev,
      [key]: checked
    }));

    if (checked) {
      setCapturing(prev => ({ ...prev, [key]: true }));
      toast.info(`Capturing screenshot for "${EXPORT_STEPS.find(s=>s.key===key)?.label}"...`);

      // ----- MODIFIED: Always show both overlays (directions & entrances) for export -----
      setShowHiddenExporterCanvas(true);

      // Wait for DOM update 
      await new Promise(r => setTimeout(r, 60));

      // SCREENSHOT: force both overlays ON for export regardless of which step!
      const overlayStateForScreenshot =
        { directions: true, entrances: true };

      // Take screenshot of the hidden canvas with both overlays ON
      const img = await screenshotVisibleCanvasWithOverlays();

      setShowHiddenExporterCanvas(false);

      setScreenshots(prev => ({
        ...prev,
        [key]: img
      }));
      setCapturing(prev => ({ ...prev, [key]: false }));
      toast.success(
        <span className="flex items-center"><Check className="w-4 h-4 mr-2 text-green-600" />Captured: {EXPORT_STEPS.find(s=>s.key===key)?.label}</span>
      );
    } else {
      setScreenshots(prev => ({ ...prev, [key]: null }));
    }
  };

  // Export PDF with screenshots, one per page, and add analysis data below the image
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
          if (added > 0) pdf.addPage();
          pdf.setFontSize(16);
          pdf.text(step.label, pdf.internal.pageSize.getWidth()/2, 20, {align:"center"});
          // Place image below
          const imgData = screenshots[step.key]!;
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          const marginX = 15, marginY = 30;
          const maxW = pageWidth - marginX*2, maxH = pageHeight - marginY*2 - 45; // leave room below for text
          const img = new window.Image();
          img.src = imgData;
          await new Promise(r=>{ img.onload = r; });
          let iw = img.width, ih = img.height;
          let w = maxW, h = w*(ih/iw);
          if (h > maxH) { h = maxH; w = h*(iw/ih);}
          const imgY = marginY;
          pdf.addImage(imgData, "PNG", (pageWidth-w)/2, imgY, w, h, undefined, 'FAST');

          // --- Add analysis data below image ---
          let textY = imgY + h + 12;
          pdf.setFontSize(16);
          pdf.text('Vastu Analysis Report', marginX, textY);
          textY += 9;
          pdf.setFontSize(12);
          // Only print if props are defined, fallback to "N/A"
          pdf.text(`Total Area: ${typeof totalArea === "number" ? totalArea.toFixed(2) : "N/A"} sq units`, marginX, textY += 10);
          pdf.text(`North Angle: ${typeof northAngle === "number" ? northAngle : "N/A"}°`, marginX, textY += 10);
          pdf.text(`Zones Analyzed: ${typeof zonesCount === "number" ? zonesCount : "N/A"}`, marginX, textY += 10);

          added++;
        }
      }
      if (added === 0) throw new Error("Nothing to export.");
      const timestamp = new Date().toISOString().slice(0,19).replace(/:/g,"-");
      pdf.save(`vastu-chakra-analysis-${timestamp}.pdf`);
      toast.success("PDF exported with analysis info!");
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

      {/* --- Hidden overlays-export canvas: forcibly show overlays for export --- */}
      {showHiddenExporterCanvas && (
        <div id="vastu-canvas-exporter-helper" style={{ position: "fixed", left: "-9999px", top: "0", zIndex: -1, visibility: "hidden", width: 900, height: 700 }}>
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
            showDirections={true}      // FORCED ON
            showEntrances={true}       // FORCED ON
            showShaktiChakra={false}
            showAstroVastu={false}     // Add missing prop
            showPlanetsChakra={false}
            showVastuPurush={false}
            showBarChart={false}
            drawOverlaysOnCanvas={true} // Draw directly on the canvas for export
          />
        </div>
      )}
      {/* --- end helper overlay-export canvas --- */}

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
