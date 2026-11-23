import React from "react";
import { useCurrentFrame } from "remotion";
import { Cursor, Plate, ShotImg, camAt, center, fade, fit, type CamKey, type CursorKey } from "../lib/camera";
import { manifest } from "../lib/manifest";
import { Missing, SceneFrame } from "./common";

// SAHNE 5: Video oynatıcı. Gerçek yakalanan durumlar (kontroller, ayarlar menüsü, kalite, sonraki bölüm)
// sırayla gösterilir; kamera her tıklamada ilgili bileşene odaklanır.
export const Player: React.FC = () => {
  const frame = useCurrentFrame();
  const w = manifest.watch;
  if (!w || !w.states.length) return <Missing />;
  const { states, below } = w;
  const n = states.length;
  const player = states[0].rects.player ?? { x: 160, y: 80, w: 1600, h: 900 };
  const k = Math.max(1, n - 1);
  const step = Math.min(60, Math.max(45, Math.floor(150 / k)));
  const st = states.map((_, i) => (i === 0 ? 0 : 80 + (i - 1) * step));
  const belowStart = st[n - 1] + 75;

  const pf = fit(player, 0.92, 1.35);
  const keys: CamKey[] = [
    { f: 0, cx: 960, cy: 540, z: 1, rx: 4, ry: -6 },
    { f: 50, cx: pf.cx, cy: pf.cy, z: pf.z, rx: 0, ry: 0 },
  ];
  const cursor: CursorKey[] = [{ f: 0, x: 1500, y: 900 }, { f: 40, x: center(player).x, y: center(player).y + 200 }];
  let prev = { cx: pf.cx, cy: pf.cy, z: pf.z };
  for (let i = 1; i < n; i++) {
    const focus = states[i].rects.focus ?? states[i].rects.clicked ?? player;
    const cf = fit(focus, 0.7, 2.3);
    keys.push({ f: st[i] - 12, ...prev, rx: 0, ry: 0 }, { f: st[i] + 28, cx: cf.cx, cy: cf.cy, z: cf.z, rx: 0, ry: 0 });
    prev = cf;
    const c = states[i].rects.clicked;
    if (c) {
      const p = center(c);
      cursor.push({ f: st[i] - 24, x: p.x - 160, y: p.y - 90 }, { f: st[i] - 6, x: p.x, y: p.y, click: true });
    }
  }
  if (below) {
    const list = below.rects.episodeList ?? below.rects.episodes;
    const lf = list ? fit(list, 0.8, 1.3) : { cx: 960, cy: 900, z: 1.1 };
    keys.push({ f: belowStart - 12, ...prev, rx: 0, ry: 0 }, { f: belowStart + 55, cx: lf.cx, cy: lf.cy, z: lf.z, rx: 0, ry: 0 }, { f: 368, cx: lf.cx, cy: lf.cy, z: lf.z * 1.03, rx: 0, ry: 0 });
    const fe = below.rects.firstEpisode ?? list;
    if (fe) cursor.push({ f: belowStart + 50, x: center(fe).x, y: center(fe).y });
  } else {
    keys.push({ f: st[n - 1] + 140, cx: prev.cx, cy: prev.cy, z: prev.z, rx: 0, ry: 0 }, { f: 368, cx: 960, cy: 540, z: 1, rx: 0, ry: 0 });
  }
  const cam = camAt(frame, keys);
  const height = Math.max(...states.map((s) => s.shot.height), below?.shot.height ?? 0);
  return (
    <SceneFrame>
      <Plate cam={cam} width={states[0].shot.width} height={height}>
        {states.map((s, i) => (
          <ShotImg key={s.name + i} shot={s.shot} opacity={i === 0 ? 1 : fade(frame, st[i], 6)} />
        ))}
        {below ? <ShotImg shot={below.shot} opacity={fade(frame, belowStart, 10)} /> : null}
        <Cursor frame={frame} zoom={cam.z} keys={cursor} />
      </Plate>
    </SceneFrame>
  );
};
