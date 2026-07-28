import { useCurrentFrame, interpolate, Easing, AbsoluteFill } from "remotion";

export const Scene4ToGermany: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [948, 1008], [0, 1], { easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const exit = interpolate(frame, [1260, 1320], [0, 1], { easing: Easing.in(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const badgeScale = interpolate(frame, [1068, 1122], [0.94, 1], { easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const rootStyle: React.CSSProperties = { backgroundColor: "#100904", color: "#ffedd7", fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif' };

  return (
    <AbsoluteFill style={{ ...rootStyle, width: "100%", height: "100%", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", gap: 28, padding: "0 60px" }}>
      <AbsoluteFill style={{ opacity: 0.28 * enter, transform: `scale(${1 + 0.018 * enter})` }}>
        <div style={{ width: "100%", height: "100%", background: "radial-gradient(circle at 50% 46%, #5c8af6 0%, #100904 60%)" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: enter * (1 - exit), transform: `translateY(${22 * (1 - enter)}px)` }}>
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 22, alignItems: "center" }}>
          <div style={{ fontSize: 62, letterSpacing: -0.04, fontWeight: 500 }}>To Germany</div>
          <div style={{ borderRadius: 26, backgroundColor: "rgba(220, 80, 0, 0.16)", border: "2px solid #dc5000", padding: "20px 26px", display: "inline-flex", flexDirection: "column", gap: 10, transform: `scale(${badgeScale})` }}>
            <span style={{ fontSize: 56, color: "#dc5000", letterSpacing: -0.04, fontWeight: 500 }}>B2</span>
            <span style={{ fontSize: 20, color: "rgba(255,237,215,0.72)" }}>German Exam</span>
          </div>
          <div style={{ fontSize: 20, maxWidth: 620, color: "rgba(255,237,215,0.78)", opacity: interpolate(frame, [1140, 1188], [0, 1], { easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>Master the language. Pass with confidence.</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
