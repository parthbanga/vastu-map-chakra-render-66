
import { RotateCw, ZoomIn, Eye, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface ChakraControlsProps {
  rotation: number;
  scale: number;
  opacity: number;
  showDirections: boolean;
  showEntrances: boolean;
  onRotationChange: (rotation: number) => void;
  onScaleChange: (scale: number) => void;
  onOpacityChange: (opacity: number) => void;
  onShowDirectionsChange: (show: boolean) => void;
  onShowEntrancesChange: (show: boolean) => void;
  disabled?: boolean;
}

export const ChakraControls = ({
  rotation,
  scale,
  opacity,
  showDirections,
  showEntrances,
  onRotationChange,
  onScaleChange,
  onOpacityChange,
  onShowDirectionsChange,
  onShowEntrancesChange,
  disabled = false
}: ChakraControlsProps) => {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center mx-auto mb-2">
          <Settings2 className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-bold text-gray-800">Chakra Controls</h3>
      </div>
      
      {/* Visibility Controls */}
      <Card className="p-4">
        <Label className="text-sm font-semibold text-gray-800 mb-3 block">Visibility Options</Label>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="show-directions" className="text-sm text-gray-700">
              16 Zone Directions
            </Label>
            <Switch
              id="show-directions"
              checked={showDirections}
              onCheckedChange={onShowDirectionsChange}
              disabled={disabled}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="show-entrances" className="text-sm text-gray-700">
              32 Entrances
            </Label>
            <Switch
              id="show-entrances"
              checked={showEntrances}
              onCheckedChange={onShowEntrancesChange}
              disabled={disabled}
            />
          </div>
        </div>
      </Card>

      {/* Rotation Control */}
      <Card className="p-4">
        <Label htmlFor="rotation" className="text-sm font-semibold text-gray-800 mb-3 block">
          Rotation
        </Label>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              id="rotation"
              type="number"
              min="0"
              max="360"
              value={rotation}
              onChange={(e) => onRotationChange(Number(e.target.value))}
              className="flex-1 h-9 text-sm"
              disabled={disabled}
              placeholder="0-360°"
            />
            <Button
              variant="outline"
              onClick={() => onRotationChange(0)}
              disabled={disabled}
              size="sm"
              className="h-9 w-9 p-0"
            >
              <RotateCw className="w-4 h-4" />
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
          <div className="text-xs text-gray-500 text-center">{rotation}°</div>
        </div>
      </Card>

      {/* Scale Control */}
      <Card className="p-4">
        <Label htmlFor="scale" className="text-sm font-semibold text-gray-800 mb-3 block">
          Scale
        </Label>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              id="scale"
              type="number"
              min="0.1"
              max="3"
              step="0.1"
              value={scale}
              onChange={(e) => onScaleChange(Number(e.target.value))}
              className="flex-1 h-9 text-sm"
              disabled={disabled}
              placeholder="0.1-3.0"
            />
            <Button
              variant="outline"
              onClick={() => onScaleChange(1)}
              disabled={disabled}
              size="sm"
              className="h-9 w-9 p-0"
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
          <div className="text-xs text-gray-500 text-center">{scale.toFixed(1)}x</div>
        </div>
      </Card>

      {/* Opacity Control */}
      <Card className="p-4">
        <Label htmlFor="opacity" className="text-sm font-semibold text-gray-800 mb-3 block">
          Opacity
        </Label>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              id="opacity"
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={opacity}
              onChange={(e) => onOpacityChange(Number(e.target.value))}
              className="flex-1 h-9 text-sm"
              disabled={disabled}
              placeholder="0.0-1.0"
            />
            <Button
              variant="outline"
              onClick={() => onOpacityChange(0.7)}
              disabled={disabled}
              size="sm"
              className="h-9 w-9 p-0"
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
          <div className="text-xs text-gray-500 text-center">{Math.round(opacity * 100)}%</div>
        </div>
      </Card>

      {disabled && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 px-3 py-2 rounded-full text-sm">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
            Select plot area first to enable controls
          </div>
        </div>
      )}
    </div>
  );
};
