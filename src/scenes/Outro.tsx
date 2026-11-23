import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ACCENT, BG, Plate, ShotImg, camAt, fit, springIn } from "../lib/camera";
import { fontFamily } from "../lib/font";
import { manifest } from "../lib/manifest";
import { SceneFrame } from "./common";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// SAHNE 6: Kamera yavaşça uzaklaşır (profil yakalandıysa profil, yoksa ana sayfa), sonra logo ve kapanış metni.
export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const m = manifest.profile ?? manifest.home;
  const logo = manifest.logo;
  const focus = m ? fit(m.rects.focus ?? m.rects.hero ?? m.rects.header ?? { x: 400, y: 100, w: 1100, h: 500 }, 0.7, 1.6) : { cx: 960, cy: 540, z: 1 };
  const cam = camAt(frame, [
    { f: 0, cx: focus.cx, cy: focus.cy, z: focus.z, rx: 0, ry: 0 },
    { f: 120, cx: 960, cy: 540, z: 0.9, rx: 3, ry: -5 },
  ]);
  const sceneOpacity = interpolate(frame, [105, 140], [1, 0], clamp);
  const inT = (d: number, len = 22) => interpolate(frame, [d, d + len], [0, 1], clamp);
  const logoIn = springIn(frame, fps, 150);
  return (
    <SceneFrame>
      <AbsoluteFill style={{ background: BG, opacity: sceneOpacity }}>
        {m ? (
          <Plate cam={cam} width={m.shot.width} height={m.shot.height}>
            <ShotImg shot={m.shot} />
          </Plate>
        ) : null}
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
          {logo ? (
            <Img src={staticFile(`captures/${logo.file}`)} style={{ width: 130, height: 130, objectFit: "contain", opacity: logoIn, transform: `scale(${0.6 + 0.4 * logoIn})` }} />
          ) : null}
          <div style={{ fontWeight: 800, fontSize: 104, letterSpacing: 14, color: "#F6F2F8", opacity: inT(160), transform: `translateY(${(1 - inT(160)) * 22}px)` }}>ANICIXOR</div>
          <div style={{ fontWeight: 400, fontSize: 44, color: "#BBB3C5", opacity: inT(185), transform: `translateY(${(1 - inT(185)) * 16}px)` }}>Anime deneyimini keşfet.</div>
          <div style={{ fontWeight: 600, fontSize: 36, color: ACCENT, letterSpacing: 2, marginTop: 14, opacity: inT(215) }}>anicixor.fun</div>
        </div>
      </AbsoluteFill>
    </SceneFrame>
  );
};
