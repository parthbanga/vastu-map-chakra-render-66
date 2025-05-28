
import { RotateCw, ZoomIn, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface ChakraControlsProps {
  rotation: number;
  scale: number;
  opacity: number;
  onRotationChange: (rotation: number) => void;
  onScaleChange: (scale: number) => void;
  onOpacityChange: (opacity: number) => void;
  disabled?: boolean;
}

export const ChakraControls = ({
  rotation,
  scale,
  opacity,
  onRotationChange,
  onScaleChange,
  onOpacityChange,
  disabled = false
}: ChakraControlsProps) => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <RotateCw className="w-5 h-5 text-orange-600" />
        Chakra Controls
      </h3>
      
      <div className="space-y-6">
        {/* Rotation Control */}
        <div className="space-y-2">
          <Label htmlFor="rotation" className="text-sm font-medium">
            Rotation (degrees)
          </Label>
          <div className="flex gap-2">
            <Input
              id="rotation"
              type="number"
              min="0"
              max="360"
              value={rotation}
              onChange={(e) => onRotationChange(Number(e.target.value))}
              className="flex-1"
              disabled={disabled}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRotationChange(0)}
              disabled={disabled}
            >
              Reset
            </Button>
          </div>
          <Slider
            value={[rotation]}
            onValueChange={(value) => onRotationChange(value[0])}
            max={360}
            step={1}
            disabled={disabled}
            className="w-full"
          />
        </div>

        {/* Scale Control */}
        <div className="space-y-2">
          <Label htmlFor="scale" className="text-sm font-medium">
            Scale
          </Label>
          <div className="flex gap-2">
            <Input
              id="scale"
              type="number"
              min="0.1"
              max="3"
              step="0.1"
              value={scale}
              onChange={(e) => onScaleChange(Number(e.target.value))}
              className="flex-1"
              disabled={disabled}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => onScaleChange(1)}
              disabled={disabled}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
          <Slider
            value={[scale]}
            onValueChange={(value) => onScaleChange(value[0])}
            min={0.1}
            max={3}
            step={0.1}
            disabled={disabled}
            className="w-full"
          />
        </div>

        {/* Opacity Control */}
        <div className="space-y-2">
          <Label htmlFor="opacity" className="text-sm font-medium">
            Opacity
          </Label>
          <div className="flex gap-2">
            <Input
              id="opacity"
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={opacity}
              onChange={(e) => onOpacityChange(Number(e.target.value))}
              className="flex-1"
              disabled={disabled}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpacityChange(0.7)}
              disabled={disabled}
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
          <Slider
            value={[opacity]}
            onValueChange={(value) => onOpacityChange(value[0])}
            min={0}
            max={1}
            step={0.05}
            disabled={disabled}
            className="w-full"
          />
        </div>

        {disabled && (
          <div className="text-sm text-gray-500 text-center py-2">
            Select plot area first to enable Chakra controls
          </div>
        )}
      </div>
    </Card>
  );
};
