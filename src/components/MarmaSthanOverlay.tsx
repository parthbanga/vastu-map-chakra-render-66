
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

// Overlay for Marma Sthan, now with a tweakable north-correction offset to align its "N" perfectly with north of the Shakti Chakra/Vastu Purush overlays.
export const MarmaSthanOverlay: React.FC<MarmaSthanOverlayProps> = ({
  center,
  rotation,
  opacity,
  scale,
}) => {
  const baseRadius = 120; // matches approx size of ShaktiChakra, tweak for aesthetics
  const imgSize = baseRadius * scale * 2.2;

  // Fine-tune this correction angle (in degrees) to visually align the MarmaSthan "N" with the grid's North.
  // Positive values rotate clockwise, negative counterclockwise.
  const marmaImageNorthCorrection = 5; // <--- Tweak this value (try 5, 3, -2, etc for perfect alignment!)

  // Final rotation formula: user rotation - 9 + north correction
  const overlayRotation = rotation - 9 + marmaImageNorthCorrection;

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
        transform: `rotate(${overlayRotation}deg)`,
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
