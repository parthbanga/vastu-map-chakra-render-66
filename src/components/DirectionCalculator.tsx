interface Point {
  x: number;
  y: number;
}

interface DirectionCalculatorProps {
  center: Point;
  radius: number;
  rotation: number; // in degrees
  scale: number; // scale factor for adaptive positioning
  polygonPoints?: Point[]; // Add polygon points for boundary calculation
}

export class DirectionCalculator {
  private center: Point;
  private radius: number;
  private rotation: number;
  private scale: number;
  private polygonPoints: Point[];

  // 16 Vastu zones with their traditional positions and abbreviated names (0° = North)
  private vastuZones = [
    { name: 'N', angle: 0, color: '#4CAF50' },
    { name: 'NNE', angle: 22.5, color: '#8BC34A' },
    { name: 'NE', angle: 45, color: '#CDDC39' },
    { name: 'ENE', angle: 67.5, color: '#FFEB3B' },
    { name: 'E', angle: 90, color: '#FFC107' },
    { name: 'ESE', angle: 112.5, color: '#FF9800' },
    { name: 'SE', angle: 135, color: '#FF5722' },
    { name: 'SSE', angle: 157.5, color: '#F44336' },
    { name: 'S', angle: 180, color: '#E91E63' },
    { name: 'SSW', angle: 202.5, color: '#9C27B0' },
    { name: 'SW', angle: 225, color: '#673AB7' },
    { name: 'WSW', angle: 247.5, color: '#3F51B5' },
    { name: 'W', angle: 270, color: '#2196F3' },
    { name: 'WNW', angle: 292.5, color: '#03A9F4' },
    { name: 'NW', angle: 315, color: '#00BCD4' },
    { name: 'NNW', angle: 337.5, color: '#009688' }
  ];

  // 32 Entrance positions - positioned in the CENTER of each 11.25° sector (between radial lines)
  private entrancePositions = [
    // Each entrance is positioned at the center of its sector
    // Radial lines are at: 0°, 11.25°, 22.5°, 33.75°, 45°, 56.25°, 67.5°, 78.75°, 90°, etc.
    // So entrance centers should be at: 5.625°, 16.875°, 28.125°, 39.375°, etc.
    { angle: 5.625, name: 'N4' },    // Between 0° and 11.25° radial lines
    { angle: 16.875, name: 'N5' },   // Between 11.25° and 22.5° radial lines
    { angle: 28.125, name: 'N6' },   // Between 22.5° and 33.75° radial lines
    { angle: 39.375, name: 'N7' },   // Between 33.75° and 45° radial lines
    { angle: 50.625, name: 'N8' },   // Between 45° and 56.25° radial lines
    { angle: 61.875, name: 'E1' },   // Between 56.25° and 67.5° radial lines
    { angle: 73.125, name: 'E2' },   // Between 67.5° and 78.75° radial lines
    { angle: 84.375, name: 'E3' },   // Between 78.75° and 90° radial lines
    { angle: 95.625, name: 'E4' },   // Between 90° and 101.25° radial lines
    { angle: 106.875, name: 'E5' },  // Between 101.25° and 112.5° radial lines
    { angle: 118.125, name: 'E6' },  // Between 112.5° and 123.75° radial lines
    { angle: 129.375, name: 'E7' },  // Between 123.75° and 135° radial lines
    { angle: 140.625, name: 'E8' },  // Between 135° and 146.25° radial lines
    { angle: 151.875, name: 'S1' },  // Between 146.25° and 157.5° radial lines
    { angle: 163.125, name: 'S2' },  // Between 157.5° and 168.75° radial lines
    { angle: 174.375, name: 'S3' },  // Between 168.75° and 180° radial lines
    { angle: 185.625, name: 'S4' },  // Between 180° and 191.25° radial lines
    { angle: 196.875, name: 'S5' },  // Between 191.25° and 202.5° radial lines
    { angle: 208.125, name: 'S6' },  // Between 202.5° and 213.75° radial lines
    { angle: 219.375, name: 'S7' },  // Between 213.75° and 225° radial lines
    { angle: 230.625, name: 'S8' },  // Between 225° and 236.25° radial lines
    { angle: 241.875, name: 'W1' },  // Between 236.25° and 247.5° radial lines
    { angle: 253.125, name: 'W2' },  // Between 247.5° and 258.75° radial lines
    { angle: 264.375, name: 'W3' },  // Between 258.75° and 270° radial lines
    { angle: 275.625, name: 'W4' },  // Between 270° and 281.25° radial lines
    { angle: 286.875, name: 'W5' },  // Between 281.25° and 292.5° radial lines
    { angle: 298.125, name: 'W6' },  // Between 292.5° and 303.75° radial lines
    { angle: 309.375, name: 'W7' },  // Between 303.75° and 315° radial lines
    { angle: 320.625, name: 'W8' },  // Between 315° and 326.25° radial lines
    { angle: 331.875, name: 'N1' },  // Between 326.25° and 337.5° radial lines
    { angle: 343.125, name: 'N2' },  // Between 337.5° and 348.75° radial lines
    { angle: 354.375, name: 'N3' }   // Between 348.75° and 360° (0°) radial lines
  ];

  constructor({ center, radius, rotation, scale, polygonPoints = [] }: DirectionCalculatorProps) {
    this.center = center;
    this.radius = radius;
    this.rotation = rotation;
    this.scale = scale;
    this.polygonPoints = polygonPoints;
  }

  // Convert angle to radians with compass correction (so 0° = up/North)
  private toRadiansCompass(degrees: number): number {
    // Shift by -90° so that 0° points up (standard compass)
    return ((degrees - 90 + this.rotation) * Math.PI) / 180;
  }

