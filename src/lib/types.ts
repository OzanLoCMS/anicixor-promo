// Capture betiğinin ürettiği manifest tipleri. Koordinatlar CSS pikseli (1920 genişlik).
export type Rect = { x: number; y: number; w: number; h: number };
export type Shot = { file: string; width: number; height: number };

export type State = {
  name: string;
  shot: Shot;
  rects: Record<string, Rect | undefined>;
  cards?: Rect[];
};

export type Manifest = {
  capturedAt: string;
  logo?: Shot;
  home?: State;
  search?: { base: State; open?: State };
  anime?: State;
  watch?: { states: State[]; below?: State };
  profile?: State;
};
