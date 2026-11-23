import raw from "../manifest.json";
import type { Manifest } from "./types";

export const manifest = raw as unknown as Manifest;
