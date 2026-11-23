import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile } from "remotion";
import type { Rect, Shot } from "./types";

export const W = 1920;
export const H = 1080;
export const BG = "#100D14";
export const ACCENT = "#9B5DE5";

export type Cam = { cx: number; cy: number; z: number; rx: number; ry: number };
export type CamKey = { f: number; cx: number; cy: number; z: number; rx?: number; ry?: number };

const ease = Easing.bezier(0.45, 0, 0.15, 1);

// Anahtar kareleri artan sıraya zorlar (interpolate sıkı artan giriş ister).
export const mkKeys = <T extends { f: number }>(keys: T[]): T[] => {
  const out: T[] = [];
  for (const k of keys) {
    const prev = out[out.length - 1];
    out.push(prev && k.f <= prev.f ? { ...k, f: prev.f + 1 } : k);
  }
  return out;
};

// Kare tabanlı kamera: pan (cx, cy), zoom (z), 3D perspektif (rx, ry).
export const camAt = (frame: number, rawKeys: CamKey[]): Cam => {
  const keys = mkKeys(rawKeys);
  const f = keys.map((k) => k.f);
  const g = (fn: (k: CamKey) => number) =>
    interpolate(frame, f, keys.map(fn), { easing: ease, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return {
    cx: g((k) => k.cx),
    cy: g((k) => k.cy),
    z: g((k) => k.z),
    rx: g((k) => k.rx ?? 0),
    ry: g((k) => k.ry ?? 0),
  };
};

export const union = (rs: Rect[]): Rect | undefined => {
  if (!rs.length) return undefined;
  const x = Math.min(...rs.map((r) => r.x));
  const y = Math.min(...rs.map((r) => r.y));
  const x2 = Math.max(...rs.map((r) => r.x + r.w));
  const y2 = Math.max(...rs.map((r) => r.y + r.h));
  return { x, y, w: x2 - x, h: y2 - y };
};

export const center = (r: Rect) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });

// Odak takibi: dikdörtgeni kadraja oturtan kamera konumu.
export const fit = (r: Rect, fill = 0.8, maxZ = 2.4, minZ = 1) => ({
  cx: r.x + r.w / 2,
  cy: r.y + r.h / 2,
  z: Math.min(maxZ, Math.max(minZ, Math.min((W * fill) / r.w, (H * fill) / r.h))),
});

export const fade = (frame: number, at: number, dur = 8) =>
  interpolate(frame, [at, at + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// Sayfa düzlemi: kamera dönüşümü + perspektif. Sayfa dışına taşmayı önlemek için merkez sınırlanır.
export const Plate: React.FC<{ cam: Cam; width: number; height: number; children: React.ReactNode }> = ({
  cam,
  width,
  height,
  children,
}) => {
  const z = cam.z;
  const cx = z >= 1 ? Math.min(Math.max(cam.cx, W / 2 / z), width - W / 2 / z) : width / 2;
  const cy = z >= 1 ? Math.min(Math.max(cam.cy, H / 2 / z), height - H / 2 / z) : height / 2;
  return (
    <AbsoluteFill style={{ background: BG, perspective: 2400, perspectiveOrigin: `${W / 2}px ${H / 2}px`, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width,
          height,
          transformOrigin: "0 0",
          transform: `translate3d(${W / 2}px, ${H / 2}px, 0) rotateX(${cam.rx}deg) rotateY(${cam.ry}deg) scale(${z}) translate3d(${-cx}px, ${-cy}px, 0)`,
          boxShadow: "0 30px 120px rgba(0,0,0,0.6)",
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

export const ShotImg: React.FC<{ shot: Shot; opacity?: number }> = ({ shot, opacity = 1 }) => (
  <Img
    src={staticFile(`captures/${shot.file}`)}
    style={{ position: "absolute", left: 0, top: 0, width: shot.width, height: shot.height, opacity }}
  />
);

export type CursorKey = { f: number; x: number; y: number; click?: boolean };

// İmleç: sayfa koordinatlarında, kamerayla birlikte hareket eder; boyutu zoom'a göre sabit tutulur.
export const Cursor: React.FC<{ frame: number; keys: CursorKey[]; zoom: number }> = ({ frame, keys: raw, zoom }) => {
  const keys = mkKeys(raw);
  const f = keys.map((k) => k.f);
  const e = Easing.bezier(0.4, 0, 0.2, 1);
  const opt = { easing: e, extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  const x = interpolate(frame, f, keys.map((k) => k.x), opt);
  const y = interpolate(frame, f, keys.map((k) => k.y), opt);
  const s = 1 / zoom;
  const rings = keys
    .filter((k) => k.click)
    .map((c) => {
      const t = frame - c.f;
      if (t < 0 || t > 16) return null;
      return (
        <div
          key={c.f}
          style={{
            position: "absolute",
            left: c.x - 34 * s,
            top: c.y - 34 * s,
            width: 68 * s,
            height: 68 * s,
            borderRadius: "50%",
            border: `${3 * s}px solid ${ACCENT}`,
            opacity: interpolate(t, [0, 16], [0.95, 0]),
            transform: `scale(${interpolate(t, [0, 16], [0.3, 1.3])})`,
          }}
        />
      );
    });
  const press = keys.some((k) => k.click && frame >= k.f && frame < k.f + 6) ? 0.85 : 1;
  return (
    <>
      {rings}
      <svg
        width={34 * s}
        height={34 * s}
        viewBox="0 0 24 24"
        style={{ position: "absolute", left: x, top: y, transform: `scale(${press})`, filter: "drop-shadow(0 2px 4px rgba(0,0,0,.6))" }}
      >
        <path d="M4 2l16 9-7 2-3 7z" fill="#fff" stroke="#111" strokeWidth="1.2" />
      </svg>
    </>
  );
};

export const springIn = (frame: number, fps: number, delay = 0) =>
  spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 120 } });
