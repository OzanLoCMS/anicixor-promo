import React from "react";
import { useCurrentFrame } from "remotion";
import { Cursor, Plate, ShotImg, camAt, center, fit, union } from "../lib/camera";
import { manifest } from "../lib/manifest";
import { Missing, SceneFrame } from "./common";

// SAHNE 2: Ana sayfa. Genel görünüm -> anime kartı satırı -> kartlar üzerinde yatay pan -> geri çekilme.
export const Home: React.FC = () => {
  const frame = useCurrentFrame();
  const m = manifest.home;
  if (!m) return <Missing />;
  const cards = m.cards ?? [];
  const first = cards[0];
  const row = first ? cards.filter((c) => Math.abs(c.y - first.y) < 40) : [];
  const left = union(row.slice(0, 3));
  const right = union(row.slice(-3));
  const hero = m.rects.hero ?? m.rects.header;
  const a = left ? fit(left, 0.7, 1.9) : hero ? fit(hero, 0.9, 1.5) : { cx: 960, cy: 540, z: 1.3 };
  const b = right ? fit(right, 0.7, 1.9) : a;
  const z = Math.min(a.z, b.z);
  const cam = camAt(frame, [
    { f: 0, cx: 960, cy: 540, z: 1, rx: 3, ry: -4 },
    { f: 50, cx: 960, cy: 540, z: 1.05, rx: 2, ry: -2 },
    { f: 90, cx: a.cx, cy: a.cy, z, rx: 0, ry: 0 },
    { f: 165, cx: b.cx, cy: b.cy, z, rx: 0, ry: 0 },
    { f: 205, cx: 960, cy: 540, z: 1, rx: 0, ry: 0 },
  ]);
  const ca = center({ x: a.cx, y: a.cy, w: 0, h: 0 });
  const cb = center({ x: b.cx, y: b.cy, w: 0, h: 0 });
  return (
    <SceneFrame>
      <Plate cam={cam} width={m.shot.width} height={m.shot.height}>
        <ShotImg shot={m.shot} />
        <Cursor
          frame={frame}
          zoom={cam.z}
          keys={[
            { f: 0, x: 1560, y: 300 },
            { f: 85, x: ca.x, y: ca.y },
            { f: 165, x: cb.x, y: cb.y },
            { f: 215, x: cb.x + 80, y: cb.y + 60 },
          ]}
        />
      </Plate>
    </SceneFrame>
  );
};
