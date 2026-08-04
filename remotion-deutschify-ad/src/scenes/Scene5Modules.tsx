import { useCurrentFrame, interpolate, Easing, AbsoluteFill } from "remotion";

const modules = [
  { eyebrow: "Aa", title: "Lesen", sub: "Reading" },
  { eyebrow: "[]", title: "Sprachbausteine", sub: "Grammar" },
  { eyebrow: "♪", title: "Hören", sub: "Listening" },
  { eyebrow: "✎", title: "Schreiben", sub: "Writing" },
  { eyebrow: "◉", title: "Mündlich", sub: "Speaking" },
];

export const Scene5Modules: React.FC = () => {
  const frame = useCurrentFrame();
  const enterProgress = interpolate(frame, [1260, 1320], [0, 1], { easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const exitProgress = interpolate(frame, [1740, 1800], [0, 1], { easing: Easing.in(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const rootStyle: React.CSSProperties = {
    backgroundColor: "#100904",
    color: "#ffedd7",
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  };
  return (
    <AbsoluteFill style={{ ...rootStyle, width: "100%", height: "100%", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", gap: 28, padding: "0 48px" }}>
      <AbsoluteFill style={{ opacity: 0.3 * enterProgress, transform: `scale(${1 + 0.02 * enterProgress})` }}>
        <div style={{ width: "100%", height: "100%", background: "radial-gradient(circle at 50% 42%, #ffbf8a 0%, #100904 58%)" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: enterProgress * (1 - exitProgress), transform: `translateY(${24 * (1 - enterProgress)}px)` }}>
        <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 880, display: "flex", flexDirection: "column", gap: 22, alignItems: "center" }}>
          <div style={{ fontSize: 22, letterSpacing: -0.01, color: "rgba(255,237,215,0.72)" }}>Your study platform</div>
          <div style={{ fontSize: 48, lineHeight: 1.08, letterSpacing: -0.03, fontWeight: 500, maxWidth: 860 }}>Every skill. One place.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%" }}>
            {modules.map((item, index) => {
              const progress = interpolate(frame, [1320 + index * 5, 1368 + index * 5], [0, 1], { easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              return (
                <div key={item.title} style={{ width: "100%", display: "flex", alignItems: "center", gap: 18, padding: "16px 20px", borderRadius: 22, border: "1px solid #40372e", background: "rgba(56,36,22,0.62)", backdropFilter: "blur(22px) saturate(170%)", WebkitBackdropFilter: "blur(22px) saturate(170%)", opacity: progress, transform: `translateY(${28 * (1 - progress)}px)` }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, border: "1px solid #40372e", background: "rgba(220,80,0,0.1)", color: "#dc5000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 600 }}>{item.eyebrow}</div>
                  <div style={{ flex: 1, textAlign: "left", display: "flex", flexDirection: "column", gap: 2 }}>
                    <div style={{ fontSize: 24, letterSpacing: -0.02, fontWeight: 600 }}>{item.title}</div>
                    <div style={{ fontSize: 18, color: "rgba(255,237,215,0.72)", letterSpacing: "-0.01em" }}>{item.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
