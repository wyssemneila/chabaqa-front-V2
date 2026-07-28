import { useCurrentFrame, interpolate, Easing, AbsoluteFill } from "remotion";

export const Scene8Close: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [2520, 2586], [0, 1], { easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const exit = interpolate(frame, [3060, 3120], [0, 1], { easing: Easing.in(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const rootStyle: React.CSSProperties = { backgroundColor: "#100904", color: "#ffedd7", fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif' };

  return (
    <AbsoluteFill style={{ ...rootStyle, width: "100%", height: "100%", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", gap: 26, padding: "0 64px" }}>
      <AbsoluteFill style={{ opacity: 0.32 * enter, transform: `scale(${1 + 0.032 * enter})` }}>
        <div style={{ width: "100%", height: "100%", background: "radial-gradient(circle at 50% 44%, #dc5000 0%, #100904 58%)" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: enter * (1 - exit), transform: `translateY(${24 * (1 - enter)}px)` }}>
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 22, alignItems: "center" }}>
          <div style={{ fontSize: 70, letterSpacing: -0.04, fontWeight: 500 }}>Master German B2.</div>
          <div style={{ fontSize: 68, color: "#dc5000", letterSpacing: -0.04, fontWeight: 500 }}>Pass with Confidence.</div>
          <div style={{ marginTop: 10, fontSize: 24, letterSpacing: -0.01, color: "rgba(255, 237, 215, 0.82)", opacity: interpolate(frame, [2700, 2760], [0, 1], { easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>deutschify.app</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
