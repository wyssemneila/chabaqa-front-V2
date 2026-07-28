import { useCurrentFrame, interpolate, Easing, AbsoluteFill } from "remotion";

export const Scene3FlightPath: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [552, 612], [0, 1], { easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const exit = interpolate(frame, [864, 1008], [0, 1], { easing: Easing.in(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tick = interpolate(frame, [612, 864], [0, 1], { easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const opacity = enter * (1 - exit);
  const rootStyle: React.CSSProperties = { backgroundColor: "#100904", color: "#ffedd7", fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif' };

  return (
    <AbsoluteFill style={{ ...rootStyle, width: "100%", height: "100%", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", gap: 32, padding: "0 56px" }}>
      <AbsoluteFill style={{ opacity: 0.32 * enter, transform: `scale(${1 + 0.028 * enter})` }}>
        <div style={{ width: "100%", height: "100%", background: "radial-gradient(circle at 50% 44%, #ffcaa0 0%, #100904 60%)" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity, transform: `translateY(${tick * 140}px)` }}>
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 18, alignItems: "center" }}>
          <div style={{ fontSize: 46, lineHeight: 1.08, letterSpacing: -0.02, fontWeight: 500, maxWidth: 780, opacity: interpolate(frame, [708, 780], [0, 1], { easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>One destination.</div>
          <div style={{ fontSize: 50, color: "#dc5000", letterSpacing: -0.04, fontWeight: 500, maxWidth: 780, opacity: interpolate(frame, [720, 804], [0, 1], { easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>One exam.</div>
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 18, alignItems: "center" }}>
            <div style={{ fontSize: 28, letterSpacing: -0.03, fontWeight: 500, color: "#ffedd7", opacity: interpolate(frame, [804, 876], [0, 1], { easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>Pass with confidence.</div>
            <div style={{ fontSize: 44, letterSpacing: -0.04, fontWeight: 500, color: "#dc5000", opacity: interpolate(frame, [852, 924], [0, 1], { easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>Master German B2.</div>
            <div style={{ fontSize: 22, letterSpacing: "-0.01em", color: "rgba(255,237,215,0.72)", opacity: interpolate(frame, [880, 952], [0, 1], { easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>deutschify.app</div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
