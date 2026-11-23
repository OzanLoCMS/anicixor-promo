import React from "react";
import { Composition, Sequence } from "remotion";
import { Intro } from "./scenes/Intro";
import { Home } from "./scenes/Home";
import { Explore } from "./scenes/Explore";
import { Detail } from "./scenes/Detail";
import { Player } from "./scenes/Player";
import { Outro } from "./scenes/Outro";

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

// Sahne süreleri (kare). Her sahne bir sonrakiyle 10 kare örtüşür: 47 sn toplam.
const S = {
  intro: { from: 0, len: 160 },
  home: { from: 150, len: 220 },
  explore: { from: 360, len: 190 },
  detail: { from: 540, len: 220 },
  player: { from: 750, len: 370 },
  outro: { from: 1110, len: 300 },
};

const Promo: React.FC = () => (
  <>
    <Sequence from={S.intro.from} durationInFrames={S.intro.len} premountFor={30}><Intro /></Sequence>
    <Sequence from={S.home.from} durationInFrames={S.home.len} premountFor={30}><Home /></Sequence>
    <Sequence from={S.explore.from} durationInFrames={S.explore.len} premountFor={30}><Explore /></Sequence>
    <Sequence from={S.detail.from} durationInFrames={S.detail.len} premountFor={30}><Detail /></Sequence>
    <Sequence from={S.player.from} durationInFrames={S.player.len} premountFor={30}><Player /></Sequence>
    <Sequence from={S.outro.from} durationInFrames={S.outro.len} premountFor={30}><Outro /></Sequence>
  </>
);

const common = { fps: FPS, width: WIDTH, height: HEIGHT } as const;

export const Root: React.FC = () => (
  <>
    <Composition id="Promo" component={Promo} durationInFrames={1410} {...common} />
    <Composition id="S1-Intro" component={Intro} durationInFrames={S.intro.len} {...common} />
    <Composition id="S2-Home" component={Home} durationInFrames={S.home.len} {...common} />
    <Composition id="S3-Explore" component={Explore} durationInFrames={S.explore.len} {...common} />
    <Composition id="S4-Detail" component={Detail} durationInFrames={S.detail.len} {...common} />
    <Composition id="S5-Player" component={Player} durationInFrames={S.player.len} {...common} />
    <Composition id="S6-Outro" component={Outro} durationInFrames={S.outro.len} {...common} />
  </>
);
