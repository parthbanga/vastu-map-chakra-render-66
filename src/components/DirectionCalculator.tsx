
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

  // 32 Entrance positions (traditional Vastu entrances)
  private entrancePositions = Array.from({ length: 32 }, (_, i) => ({
    angle: i * (360 / 32),
    name: `E${i + 1}`
  }));

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

  // Get entrance points
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
