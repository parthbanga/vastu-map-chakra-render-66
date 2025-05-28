
import { useState } from "react";
import { MousePointer, Trash2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Point {
  x: number;
  y: number;
}

interface PolygonSelectorProps {
  points: Point[];
  isSelecting: boolean;
  onStartSelection: () => void;
  onClearSelection: () => void;
  onCompleteSelection: () => void;
  disabled?: boolean;
}

export const PolygonSelector = ({
  points,
  isSelecting,
  onStartSelection,
  onClearSelection,
  onCompleteSelection,
  disabled = false
}: PolygonSelectorProps) => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <MousePointer className="w-5 h-5 text-purple-600" />
        Plot Area Selection
      </h3>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Button
            onClick={isSelecting ? onClearSelection : onStartSelection}
            className="w-full"
            variant={isSelecting ? "destructive" : "default"}
            disabled={disabled}
          >
            {isSelecting ? (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Cancel Selection
              </>
            ) : (
              <>
                <MousePointer className="w-4 h-4 mr-2" />
                Start Selection
              </>
            )}
          </Button>

          {points.length > 0 && (
            <Button
              onClick={onClearSelection}
              variant="outline"
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Points ({points.length})
            </Button>
          )}

          {points.length >= 3 && isSelecting && (
            <Button
              onClick={onCompleteSelection}
              variant="default"
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Polygon
            </Button>
          )}
        </div>

        {/* Instructions */}
        <div className="text-sm text-gray-600 space-y-1">
          {!isSelecting && points.length === 0 && (
            <p>Click to start selecting the plot area on your map.</p>
          )}
          {isSelecting && (
            <div className="space-y-1">
              <p className="font-medium text-blue-600">Selection Mode Active:</p>
              <p>• Click on the map to add corner points</p>
              <p>• Double-click to finish the polygon</p>
              <p>• Minimum 3 points required</p>
            </div>
          )}
          {points.length > 0 && !isSelecting && (
            <p className="text-green-600 font-medium">
              ✓ Plot area defined with {points.length} points
            </p>
          )}
        </div>

        {/* Point List */}
        {points.length > 0 && (
          <div className="text-xs text-gray-500">
            <div className="max-h-32 overflow-y-auto space-y-1">
              {points.map((point, index) => (
                <div key={index} className="flex justify-between">
                  <span>Point {index + 1}:</span>
                  <span>({Math.round(point.x)}, {Math.round(point.y)})</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
