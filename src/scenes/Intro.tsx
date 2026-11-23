import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ACCENT, BG, Easing, springIn } from "./introDeps";
import { manifest } from "../lib/manifest";
import { fontFamily } from "../lib/font";

// SAHNE 1: Logo koyu zeminde belirir, kamera logoya yaklaşır.
export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = manifest.logo;
  const logoIn = springIn(frame, fps, 6);
  const textIn = interpolate(frame, [30, 58], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const line = interpolate(frame, [44, 80], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const push = interpolate(frame, [105, 160], [1, 14], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.5, 0, 0.9, 0.4) });
  const out = interpolate(frame, [130, 158], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: BG, alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28, transform: `scale(${push})`, opacity: out }}>
        {logo ? (
          <Img src={staticFile(`captures/${logo.file}`)} style={{ width: 150, height: 150, objectFit: "contain", transform: `scale(${0.6 + 0.4 * logoIn})`, opacity: logoIn }} />
        ) : null}
        <div style={{ fontFamily, fontWeight: 800, fontSize: 112, letterSpacing: 14, color: "#F6F2F8", opacity: textIn, transform: `translateY(${(1 - textIn) * 24}px)` }}>
          ANICIXOR
        </div>
        <div style={{ width: 420 * line, height: 3, background: ACCENT }} />
      </div>
    </AbsoluteFill>
  );
};
