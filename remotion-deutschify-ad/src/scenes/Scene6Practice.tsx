import { useCurrentFrame, interpolate, Easing, AbsoluteFill } from "remotion";

export const Scene6Practice: React.FC = () => {
    const frame = useCurrentFrame();
  const enterA = interpolate(frame, [1740, 1806], [0, 1], { easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const enterB = interpolate(frame, [1764, 1830], [0, 1], { easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const deviceIn = interpolate(frame, [1800, 1860], [0, 1], { easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const choiceIn = (delay: number) => interpolate(frame, [1848 + delay, 1914 + delay], [0, 1], { easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const exitProgress = interpolate(frame, [2220, 2280], [0, 1], { easing: Easing.in(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const globalOpacity = interpolate(frame, [1740, 1764], [0, 1], { easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * (1 - exitProgress);
  const globalScale = interpolate(deviceIn, [0, 1], [0.92, 1]);

  const rootStyle: React.CSSProperties = {
    backgroundColor: "#100904",
    color: "#ffedd7",
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    width: "100%",
    height: "100%",
    position: "relative",
    overflow: "hidden",
  };

  return (
    <AbsoluteFill style={rootStyle}>
      <AbsoluteFill style={{ opacity: 0.28 * globalOpacity, transform: `scale(${1 + 0.025 * enterA})` }}>
        <div style={{ width: "100%", height: "100%", background: "radial-gradient(circle at 50% 40%, #ff9b7b 0%, #100904 58%)" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: globalOpacity, transform: `scale(${globalScale})` }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", gap: 36, padding: "56px 48px 96px" }}>
          <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 22, alignItems: "center", opacity: Math.max(enterA, enterB) }}>
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ fontSize: 44, letterSpacing: -0.03, lineHeight: 1.08, fontWeight: 500 }}>Practice until</div>
              <div style={{ fontSize: 44, letterSpacing: -0.03, lineHeight: 1.08, fontWeight: 500 }}>it feels familiar.</div>
              <div style={{ fontSize: 20, color: "rgba(255,237,215,0.72)", lineHeight: 1.4, marginTop: 12, maxWidth: 680 }}>Instant feedback. Real exam structure. Step by step.</div>
            </div>
          </div>
          <div style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 860 }}>
            <div style={{ borderRadius: 24, border: "1px solid #40372e", background: "rgba(56, 36, 22, 0.72)", padding: "22px 22px 24px", backdropFilter: "blur(22px) saturate(170%)", WebkitBackdropFilter: "blur(22px) saturate(170%)" }}>
              <div style={{ color: "#6c5f51", fontSize: 18, letterSpacing: -0.01, marginBottom: 18 }}>Lesen · Teil 1</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {['Überschrift A', 'Überschrift B', 'Überschrift C'].map((choice, index) => {
                  const progress = choiceIn(index * 4);
                  const isCorrect = index === 1;
                  const base: React.CSSProperties = {
                    width: "100%",
                    padding: "16px 18px",
                    borderRadius: 18,
                    border: isCorrect ? "2px solid #4ade80" : "1px solid #40372e",
                    background: isCorrect ? "rgba(74, 222, 128, 0.08)" : "rgba(56, 36, 22, 0.55)",
                    color: "#ffedd7",
                    textAlign: "left",
                    opacity: progress,
                    transform: `translateY(${28 * (1 - progress)}px)`,
                  };
                  return <div key={index} style={base}>{choice}</div>;
                })}
              </div>
              <div style={{ position: "absolute", top: -16, right: 8, borderRadius: 999, border: "1px solid #4ade80", background: "rgba(74, 222, 128, 0.12)", padding: "8px 14px", color: "#4ade80", fontSize: 18, letterSpacing: -0.01 }}>✓ Richtig · +1</div>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
