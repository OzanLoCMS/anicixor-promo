import React from "react";
import { useCurrentFrame } from "remotion";
import { Cursor, Plate, ShotImg, camAt, center, fit, union } from "../lib/camera";
import { manifest } from "../lib/manifest";
import { Missing, SceneFrame } from "./common";

// SAHNE 4: Anime detayı. Kapak -> başlık/açıklama -> bölüm listesine kamera hareketi.
export const Detail: React.FC = () => {
  const frame = useCurrentFrame();
  const m = manifest.anime;
  if (!m) return <Missing />;
  const r = m.rects;
  const cover = r.cover ? fit(r.cover, 0.7, 2) : { cx: 480, cy: 480, z: 1.4 };
  const textRect = union([r.title, r.description].filter((x): x is NonNullable<typeof x> => !!x));
  const text = textRect ? fit(textRect, 0.75, 1.8) : { cx: 1100, cy: 450, z: 1.3 };
  const eps = r.episodes ? fit(r.episodes, 0.8, 1.5) : { cx: 960, cy: 800, z: 1.2 };
  const cam = camAt(frame, [
    { f: 0, cx: 960, cy: 540, z: 1, rx: 3, ry: -5 },
    { f: 12, cx: 960, cy: 540, z: 1.02, rx: 2, ry: -4 },
    { f: 52, cx: cover.cx, cy: cover.cy, z: cover.z, rx: 0, ry: 0 },
    { f: 70, cx: cover.cx, cy: cover.cy, z: cover.z, rx: 0, ry: 0 },
    { f: 115, cx: text.cx, cy: text.cy, z: text.z, rx: 0, ry: 0 },
    { f: 135, cx: text.cx, cy: text.cy, z: text.z, rx: 0, ry: 0 },
    { f: 190, cx: eps.cx, cy: eps.cy, z: eps.z, rx: 0, ry: 0 },
    { f: 218, cx: eps.cx, cy: eps.cy, z: eps.z * 1.03, rx: 0, ry: 0 },
  ]);
  const cc = r.cover ? center(r.cover) : { x: 480, y: 480 };
  const tc = textRect ? center(textRect) : { x: 1100, y: 450 };
  const first = r.firstEpisode ? center(r.firstEpisode) : { x: eps.cx, y: eps.cy };
  return (
    <SceneFrame>
      <Plate cam={cam} width={m.shot.width} height={m.shot.height}>
        <ShotImg shot={m.shot} />
        <Cursor
          frame={frame}
          zoom={cam.z}
          keys={[
            { f: 0, x: 1500, y: 160 },
            { f: 50, x: cc.x + 80, y: cc.y + 60 },
            { f: 110, x: tc.x, y: tc.y + 40 },
            { f: 190, x: first.x, y: first.y },
            { f: 220, x: first.x + 30, y: first.y + 20 },
          ]}
        />
      </Plate>
    </SceneFrame>
  );
};
