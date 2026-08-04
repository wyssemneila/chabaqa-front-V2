import { useCurrentFrame, interpolate, Easing, AbsoluteFill } from "remotion";

export const Scene7ExamReady: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [2220, 2286], [0, 1], { easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const exit = interpolate(frame, [2670, 2730], [0, 1], { easing: Easing.in(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const countExam = interpolate(frame, [2298, 2350], [0, 87], { easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const countDays = interpolate(frame, [2340, 2392], [0, 21], { easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const rootStyle: React.CSSProperties = { backgroundColor: "#100904", color: "#ffedd7", fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif' };

  return (
    <AbsoluteFill style={{ ...rootStyle, width: "100%", height: "100%", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", gap: 28, padding: "0 56px" }}>
      <AbsoluteFill style={{ opacity: 0.3 * enter, transform: `scale(${1 + 0.022 * enter})` }}>
        <div style={{ width: "100%", height: "100%", background: "radial-gradient(circle at 50% 42%, #ff9b7b 0%, #100904 58%)" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: enter * (1 - exit), transform: `translateY(${20 * (1 - enter)}px)` }}>
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 26, alignItems: "center" }}>
          <div style={{ fontSize: 58, letterSpacing: -0.04, fontWeight: 500 }}>Exam readiness</div>
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap", justifyContent: "center" }}>
            <div style={{ minWidth: 160, borderRadius: 22, border: "1px solid #40372e", background: "rgba(56,36,22,0.72)", padding: "18px 22px", backdropFilter: "blur(22px) saturate(170%)", WebkitBackdropFilter: "blur(22px) saturate(170%)" }}>
              <div style={{ color: "#4ade80", fontSize: 36, fontWeight: 600, letterSpacing: "-0.03em" }}>{Math.round(countExam)}%</div>
              <div style={{ color: "rgba(255,237,215,0.72)", fontSize: 16, letterSpacing: "-0.01em" }}>Exam readiness</div>
            </div>
            <div style={{ minWidth: 140, borderRadius: 22, border: "1px solid #40372e", background: "rgba(56,36,22,0.72)", padding: "18px 22px", backdropFilter: "blur(22px) saturate(170%)", WebkitBackdropFilter: "blur(22px) saturate(170%)" }}>
              <div style={{ color: "#dc5000", fontSize: 36, fontWeight: 600, letterSpacing: "-0.03em" }}>{Math.round(countDays)}</div>
              <div style={{ color: "rgba(255,237,215,0.72)", fontSize: 16, letterSpacing: "-0.01em" }}>Day streak</div>
            </div>
          </div>
          <div style={{ fontSize: 26, letterSpacing: -0.02, fontWeight: 500, opacity: interpolate(frame, [2400, 2458], [0, 1], { easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>Pass with confidence.</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
