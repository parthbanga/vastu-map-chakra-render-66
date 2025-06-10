interface Point {
  x: number;
  y: number;
}

interface DirectionCalculatorProps {
  center: Point;
  radius: number;
  rotation: number; // in degrees
}

export class DirectionCalculator {
  private center: Point;
  private radius: number;
  private rotation: number;

  // 16 Vastu zones with their traditional positions (0° = North)
  private vastuZones = [
    { name: 'North', angle: 0, color: '#4CAF50' },
    { name: 'North-NE', angle: 22.5, color: '#8BC34A' },
    { name: 'North-East', angle: 45, color: '#CDDC39' },
    { name: 'East-NE', angle: 67.5, color: '#FFEB3B' },
    { name: 'East', angle: 90, color: '#FFC107' },
    { name: 'East-SE', angle: 112.5, color: '#FF9800' },
    { name: 'South-East', angle: 135, color: '#FF5722' },
    { name: 'South-SE', angle: 157.5, color: '#F44336' },
    { name: 'South', angle: 180, color: '#E91E63' },
    { name: 'South-SW', angle: 202.5, color: '#9C27B0' },
    { name: 'South-West', angle: 225, color: '#673AB7' },
    { name: 'West-SW', angle: 247.5, color: '#3F51B5' },
    { name: 'West', angle: 270, color: '#2196F3' },
    { name: 'West-NW', angle: 292.5, color: '#03A9F4' },
    { name: 'North-West', angle: 315, color: '#00BCD4' },
    { name: 'North-NW', angle: 337.5, color: '#009688' }
  ];

  // 32 Entrance positions - accurately positioned with 11.25° spacing
  private entrancePositions = [
    // North (0°) - N4, N5
    { angle: 348.75, name: 'N4' },  // -11.25° from North
    { angle: 11.25, name: 'N5' },   // +11.25° from North
    
    // North-NE (22.5°) - N6, N7  
    { angle: 16.875, name: 'N6' },  // 22.5° - 5.625°
    { angle: 28.125, name: 'N7' },  // 22.5° + 5.625°
    
    // North-East (45°) - N8, E1
    { angle: 39.375, name: 'N8' },  // 45° - 5.625°
    { angle: 50.625, name: 'E1' },  // 45° + 5.625°
    
    // East-NE (67.5°) - E2, E3
    { angle: 61.875, name: 'E2' },  // 67.5° - 5.625°
    { angle: 73.125, name: 'E3' },  // 67.5° + 5.625°
    
    // East (90°) - E4, E5
    { angle: 78.75, name: 'E4' },   // 90° - 11.25°
    { angle: 101.25, name: 'E5' },  // 90° + 11.25°
    
    // East-SE (112.5°) - E6, E7
    { angle: 106.875, name: 'E6' }, // 112.5° - 5.625°
    { angle: 118.125, name: 'E7' }, // 112.5° + 5.625°
    
    // South-East (135°) - E8, S1
    { angle: 129.375, name: 'E8' }, // 135° - 5.625°
    { angle: 140.625, name: 'S1' }, // 135° + 5.625°
    
    // South-SE (157.5°) - S2, S3
    { angle: 151.875, name: 'S2' }, // 157.5° - 5.625°
    { angle: 163.125, name: 'S3' }, // 157.5° + 5.625°
    
    // South (180°) - S4, S5
    { angle: 168.75, name: 'S4' },  // 180° - 11.25°
    { angle: 191.25, name: 'S5' },  // 180° + 11.25°
    
    // South-SW (202.5°) - S6, S7
    { angle: 196.875, name: 'S6' }, // 202.5° - 5.625°
    { angle: 208.125, name: 'S7' }, // 202.5° + 5.625°
    
    // South-West (225°) - S8, W1
    { angle: 219.375, name: 'S8' }, // 225° - 5.625°
    { angle: 230.625, name: 'W1' }, // 225° + 5.625°
    
    // West-SW (247.5°) - W2, W3
    { angle: 241.875, name: 'W2' }, // 247.5° - 5.625°
    { angle: 253.125, name: 'W3' }, // 247.5° + 5.625°
    
    // West (270°) - W4, W5
    { angle: 258.75, name: 'W4' },  // 270° - 11.25°
    { angle: 281.25, name: 'W5' },  // 270° + 11.25°
    
    // West-NW (292.5°) - W6, W7
    { angle: 286.875, name: 'W6' }, // 292.5° - 5.625°
    { angle: 298.125, name: 'W7' }, // 292.5° + 5.625°
    
    // North-West (315°) - W8, N1
    { angle: 309.375, name: 'W8' }, // 315° - 5.625°
    { angle: 320.625, name: 'N1' }, // 315° + 5.625°
    
    // North-NW (337.5°) - N2, N3
    { angle: 331.875, name: 'N2' }, // 337.5° - 5.625°
    { angle: 343.125, name: 'N3' }  // 337.5° + 5.625°
  ];

