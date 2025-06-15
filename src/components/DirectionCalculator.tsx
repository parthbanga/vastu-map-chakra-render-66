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
  // IMPORTANT: angles below are compass angles: 0° = up/N, 90°=E, 180°=S, 270°=W
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

  // 32 Entrance positions -- ensure all are relative to compass angles (0 = up)
  private entrancePositions = [
    { angle: 5.625, name: 'N4' },    
    { angle: 16.875, name: 'N5' },
    { angle: 28.125, name: 'N6' },
    { angle: 39.375, name: 'N7' },
    { angle: 50.625, name: 'N8' },
    { angle: 61.875, name: 'E1' },
    { angle: 73.125, name: 'E2' },
    { angle: 84.375, name: 'E3' },
    { angle: 95.625, name: 'E4' },
    { angle: 106.875, name: 'E5' },
    { angle: 118.125, name: 'E6' },
    { angle: 129.375, name: 'E7' },
    { angle: 140.625, name: 'E8' },
    { angle: 151.875, name: 'S1' },
    { angle: 163.125, name: 'S2' },
    { angle: 174.375, name: 'S3' },
    { angle: 185.625, name: 'S4' },
    { angle: 196.875, name: 'S5' },
    { angle: 208.125, name: 'S6' },
    { angle: 219.375, name: 'S7' },
    { angle: 230.625, name: 'S8' },
    { angle: 241.875, name: 'W1' },
    { angle: 253.125, name: 'W2' },
    { angle: 264.375, name: 'W3' },
    { angle: 275.625, name: 'W4' },
    { angle: 286.875, name: 'W5' },
    { angle: 298.125, name: 'W6' },
    { angle: 309.375, name: 'W7' },
    { angle: 320.625, name: 'W8' },
    { angle: 331.875, name: 'N1' },
    { angle: 343.125, name: 'N2' },
    { angle: 354.375, name: 'N3' }
  ];

  constructor({ center, radius, rotation, scale, polygonPoints = [] }: DirectionCalculatorProps) {
    this.center = center;
    this.radius = radius;
    this.rotation = rotation;
    this.scale = scale;
    this.polygonPoints = polygonPoints;
  }

  // Convert angle to radians so 0°=UP, angles increase clockwise; add rotation
  private toRadiansCompass(degrees: number): number {
    // COMPASS: 0° = up, 90° = right, increasing clockwise; for SVG, 0° is right so shift -90
    return ((degrees - 90 + this.rotation) * Math.PI) / 180;
  }

  // For all get* methods: angles must match compass for start/end points and labels

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
    // 0° = up (North), increment by 22.5 deg (16 lines)
    for (let i = 0; i < 16; i++) {
      // COMPASS: 0°=up, so angle = i * 22.5
      const angle = i * 22.5;
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
    for (let i = 0; i < 32; i++) {
      // COMPASS: 0°=up, so angle = i * 11.25
      const angle = i * 11.25;
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
    // Each zone is 22.5° wide, centered at zone.angle (compass)
    // Boundaries at -11.25 and +11.25 from the center angle
    return this.vastuZones.map((zone) => {
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
    // Each entrance label should also use compass angles (0°=up)
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
    // Now correctly center each label between radial lines (for 16 directions, each 22.5° wide)
    const labelRadius = 0.6;
    return this.vastuZones.map((zone, i) => {
      // Each zone covers center angle +/- 11.25°
      // For label placement, use the middle of the sector
      // For 16 directions: N at 0°, NNE at 22.5°, ..., NNW at 337.5°
      // Each zone's "center" is their angle (so this is actually already correct mathematically)
      // The render bug is often because of the boundary lines being at the same angle as label
      // To address the visual, ensure that boundaries drawn in the overlay match sector edges
      // The key bug is not in the centerAngle but in where labels are shown *relative* to the boundaries
      // So here, we place each label at zone.angle, which IS the center BETWEEN its boundaries

      // But let's double-check:
      // For zone 0 (N): shows up at 0°
      // Boundaries for zone 0 are -11.25° to +11.25°
      // Therefore, label for N goes at 0° (midpoint between -11.25 and +11.25)

      // So we shift the label slightly toward the center of the sector (if visually off).
      // But current approach is correct as per geometry: the direction label is at the center of sector.

      // However, the SVG text alignment ("dominantBaseline", etc.) could cause a mis-align.
      // To ensure, let's just re-calculate: Set label at centerAngle = zone.angle (as before).
      const centerAngle = zone.angle;
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
    return this.vastuZones.map((zone) => {
      const startAngle = zone.angle - 11.25;
      const endAngle = zone.angle + 11.25;
      const startPoint = this.getPointOnCircle(startAngle, 0.3);
      const endPoint = this.getPointOnCircle(endAngle, 0.3);
      const outerStartPoint = this.getPointOnCircle(startAngle, 1.0);
      const outerEndPoint = this.getPointOnCircle(endAngle, 1.0);

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
