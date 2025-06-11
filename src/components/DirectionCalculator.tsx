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

  // 32 Entrance positions - uniformly distributed with equal angular spacing
  private entrancePositions = [
    // Each entrance is positioned at the center of its sector (11.25° spacing each)
    { angle: 5.625, name: 'N4' },    // Center of first sector
    { angle: 16.875, name: 'N5' },   // Center of second sector
    { angle: 28.125, name: 'N6' },   // Center of third sector
    { angle: 39.375, name: 'N7' },   // Center of fourth sector
    { angle: 50.625, name: 'N8' },   // Center of fifth sector
    { angle: 61.875, name: 'E1' },   // Center of sixth sector
    { angle: 73.125, name: 'E2' },   // Center of seventh sector
    { angle: 84.375, name: 'E3' },   // Center of eighth sector
    { angle: 95.625, name: 'E4' },   // Center of ninth sector
    { angle: 106.875, name: 'E5' },  // Center of tenth sector
    { angle: 118.125, name: 'E6' },  // Center of eleventh sector
    { angle: 129.375, name: 'E7' },  // Center of twelfth sector
    { angle: 140.625, name: 'E8' },  // Center of thirteenth sector
    { angle: 151.875, name: 'S1' },  // Center of fourteenth sector
    { angle: 163.125, name: 'S2' },  // Center of fifteenth sector
    { angle: 174.375, name: 'S3' },  // Center of sixteenth sector
    { angle: 185.625, name: 'S4' },  // Center of seventeenth sector
    { angle: 196.875, name: 'S5' },  // Center of eighteenth sector
    { angle: 208.125, name: 'S6' },  // Center of nineteenth sector
    { angle: 219.375, name: 'S7' },  // Center of twentieth sector
    { angle: 230.625, name: 'S8' },  // Center of twenty-first sector
    { angle: 241.875, name: 'W1' },  // Center of twenty-second sector
    { angle: 253.125, name: 'W2' },  // Center of twenty-third sector
    { angle: 264.375, name: 'W3' },  // Center of twenty-fourth sector
    { angle: 275.625, name: 'W4' },  // Center of twenty-fifth sector
    { angle: 286.875, name: 'W5' },  // Center of twenty-sixth sector
    { angle: 298.125, name: 'W6' },  // Center of twenty-seventh sector
    { angle: 309.375, name: 'W7' },  // Center of twenty-eighth sector
    { angle: 320.625, name: 'W8' },  // Center of twenty-ninth sector
    { angle: 331.875, name: 'N1' },  // Center of thirtieth sector
    { angle: 343.125, name: 'N2' },  // Center of thirty-first sector
    { angle: 354.375, name: 'N3' }   // Center of thirty-second sector
  ];

  constructor({ center, radius, rotation, scale, polygonPoints = [] }: DirectionCalculatorProps) {
    this.center = center;
    this.radius = radius;
    this.rotation = rotation;
    this.scale = scale;
    this.polygonPoints = polygonPoints;
  }

  // Convert angle to radians
  private toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  // Calculate intersection of a line from center with polygon boundary
  private getPolygonIntersection(angle: number): Point | null {
    if (this.polygonPoints.length < 3) {
      // Fallback to circle if no valid polygon
      return this.getPointOnCircle(angle, 1);
    }

    const adjustedAngle = angle + this.rotation;
    const radian = this.toRadians(adjustedAngle);
    
    // Direction vector from center
    const dirX = Math.sin(radian);
    const dirY = -Math.cos(radian);
    
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

  // Get radial line endpoints that stop at polygon boundary
  getRadialLineEndpoints(): Array<{ start: Point; end: Point; angle: number }> {
    const lines = [];
    
    // Generate 16 main direction lines
    for (let i = 0; i < 16; i++) {
      const angle = i * (360 / 16);
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

  // Get entrance radial lines for 32 entrances
  getEntranceRadialLines(): Array<{ start: Point; end: Point; angle: number }> {
    const lines = [];
    
    // Generate radial lines for all 32 entrance positions
    this.entrancePositions.forEach(entrance => {
      const endPoint = this.getPolygonIntersection(entrance.angle);
      
      if (endPoint) {
        lines.push({
          start: this.center,
          end: endPoint,
          angle: entrance.angle
        });
      }
    });
    
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

  // Get entrance points positioned within polygon boundary in center of sectors
  getEntrancePoints(): Array<{ point: Point; entrance: any }> {
    return this.entrancePositions.map(entrance => {
      // Get intersection point with polygon boundary
      const boundaryPoint = this.getPolygonIntersection(entrance.angle);
      
      if (boundaryPoint) {
        // Calculate distance from center to boundary
        const distance = Math.sqrt(
          Math.pow(boundaryPoint.x - this.center.x, 2) + 
          Math.pow(boundaryPoint.y - this.center.y, 2)
        );
        
        // Position label at 85% of the distance from center to boundary (within polygon)
        const labelDistance = distance * 0.85;
        
        const adjustedAngle = entrance.angle + this.rotation;
        const radian = this.toRadians(adjustedAngle);
        
        const labelPoint = {
          x: this.center.x + Math.sin(radian) * labelDistance,
          y: this.center.y - Math.cos(radian) * labelDistance
        };
        
        return {
          point: labelPoint,
          entrance: entrance
        };
      } else {
        // Fallback to circle positioning if polygon intersection fails
        return {
          point: this.getPointOnCircle(entrance.angle, 0.85),
          entrance: entrance
        };
      }
    });
  }

  // Get direction labels - positioned in the center of each zone sector (between radial lines)
  getDirectionLabels(): Array<{ point: Point; label: string; angle: number }> {
    // Position labels at 60% distance from center to give good visibility in the zone sectors
    const labelRadius = 0.6;
    console.log('Direction labels radius:', labelRadius, 'positioned in center of zone sectors between radial lines');
    
    return this.vastuZones.map((zone, index) => {
      // Calculate the center angle between two adjacent radial lines
      // Radial lines are at: 0°, 22.5°, 45°, 67.5°, 90°, etc. (every 22.5°)
      // Zone centers should be at: 11.25°, 33.75°, 56.25°, 78.75°, etc. (offset by 11.25°)
      const centerAngle = (index * 22.5) + 11.25;
      
      const boundaryPoint = this.getPolygonIntersection(centerAngle);
      
      // Position label in the center of the zone sector
      let labelPoint: Point;
      if (boundaryPoint) {
        const distance = Math.sqrt(
          Math.pow(boundaryPoint.x - this.center.x, 2) + 
          Math.pow(boundaryPoint.y - this.center.y, 2)
        );
        const labelDistance = distance * labelRadius;
        
        const adjustedAngle = centerAngle + this.rotation;
        const radian = this.toRadians(adjustedAngle);
        
        labelPoint = {
          x: this.center.x + Math.sin(radian) * labelDistance,
          y: this.center.y - Math.cos(radian) * labelDistance
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

  // Get compass directions - positioned safely inside the map boundary
  getCompassDirections(): Array<{ point: Point; direction: string; angle: number }> {
    const mainDirections = [
      { direction: 'N', angle: 0 },
      { direction: 'E', angle: 90 },
      { direction: 'S', angle: 180 },
      { direction: 'W', angle: 270 }
    ];

    // Position compass directions well inside the map boundary
    const compassRadius = 0.9; // Fixed radius that keeps compass inside map boundary
    console.log('Compass radius:', compassRadius, 'keeping inside map boundary');
    return mainDirections.map(dir => ({
      point: this.getPointOnCircle(dir.angle, compassRadius),
      direction: dir.direction,
      angle: dir.angle + this.rotation
    }));
  }
}
