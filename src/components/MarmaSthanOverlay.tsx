
import React from "react";

interface Point {
  x: number;
  y: number;
}

interface MarmaSthanOverlayProps {
  center: Point;
  rotation: number;
  opacity: number;
  scale: number;
  polygonPoints: Point[]; // unused, needed for prop compat
}

// This overlay simply centers and rotates/scales the given image as a Marma Sthan overlay, no calculations.
export const MarmaSthanOverlay: React.FC<MarmaSthanOverlayProps> = ({
  center,
  rotation,
  opacity,
  scale,
}) => {
  // Choose a reference "radius" for scaling. We'll use the same convention as VastuPurush/ShaktiChakra overlays:
  // We pick a size relative to the visible plot area, but since only center is given,
  // let's pick a default "radius" of 120 (can be tweaked as needed for app visual scale).
  const baseRadius = 120; // matches the approx size of ShaktiChakra, tweak for aesthetics
  const imgSize = baseRadius * scale * 2.2;

  return (
    <div
      style={{
        position: "absolute",
        top: center.y - imgSize / 2,
        left: center.x - imgSize / 2,
        width: imgSize,
        height: imgSize,
        opacity,
        pointerEvents: "none",
        zIndex: 21,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: "center",
      }}
    >
      <img
        src="/lovable-uploads/18b4a2e8-f4c4-411b-a958-8d9eb22c17a0.png"
        alt="Marma Sthan Overlay"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block"
        }}
        draggable={false}
      />
    </div>
  );
};
