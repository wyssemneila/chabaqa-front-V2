import { useCurrentFrame, interpolate, Easing, AbsoluteFill } from "remotion";

export const Scene2FromTunisia: React.FC = () => {
    const frame = useCurrentFrame();
  const enterProgress = interpolate(
    frame,
    [228, 288],
    [0, 1],
    { easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const exitProgress = interpolate(
    frame,
    [528, 600],
    [0, 1],
    { easing: Easing.in(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const rootStyle: React.CSSProperties = {
    backgroundColor: "#100904",
    color: "#ffedd7",
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    width: "100%",
    height: "100%",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    gap: 32,
    padding: "0 56px",
  };

  return (
    <AbsoluteFill style={rootStyle}>
      <AbsoluteFill style={{ opacity: 0.45 * enterProgress, transform: `scale(${1 + 0.03 * enterProgress})` }}>
        <div style={{ width: "100%", height: "100%", background: "radial-gradient(circle at 50% 42%, #ffb077 0%, #100904 55%)" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: enterProgress * (1 - exitProgress), transform: `translateY(${28 * (1 - enterProgress)}px)` }}>
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 18, alignItems: "center" }}>
          <div style={{ fontSize: 56, lineHeight: 1.06, letterSpacing: -0.02, fontWeight: 500 }}>From Tunisia</div>
          <div style={{ fontSize: 22, color: "rgba(255, 237, 215, 0.72)", letterSpacing: -0.01, maxWidth: 640 }}>Where the journey begins</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