  constructor({ center, radius, rotation }: DirectionCalculatorProps) {
    this.center = center;
    this.radius = radius;
    this.rotation = rotation;
  }

  // Convert angle to radians
  private toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  // Calculate point on circle for given angle
  private getPointOnCircle(angle: number, radiusMultiplier: number = 1): Point {
    const adjustedAngle = angle + this.rotation;
    const radian = this.toRadians(adjustedAngle);
    const effectiveRadius = this.radius * radiusMultiplier;
    
    return {
      x: this.center.x + Math.sin(radian) * effectiveRadius,
      y: this.center.y - Math.cos(radian) * effectiveRadius
    };
  }

  // Get all 16 zone boundaries
  getZoneBoundaries(): Array<{ start: Point; end: Point; zone: any }> {
    return this.vastuZones.map((zone, index) => {
      const startAngle = zone.angle - 11.25;
      const endAngle = zone.angle + 11.25;
      
      return {
        start: this.getPointOnCircle(startAngle),
        end: this.getPointOnCircle(endAngle),
        zone
      };
    });
  }

  // Get entrance points - positioned on outer circle
  getEntrancePoints(): Array<{ point: Point; entrance: any }> {
    return this.entrancePositions.map(entrance => ({
      point: this.getPointOnCircle(entrance.angle, 0.98), // Closer to circle
      entrance
    }));
  }

  // Get direction labels - positioned closer to circle
  getDirectionLabels(): Array<{ point: Point; label: string; angle: number }> {
    return this.vastuZones.map(zone => ({
      point: this.getPointOnCircle(zone.angle, 1.05), // Further reduced for better scaling
      label: zone.name,
      angle: zone.angle + this.rotation
    }));
  }

  // Get zone sectors for coloring
  getZoneSectors(): Array<{ path: string; color: string; zone: any }> {
    return this.vastuZones.map((zone, index) => {
      const startAngle = zone.angle - 11.25;
      const endAngle = zone.angle + 11.25;
      
      const startPoint = this.getPointOnCircle(startAngle, 0.3);
      const endPoint = this.getPointOnCircle(endAngle, 0.3);
      const outerStartPoint = this.getPointOnCircle(startAngle, 1.0);
      const outerEndPoint = this.getPointOnCircle(endAngle, 1.0);
      
      // Create SVG path for sector
      const path = [
        `M ${this.center.x} ${this.center.y}`,
        `L ${startPoint.x} ${startPoint.y}`,
        `A ${this.radius * 0.3} ${this.radius * 0.3} 0 0 1 ${endPoint.x} ${endPoint.y}`,
        `L ${this.center.x} ${this.center.y}`,
        `M ${startPoint.x} ${startPoint.y}`,
        `L ${outerStartPoint.x} ${outerStartPoint.y}`,
        `A ${this.radius} ${this.radius} 0 0 1 ${outerEndPoint.x} ${outerEndPoint.y}`,
        `L ${endPoint.x} ${endPoint.y}`,
        `A ${this.radius * 0.3} ${this.radius * 0.3} 0 0 0 ${startPoint.x} ${startPoint.y}`,
        'Z'
      ].join(' ');
      
      return { path, color: zone.color, zone };
    });
  }

  // Get compass directions - positioned closer
  getCompassDirections(): Array<{ point: Point; direction: string; angle: number }> {
    const mainDirections = [
      { direction: 'N', angle: 0 },
      { direction: 'E', angle: 90 },
      { direction: 'S', angle: 180 },
      { direction: 'W', angle: 270 }
    ];

    return mainDirections.map(dir => ({
      point: this.getPointOnCircle(dir.angle, 1.10), // Further reduced for better scaling
      direction: dir.direction,
      angle: dir.angle + this.rotation
    }));
  }
}
