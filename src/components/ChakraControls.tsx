import { RotateCw, Eye, EyeOff, BarChart3, Globe, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";

interface ChakraControlsProps {
  rotation: number;
  scale: number;
  opacity: number;
  showDirections: boolean;
  showEntrances: boolean;
  showShaktiChakra: boolean;
  showAstroVastu: boolean;
  showBarChart: boolean;
  showPlanetsChakra: boolean;
  showVastuPurush: boolean;
  showVastuPurush2: boolean;
  showMarmaSthan: boolean;
  onRotationChange: (rotation: number) => void;
  onScaleChange: (scale: number) => void;
  onOpacityChange: (opacity: number) => void;
  onShowDirectionsChange: (show: boolean) => void;
  onShowEntrancesChange: (show: boolean) => void;
  onShowShaktiChakraChange: (show: boolean) => void;
  onShowAstroVastuChange: (show: boolean) => void;
  onShowBarChartChange: (show: boolean) => void;
  onShowPlanetsChakraChange: (show: boolean) => void;
  onShowVastuPurushChange: (show: boolean) => void;
  onShowVastuPurush2Change: (show: boolean) => void;
  onShowMarmaSthanChange: (show: boolean) => void;
  disabled?: boolean;
}

export const ChakraControls = ({
  rotation,
  scale,
  opacity,
  showDirections,
  showEntrances,
  showShaktiChakra,
  showAstroVastu,
  showBarChart,
  showPlanetsChakra,
  showVastuPurush,
  showVastuPurush2,
  showMarmaSthan,
  onRotationChange,
  onScaleChange,
  onOpacityChange,
  onShowDirectionsChange,
  onShowEntrancesChange,
  onShowShaktiChakraChange,
  onShowAstroVastuChange,
  onShowBarChartChange,
  onShowPlanetsChakraChange,
  onShowVastuPurushChange,
  onShowVastuPurush2Change,
  onShowMarmaSthanChange,
  disabled = false
}: ChakraControlsProps) => {
  if (disabled) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <RotateCw className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-400 mb-2">No Chakra Active</h3>
        <p className="text-sm text-gray-500">Select your plot area first to enable controls</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <RotateCw className="w-6 h-6 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Chakra Controls</h3>
        <p className="text-sm text-gray-600">Adjust the chakra overlay settings</p>
      </div>

      <Card className="p-4 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Rotation</label>
            <span className="text-sm text-gray-500">{rotation}°</span>
          </div>
          <Slider
            value={[rotation]}
            onValueChange={([value]) => onRotationChange(value)}
            max={360}
            min={0}
            step={1}
            className="w-full"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Scale</label>
            <span className="text-sm text-gray-500">{scale.toFixed(1)}x</span>
          </div>
          <Slider
            value={[scale]}
            onValueChange={([value]) => onScaleChange(value)}
            max={5}
            min={0.5}
            step={0.1}
            className="w-full"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Opacity</label>
            <span className="text-sm text-gray-500">{Math.round(opacity * 100)}%</span>
          </div>
          <Slider
            value={[opacity]}
            onValueChange={([value]) => onOpacityChange(value)}
            max={1}
            min={0.1}
            step={0.1}
            className="w-full"
          />
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <h4 className="font-medium text-sm">Display Options</h4>

        {/* Directions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-gray-500" />
            <span className="text-sm">Directions</span>
          </div>
          <Switch
            checked={showDirections}
            onCheckedChange={onShowDirectionsChange}
          />
        </div>

        {/* Entrances */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-gray-500" />
            <span className="text-sm">Entrances</span>
          </div>
          <Switch
            checked={showEntrances}
            onCheckedChange={onShowEntrancesChange}
          />
        </div>

        {/* Shakti Chakra */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-gray-500" />
            <span className="text-sm">Shakti Chakra</span>
          </div>
          <Switch
            checked={showShaktiChakra}
            onCheckedChange={onShowShaktiChakraChange}
          />
        </div>

        {/* AstroVastu */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-gray-500" />
            <span className="text-sm">AstroVastu</span>
          </div>
          <Switch
            checked={showAstroVastu}
            onCheckedChange={onShowAstroVastuChange}
          />
        </div>

        {/* Planets Chakra */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-gray-500" />
            <span className="text-sm">8 Planets</span>
          </div>
          <Switch
            checked={showPlanetsChakra}
            onCheckedChange={onShowPlanetsChakraChange}
          />
        </div>

        {/* Vastu Purush */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-sm">Vastu Purush</span>
          </div>
          <Switch
            checked={showVastuPurush}
            onCheckedChange={onShowVastuPurushChange}
          />
        </div>

        {/* Vastu Purush 2 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-blue-500" />
            <span className="text-sm">Vastu Purush 2</span>
          </div>
          <Switch
            checked={showVastuPurush2}
            onCheckedChange={onShowVastuPurush2Change}
          />
        </div>

        {/* Area Analysis */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-gray-500" />
            <span className="text-sm">Area Analysis</span>
          </div>
          <Switch
            checked={showBarChart}
            onCheckedChange={onShowBarChartChange}
          />
        </div>

        {/* Marma Sthan - placed below Area Analysis */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-yellow-500" />
            <span className="text-sm">Marma Sthan</span>
          </div>
          <Switch
            checked={showMarmaSthan}
            onCheckedChange={onShowMarmaSthanChange}
          />
        </div>
      </Card>

      <div className="text-xs text-gray-500 text-center">
        <p>Adjust these settings to customize your Vastu analysis overlay</p>
      </div>
    </div>
  );
};
