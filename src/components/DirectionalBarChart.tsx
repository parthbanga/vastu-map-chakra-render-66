
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
  // Debug: log received props
  console.log('[BarChart] center:', center, 'polygonPoints:', polygonPoints, 'rotation:', rotation);

  // Helper function for line intersection
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

  // Calculate directional areas
  const calculateDirectionalAreas = () => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const areas: number[] = [];

    for (let i = 0; i < 16; i++) {
      const angle1 = (i * 22.5 + rotation) * Math.PI / 180;
      const angle2 = ((i + 1) * 22.5 + rotation) * Math.PI / 180;
      
      // Find intersection points for both angles
      const rayEnd1 = {
        x: center.x + Math.cos(angle1) * 10000,
        y: center.y + Math.sin(angle1) * 10000
      };
      
      const rayEnd2 = {
        x: center.x + Math.cos(angle2) * 10000,
        y: center.y + Math.sin(angle2) * 10000
      };
      
      let intersectionPoint1 = null;
      let intersectionPoint2 = null;
      let maxDistance1 = 0;
      let maxDistance2 = 0;
      
      // Find intersections with polygon for both rays
      for (let j = 0; j < polygonPoints.length; j++) {
        const p1 = polygonPoints[j];
        const p2 = polygonPoints[(j + 1) % polygonPoints.length];
        
        const intersection1 = lineIntersection(
          center.x, center.y, rayEnd1.x, rayEnd1.y,
          p1.x, p1.y, p2.x, p2.y
        );
        
        const intersection2 = lineIntersection(
          center.x, center.y, rayEnd2.x, rayEnd2.y,
          p1.x, p1.y, p2.x, p2.y
        );
        
        if (intersection1) {
          const distance = Math.sqrt(
            Math.pow(intersection1.x - center.x, 2) + 
            Math.pow(intersection1.y - center.y, 2)
          );
          if (distance > maxDistance1) {
            maxDistance1 = distance;
            intersectionPoint1 = intersection1;
          }
        }
        
        if (intersection2) {
          const distance = Math.sqrt(
            Math.pow(intersection2.x - center.x, 2) + 
            Math.pow(intersection2.y - center.y, 2)
          );
          if (distance > maxDistance2) {
            maxDistance2 = distance;
            intersectionPoint2 = intersection2;
          }
        }
      }
      
      // Calculate area of the sector (approximation using triangle area)
      let sectorArea = 0;
      if (intersectionPoint1 && intersectionPoint2) {
        // Area calculation using the cross product formula for triangle area
        const area = 0.5 * Math.abs(
          (intersectionPoint1.x - center.x) * (intersectionPoint2.y - center.y) - 
          (intersectionPoint2.x - center.x) * (intersectionPoint1.y - center.y)
        );
        sectorArea = area;
      }
      
      areas.push(sectorArea);
    }
    
    return areas;
  };

  // If no polygon or not enough points, show a message
  if (!polygonPoints || polygonPoints.length < 3) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: 30,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 370,
          backgroundColor: 'rgba(255,255,255,0.95)',
          border: '2px solid #333',
          borderRadius: 8,
          padding: 16,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          zIndex: 5002,
          textAlign: 'center',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: "bold",
            color: "#333"
          }}
        >
          Directional Area Analysis
        </h3>
        <div style={{marginTop: 12, color: "#666", fontSize: 14}}>
          Please select a plot area first.<br />
          The directional area chart will appear once your plot region is defined.
        </div>
      </div>
    );
  }

  const directionalAreas = calculateDirectionalAreas();
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

  const totalArea = directionalAreas.reduce((sum, area) => sum + area, 0);
  // Debug log for chart data
  console.log('[BarChart] Calculated directional areas:', directionalAreas);

  const data = directions.map((label, index) => {
    const area = directionalAreas[index];
    const percentage = totalArea > 0 ? (area / totalArea) * 100 : 0;
    return {
      direction: label,
      percentage: percentage
    };
  });

  // Place overlay below the plot, using fixed so it's always visible
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 30,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 400,
        maxWidth: '95vw',
        height: 300,
        backgroundColor: 'rgba(255, 255, 255, 0.97)',
        border: '2px solid #333',
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
        pointerEvents: 'auto',
        zIndex: 5003
      }}
    >
      <h3 style={{ 
        margin: '0 0 16px 0', 
        fontSize: '16px', 
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#333'
      }}>
        Directional Area Analysis
      </h3>
      
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3,3" />
          <XAxis 
            dataKey="direction" 
            fontSize={10}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis fontSize={10} />
          <Tooltip 
            formatter={(value: number) => [`${value.toFixed(1)}%`, 'Area']}
            labelFormatter={(label: string) => `Direction: ${label}`}
          />
          <Bar 
            dataKey="percentage" 
            fill="#8884d8"
            name="Area %"
          />
        </BarChart>
      </ResponsiveContainer>
      
      <div style={{ 
        fontSize: '10px', 
        color: '#666', 
        textAlign: 'center',
        marginTop: '8px'
      }}>
        Percentage of total area in each direction
      </div>
    </div>
  );
};

