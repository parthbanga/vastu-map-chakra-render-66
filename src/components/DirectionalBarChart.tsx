
import { useMemo } from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";

interface Point {
  x: number;
  y: number;
}

interface DirectionalBarChartProps {
  center: Point;
  polygonPoints: Point[];
  rotation: number;
}

export const DirectionalBarChart = ({ center, polygonPoints, rotation }: DirectionalBarChartProps) => {
  const directionalData = useMemo(() => {
    if (polygonPoints.length < 3) return [];

    // 16 Vastu directions
    const directions = [
      { name: 'N', angle: 0, fullName: 'North' },
      { name: 'NNE', angle: 22.5, fullName: 'North-Northeast' },
      { name: 'NE', angle: 45, fullName: 'Northeast' },
      { name: 'ENE', angle: 67.5, fullName: 'East-Northeast' },
      { name: 'E', angle: 90, fullName: 'East' },
      { name: 'ESE', angle: 112.5, fullName: 'East-Southeast' },
      { name: 'SE', angle: 135, fullName: 'Southeast' },
      { name: 'SSE', angle: 157.5, fullName: 'South-Southeast' },
      { name: 'S', angle: 180, fullName: 'South' },
      { name: 'SSW', angle: 202.5, fullName: 'South-Southwest' },
      { name: 'SW', angle: 225, fullName: 'Southwest' },
      { name: 'WSW', angle: 247.5, fullName: 'West-Southwest' },
      { name: 'W', angle: 270, fullName: 'West' },
      { name: 'WNW', angle: 292.5, fullName: 'West-Northwest' },
      { name: 'NW', angle: 315, fullName: 'Northwest' },
      { name: 'NNW', angle: 337.5, fullName: 'North-Northwest' }
    ];

    // Calculate area for each direction by measuring how far the polygon extends
    const data = directions.map(direction => {
      const adjustedAngle = (direction.angle + rotation) % 360;
      const radian = (adjustedAngle * Math.PI) / 180;
      
      // Cast ray in this direction and find intersection with polygon
      const rayEnd = {
        x: center.x + Math.sin(radian) * 10000,
        y: center.y - Math.cos(radian) * 10000
      };
      
      let maxDistance = 0;
      
      // Find intersection with polygon edges
      for (let i = 0; i < polygonPoints.length; i++) {
        const p1 = polygonPoints[i];
        const p2 = polygonPoints[(i + 1) % polygonPoints.length];
        
        const intersection = lineIntersection(
          center.x, center.y, rayEnd.x, rayEnd.y,
          p1.x, p1.y, p2.x, p2.y
        );
        
        if (intersection) {
          const distance = Math.sqrt(
            Math.pow(intersection.x - center.x, 2) + 
            Math.pow(intersection.y - center.y, 2)
          );
          maxDistance = Math.max(maxDistance, distance);
        }
      }
      
      return {
        direction: direction.name,
        fullName: direction.fullName,
        area: Math.round(maxDistance),
        fill: getDirectionColor(direction.name)
      };
    });

    return data;
  }, [center, polygonPoints, rotation]);

  // Line intersection utility function
  const lineIntersection = (x1: number, y1: number, x2: number, y2: number,
                           x3: number, y3: number, x4: number, y4: number) => {
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) < 1e-10) return null;
    
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
    
    if (t >= 0 && u >= 0 && u <= 1) {
      return {
        x: x1 + t * (x2 - x1),
        y: y1 + t * (y2 - y1)
      };
    }
    
    return null;
  };

  const getDirectionColor = (direction: string) => {
    const colors: { [key: string]: string } = {
      'N': '#4CAF50', 'NNE': '#8BC34A', 'NE': '#CDDC39', 'ENE': '#FFEB3B',
      'E': '#FFC107', 'ESE': '#FF9800', 'SE': '#FF5722', 'SSE': '#F44336',
      'S': '#E91E63', 'SSW': '#9C27B0', 'SW': '#673AB7', 'WSW': '#3F51B5',
      'W': '#2196F3', 'WNW': '#03A9F4', 'NW': '#00BCD4', 'NNW': '#009688'
    };
    return colors[direction] || '#666666';
  };

  const chartConfig = {
    area: {
      label: "Extension Area",
    },
  };

  if (directionalData.length === 0) return null;

  return (
    <div className="absolute top-4 right-4 w-80 h-60 bg-white rounded-lg shadow-lg p-4 z-20">
      <h3 className="text-sm font-semibold mb-2 text-center">Directional Area Analysis</h3>
      <ChartContainer config={chartConfig} className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={directionalData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <XAxis 
              dataKey="direction" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10 }}
            />
            <ChartTooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length > 0) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-2 border rounded shadow-lg">
                      <p className="font-semibold">{data.fullName}</p>
                      <p className="text-sm">Extension: {data.area}px</p>
                      <p className="text-xs text-gray-500">
                        {data.area > 150 ? 'Extended' : data.area < 100 ? 'Contracted' : 'Balanced'}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar 
              dataKey="area" 
              radius={[2, 2, 0, 0]}
              fill="#8884d8"
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};
