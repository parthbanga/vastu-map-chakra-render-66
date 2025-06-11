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

  // 32 Entrance positions - positioned strategically to avoid overlapping
  private entrancePositions = [
    // North zone entrances
    { angle: 348.75, name: 'N4', radiusMultiplier: 0.75 },  
    { angle: 11.25, name: 'N5', radiusMultiplier: 0.75 },   
    
    // North-NE zone entrances  
    { angle: 16.875, name: 'N6', radiusMultiplier: 0.8 },  
    { angle: 28.125, name: 'N7', radiusMultiplier: 0.8 },  
    
    // North-East zone entrances
    { angle: 39.375, name: 'N8', radiusMultiplier: 0.85 },  
    { angle: 50.625, name: 'E1', radiusMultiplier: 0.85 },  
    
    // East-NE zone entrances
    { angle: 61.875, name: 'E2', radiusMultiplier: 0.8 },  
    { angle: 73.125, name: 'E3', radiusMultiplier: 0.8 },  
    
    // East zone entrances
    { angle: 78.75, name: 'E4', radiusMultiplier: 0.75 },   
    { angle: 101.25, name: 'E5', radiusMultiplier: 0.75 },  
    
    // East-SE zone entrances
    { angle: 106.875, name: 'E6', radiusMultiplier: 0.8 }, 
    { angle: 118.125, name: 'E7', radiusMultiplier: 0.8 }, 
    
    // South-East zone entrances
    { angle: 129.375, name: 'E8', radiusMultiplier: 0.85 }, 
    { angle: 140.625, name: 'S1', radiusMultiplier: 0.85 }, 
    
    // South-SE zone entrances
    { angle: 151.875, name: 'S2', radiusMultiplier: 0.8 }, 
    { angle: 163.125, name: 'S3', radiusMultiplier: 0.8 }, 
    
    // South zone entrances
    { angle: 168.75, name: 'S4', radiusMultiplier: 0.75 },  
    { angle: 191.25, name: 'S5', radiusMultiplier: 0.75 },  
    
    // South-SW zone entrances
    { angle: 196.875, name: 'S6', radiusMultiplier: 0.8 }, 
    { angle: 208.125, name: 'S7', radiusMultiplier: 0.8 }, 
    
    // South-West zone entrances
    { angle: 219.375, name: 'S8', radiusMultiplier: 0.85 }, 
    { angle: 230.625, name: 'W1', radiusMultiplier: 0.85 }, 
    
    // West-SW zone entrances
    { angle: 241.875, name: 'W2', radiusMultiplier: 0.8 }, 
    { angle: 253.125, name: 'W3', radiusMultiplier: 0.8 }, 
    
    // West zone entrances
    { angle: 258.75, name: 'W4', radiusMultiplier: 0.75 },  
    { angle: 281.25, name: 'W5', radiusMultiplier: 0.75 },  
    
    // West-NW zone entrances
    { angle: 286.875, name: 'W6', radiusMultiplier: 0.8 }, 
    { angle: 298.125, name: 'W7', radiusMultiplier: 0.8 }, 
    
    // North-West zone entrances
    { angle: 309.375, name: 'W8', radiusMultiplier: 0.85 }, 
    { angle: 320.625, name: 'N1', radiusMultiplier: 0.85 }, 
    
    // North-NW zone entrances
    { angle: 331.875, name: 'N2', radiusMultiplier: 0.8 }, 
    { angle: 343.125, name: 'N3', radiusMultiplier: 0.8 }  
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

  // Get entrance points with optimized positioning to prevent overlapping
  getEntrancePoints(): Array<{ point: Point; entrance: any }> {
    return this.entrancePositions.map(entrance => ({
      point: this.getPointOnCircle(entrance.angle, entrance.radiusMultiplier),
      entrance
    }));
  }

  // Get direction labels - positioned in the center of each zone sector (between radial lines)
  getDirectionLabels(): Array<{ point: Point; label: string; angle: number }> {
    // Position labels at 60% distance from center to give good visibility in the zone sectors
    const labelRadius = 0.6;
    console.log('Direction labels radius:', labelRadius, 'positioned in center of zone sectors between radial lines');
    
    return this.vastuZones.map(zone => {
      // Use the zone's center angle + 11.25° to position label in the CENTER of the zone sector
      // Each zone spans 22.5°, so adding 11.25° puts us in the middle of the sector
      const centerAngle = zone.angle + 11.25;
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
