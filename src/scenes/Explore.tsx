import React from "react";
import { useCurrentFrame } from "remotion";
import { Cursor, Plate, ShotImg, camAt, center, fade, fit, union } from "../lib/camera";
import { manifest } from "../lib/manifest";
import { Missing, SceneFrame } from "./common";

// SAHNE 3: Keşfet. Filtre düğmesine kayarak yaklaş, aç, paneli göster, kartlara geç.
export const Explore: React.FC = () => {
  const frame = useCurrentFrame();
  const s = manifest.search;
  if (!s) return <Missing />;
  const { base, open } = s;
  const btn = base.rects.filtersButton;
  const panel = open?.rects.panel;
  const cardsSrc = open ?? base;
  const first = cardsSrc.cards?.[0];
  const row = first ? (cardsSrc.cards ?? []).filter((c) => Math.abs(c.y - first.y) < 40) : [];
  const rowRect = union(row);
  const bf = btn ? fit({ x: btn.x - 300, y: btn.y - 60, w: btn.w + 600, h: btn.h + 120 }, 0.9, 1.8) : { cx: 960, cy: 400, z: 1.3 };
  const pf = panel ? fit(panel, 0.8, 1.7) : bf;
  const rf = rowRect ? fit(rowRect, 0.85, 1.5) : { cx: 960, cy: 700, z: 1.1 };
  const clickAt = 70;
  const cam = camAt(frame, [
    { f: 0, cx: 960, cy: 540, z: 1, rx: 2, ry: 4 },
    { f: 25, cx: 960, cy: 540, z: 1.02, rx: 1, ry: 2 },
    { f: 62, cx: bf.cx, cy: bf.cy, z: bf.z, rx: 0, ry: 0 },
    { f: 100, cx: pf.cx, cy: pf.cy, z: pf.z, rx: 0, ry: 0 },
    { f: 125, cx: pf.cx, cy: pf.cy, z: pf.z, rx: 0, ry: 0 },
    { f: 170, cx: rf.cx, cy: rf.cy, z: rf.z, rx: 0, ry: 0 },
    { f: 188, cx: rf.cx, cy: rf.cy, z: rf.z * 1.03, rx: 0, ry: 0 },
  ]);
  const bc = btn ? center(btn) : { x: 960, y: 300 };
  const rc = rowRect ? center(rowRect) : { x: 960, y: 700 };
  const height = Math.max(base.shot.height, open?.shot.height ?? 0);
  return (
    <SceneFrame>
      <Plate cam={cam} width={base.shot.width} height={height}>
        <ShotImg shot={base.shot} />
        {open ? <ShotImg shot={open.shot} opacity={fade(frame, clickAt + 2, 6)} /> : null}
        <Cursor
          frame={frame}
          zoom={cam.z}
          keys={[
            { f: 0, x: 1400, y: 200 },
            { f: 58, x: bc.x, y: bc.y },
            { f: clickAt, x: bc.x, y: bc.y, click: true },
            { f: 130, x: bc.x + 40, y: bc.y + 160 },
            { f: 175, x: rc.x, y: rc.y },
          ]}
        />
      </Plate>
    </SceneFrame>
  );
};
