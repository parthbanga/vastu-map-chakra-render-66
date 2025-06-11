import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DirectionCalculator } from './DirectionCalculator';

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
  const calculator = new DirectionCalculator({
    center,
    radius: 100,
    rotation,
    scale: 1,
    polygonPoints
  });

  const directionalAreas = calculator.getDirectionalAreas();

  const totalArea = directionalAreas.reduce((sum, area) => sum + area, 0);

  const data = calculator.getDirectionLabels().map((label, index) => {
    const area = directionalAreas[index];
    const percentage = (area / totalArea) * 100;
    return {
      direction: label.label,
      percentage: percentage
    };
  });

  return (
    <div
      style={{
        position: 'absolute',
        top: center.y + 150,
        left: center.x - 200,
        width: 400,
        height: 300,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        border: '2px solid #333',
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        pointerEvents: 'none',
        zIndex: 1000
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
