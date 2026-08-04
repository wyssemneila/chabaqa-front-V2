import { useCurrentFrame, useVideoConfig, interpolate, Easing, AbsoluteFill, spring } from "remotion";

const convertDegreeToProgress = (springValue: number) => {
  if (!Number.isFinite(springValue)) {
    return 0;
  }

  return Math.min(1, Math.max(0, springValue));
};

export const Scene1BrandOpen: React.FC = () => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const glowOpacity = interpolate(
    frame,
    [24, 90],
    [0, 0.7],
    { easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const cardScale = convertDegreeToProgress(spring({ frame, fps, config: { damping: 120 } }));
  const scale = interpolate(cardScale, [0, 1], [0.92, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const textOpacity = interpolate(
    frame,
    [66, 120],
    [0, 1],
    { easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const exitProgress = interpolate(frame, [234, 270], [0, 1], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exitScale = interpolate(exitProgress, [0, 1], [scale, 1.04]);
  const exitBlur = interpolate(exitProgress, [0, 1], [0, 14]);
  const exitOpacity = interpolate(exitProgress, [0, 1], [1, 0]);

  const rootStyle: React.CSSProperties = {
    backgroundColor: "#100904",
    color: "#ffedd7",
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  };

  return (
    <AbsoluteFill style={rootStyle}>
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: glowOpacity,
          transform: `scale(${exitScale})`,
          filter: `blur(${exitBlur}px)`,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            background:
              "radial-gradient(circle at 50% 38%, rgba(220,80,0,0.35) 0%, #100904 56%)",
          }}
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: exitOpacity,
          transform: `scale(${exitScale})`,
        }}
      >
        <div
          style={{
            position: "relative",
            zIndex: 1,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 26,
            opacity: textOpacity,
          }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 22,
              border: "2px solid rgba(220,80,0,0.9)",
              background: "rgba(220,80,0,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#dc5000",
              fontSize: 44,
            }}
          >
            D
          </div>
          <div style={{ fontSize: 72, letterSpacing: -0.03, fontWeight: 500 }}>Deutschify</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
