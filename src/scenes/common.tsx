import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { BG, fade } from "../lib/camera";

// Her sahne ilk 10 karede önceki sahnenin üzerine yumuşakça girer.
export const SceneFrame: React.FC<{ children: React.ReactNode; fadeIn?: boolean }> = ({ children, fadeIn = true }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: BG, opacity: fadeIn ? fade(frame, 0, 10) : 1 }}>
      <CameraMotionBlur shutterAngle={100} samples={4}>
        {children}
      </CameraMotionBlur>
    </AbsoluteFill>
  );
};

// Capture eksikse sahne boş koyu kare olarak kalır; verify adımı bunu yakalar, rapor nedenini yazar.
export const Missing: React.FC = () => <AbsoluteFill style={{ background: BG }} />;
