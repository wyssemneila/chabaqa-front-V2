import React from "react";
import { Composition } from "remotion";
import { DeutschifyVideo } from "./DeutschifyVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="DeutschifyMotionAd"
        component={DeutschifyVideo}
        durationInFrames={3120}
        fps={60}
        width={1080}
        height={1920}
      />
    </>
  );
};
