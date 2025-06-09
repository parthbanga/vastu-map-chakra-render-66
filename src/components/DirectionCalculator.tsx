
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

  // 32 Entrance positions with correct Vastu names and angles
  private entrancePositions = [
    // North direction - N4, N5
    { angle: 348.75, name: 'N4' },
    { angle: 11.25, name: 'N5' },
    
    // North-NE (NNE) - N6, N7
    { angle: 33.75, name: 'N6' },
    { angle: 56.25, name: 'N7' },
    
    // North-East (NE) - N8, E1
    { angle: 78.75, name: 'N8' },
    { angle: 101.25, name: 'E1' },
    
    // East-NE (ENE) - E2, E3
    { angle: 123.75, name: 'E2' },
    { angle: 146.25, name: 'E3' },
    
    // East - E4, E5
    { angle: 168.75, name: 'E4' },
    { angle: 191.25, name: 'E5' },
    
    // East-SE (ESE) - E6, E7
    { angle: 213.75, name: 'E6' },
    { angle: 236.25, name: 'E7' },
    
    // South-East (SE) - E8, S1
    { angle: 258.75, name: 'E8' },
    { angle: 281.25, name: 'S1' },
    
    // South-SE (SSE) - S2, S3
    { angle: 303.75, name: 'S2' },
    { angle: 326.25, name: 'S3' },
    
    // South - S4, S5
    { angle: 348.75, name: 'S4' },
    { angle: 11.25, name: 'S5' },
    
    // South-SW (SSW) - S6, S7
    { angle: 33.75, name: 'S6' },
    { angle: 56.25, name: 'S7' },
    
    // South-West (SW) - S8, W1
    { angle: 78.75, name: 'S8' },
    { angle: 101.25, name: 'W1' },
    
    // West-SW (WSW) - W2, W3
    { angle: 123.75, name: 'W2' },
    { angle: 146.25, name: 'W3' },
    
    // West - W4, W5
    { angle: 168.75, name: 'W4' },
    { angle: 191.25, name: 'W5' },
    
    // West-NW (WNW) - W6, W7
    { angle: 213.75, name: 'W6' },
    { angle: 236.25, name: 'W7' },
    
    // North-West (NW) - W8, N1
    { angle: 258.75, name: 'W8' },
    { angle: 281.25, name: 'N1' },
    
    // North-NW (NNW) - N2, N3
    { angle: 303.75, name: 'N2' },
    { angle: 326.25, name: 'N3' }
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
      const startAngle = zone.angle - 11.25; // Half zone width
      const endAngle = zone.angle + 11.25;
      
      return {
        start: this.getPointOnCircle(startAngle),
        end: this.getPointOnCircle(endAngle),
        zone
      };
    });
  }

  // Get entrance points with traditional names
  getEntrancePoints(): Array<{ point: Point; entrance: any }> {
    return this.entrancePositions.map(entrance => ({
      point: this.getPointOnCircle(entrance.angle, 0.95),
      entrance
    }));
  }

  // Get direction labels with their positions
  getDirectionLabels(): Array<{ point: Point; label: string; angle: number }> {
    return this.vastuZones.map(zone => ({
      point: this.getPointOnCircle(zone.angle, 1.15),
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

  // Get compass directions (N, E, S, W)
  getCompassDirections(): Array<{ point: Point; direction: string; angle: number }> {
    const mainDirections = [
      { direction: 'N', angle: 0 },
      { direction: 'E', angle: 90 },
      { direction: 'S', angle: 180 },
      { direction: 'W', angle: 270 }
    ];

    return mainDirections.map(dir => ({
      point: this.getPointOnCircle(dir.angle, 1.25),
      direction: dir.direction,
      angle: dir.angle + this.rotation
    }));
  }
}
