import { loadFont } from "@remotion/google-fonts/Inter";

declare const process: { env: Record<string, string | undefined> };

// Siteyle aynı yazı tipi (Inter). Webfont erişimi olmayan ortamlarda REMOTION_NO_WEBFONT=1 ile atlanır.
export const fontFamily: string = process.env.REMOTION_NO_WEBFONT
  ? "sans-serif"
  : loadFont("normal", { weights: ["400", "600", "800"], subsets: ["latin", "latin-ext"] }).fontFamily;