  // Calculate intersection of a line from center with polygon boundary
  private getPolygonIntersection(angle: number): Point | null {
    if (this.polygonPoints.length < 3) {
      // Fallback to circle if no valid polygon
      return this.getPointOnCircle(angle, 1);
    }

    // *** Adjusted: Use compass-corrected angle ***
    const radian = this.toRadiansCompass(angle);

    // Direction vector from center
    const dirX = Math.cos(radian); // X grows to the right
    const dirY = Math.sin(radian); // Y grows down

    let closestIntersection: Point | null = null;
    let closestDistance = Infinity;

    // Check intersection with each polygon edge
    for (let i = 0; i < this.polygonPoints.length; i++) {
      const p1 = this.polygonPoints[i];
      const p2 = this.polygonPoints[(i + 1) % this.polygonPoints.length];

      const intersection = this.lineIntersection(
        this.center.x, this.center.y,
        this.center.x + dirX * 10000, this.center.y + dirY * 10000,
        p1.x, p1.y, p2.x, p2.y
      );

      if (intersection) {
        const distance = Math.sqrt(
          Math.pow(intersection.x - this.center.x, 2) +
          Math.pow(intersection.y - this.center.y, 2)
        );

        if (distance < closestDistance) {
          closestDistance = distance;
          closestIntersection = intersection;
        }
      }
    }

    return closestIntersection || this.getPointOnCircle(angle, 1);
  }

  // Calculate intersection between two line segments
  private lineIntersection(x1: number, y1: number, x2: number, y2: number,
                          x3: number, y3: number, x4: number, y4: number): Point | null {
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
  }

  // Calculate point on circle for given angle (with compass convention)
  private getPointOnCircle(angle: number, radiusMultiplier: number = 1): Point {
    const radian = this.toRadiansCompass(angle);
    const effectiveRadius = this.radius * radiusMultiplier;

    return {
      x: this.center.x + Math.cos(radian) * effectiveRadius,
      y: this.center.y + Math.sin(radian) * effectiveRadius
    };
  }

  // Get radial line endpoints that stop at polygon boundary - generates 16 lines for directions
  getRadialLineEndpoints(): Array<{ start: Point; end: Point; angle: number }> {
    const lines = [];

    // Generate 16 radial lines for main directions (every 22.5 degrees)
    for (let i = 0; i < 16; i++) {
      const angle = i * (360 / 16); // Every 22.5 degrees
      const endPoint = this.getPolygonIntersection(angle);

      if (endPoint) {
        lines.push({
          start: this.center,
          end: endPoint,
          angle: angle
        });
      }
    }

    return lines;
  }

  // Get entrance radial lines for 32 entrances - these are the sector boundary lines
  getEntranceRadialLines(): Array<{ start: Point; end: Point; angle: number }> {
    const lines = [];
    
    // Generate radial lines every 11.25 degrees to create sector boundaries
    for (let i = 0; i < 32; i++) {
      const angle = i * (360 / 32); // Every 11.25 degrees
      const endPoint = this.getPolygonIntersection(angle);
      
      if (endPoint) {
        lines.push({
          start: this.center,
          end: endPoint,
          angle: angle
        });
      }
    }
    
    return lines;
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

  getEntrancePoints(): Array<{ point: Point; entrance: any }> {
    return this.entrancePositions.map(entrance => {
      const boundaryPoint = this.getPolygonIntersection(entrance.angle);

      if (boundaryPoint) {
        const distance = Math.sqrt(
          Math.pow(boundaryPoint.x - this.center.x, 2) +
          Math.pow(boundaryPoint.y - this.center.y, 2)
        );

        const labelDistance = distance * 0.75;
        const radian = this.toRadiansCompass(entrance.angle);

        const labelPoint = {
          x: this.center.x + Math.cos(radian) * labelDistance,
          y: this.center.y + Math.sin(radian) * labelDistance
        };

        return {
          point: labelPoint,
          entrance: entrance
        };
      } else {
        return {
          point: this.getPointOnCircle(entrance.angle, 0.75),
          entrance: entrance
        };
      }
    });
  }

  getDirectionLabels(): Array<{ point: Point; label: string; angle: number }> {
    // Position labels at 60% distance from center
    const labelRadius = 0.6;
    return this.vastuZones.map((zone, index) => {
      const centerAngle = (index * 22.5) + 11.25;
      const boundaryPoint = this.getPolygonIntersection(centerAngle);

      let labelPoint: Point;
      if (boundaryPoint) {
        const distance = Math.sqrt(
          Math.pow(boundaryPoint.x - this.center.x, 2) +
          Math.pow(boundaryPoint.y - this.center.y, 2)
        );
        const labelDistance = distance * labelRadius;
        const radian = this.toRadiansCompass(centerAngle);

        labelPoint = {
          x: this.center.x + Math.cos(radian) * labelDistance,
          y: this.center.y + Math.sin(radian) * labelDistance
        };
      } else {
        labelPoint = this.getPointOnCircle(centerAngle, labelRadius);
      }

      return {
        point: labelPoint,
        label: zone.name,
        angle: centerAngle + this.rotation
      };
    });
  }

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

  getCompassDirections(): Array<{ point: Point; direction: string; angle: number }> {
    const mainDirections = [
      { direction: 'N', angle: 0 },
      { direction: 'E', angle: 90 },
      { direction: 'S', angle: 180 },
      { direction: 'W', angle: 270 }
    ];

    const compassRadius = 0.9;
    return mainDirections.map(dir => {
      const radian = this.toRadiansCompass(dir.angle);
      return {
        point: {
          x: this.center.x + Math.cos(radian) * this.radius * compassRadius,
          y: this.center.y + Math.sin(radian) * this.radius * compassRadius
        },
        direction: dir.direction,
        angle: dir.angle + this.rotation
      };
    });
  }
}
