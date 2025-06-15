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

// Overlay for Marma Sthan, applies an internal offset (+14°) so image "N" aligns visually.
// User sees their input value in the UI; overlay adds +14 to rotation then -9 for "north" convention.
export const MarmaSthanOverlay: React.FC<MarmaSthanOverlayProps> = ({
  center,
  rotation,
  opacity,
  scale,
}) => {
  const baseRadius = 120; // matches approx size of ShaktiChakra, tweak for aesthetics
  const imgSize = baseRadius * scale * 2.2;

  // Internal north correction offset so the Marma Sthan overlay aligns visually.
  // Positive: rotates overlay clockwise for image-to-north correction.
  const marmaImageNorthCorrection = 14; // 14° as per latest user request

  // Overlay rotation: user input + correction offset -9 (to match north like other overlays)
  const overlayRotation = rotation + marmaImageNorthCorrection - 9;

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
