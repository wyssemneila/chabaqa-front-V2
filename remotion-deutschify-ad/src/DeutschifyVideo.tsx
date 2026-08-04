import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { Scene1BrandOpen } from './scenes/Scene1BrandOpen';
import { Scene2FromTunisia } from './scenes/Scene2FromTunisia';
import { Scene3FlightPath } from './scenes/Scene3FlightPath';
import { Scene4ToGermany } from './scenes/Scene4ToGermany';
import { Scene5Modules } from './scenes/Scene5Modules';
import { Scene6Practice } from './scenes/Scene6Practice';
import { Scene7ExamReady } from './scenes/Scene7ExamReady';
import { Scene8Close } from './scenes/Scene8Close';

const blurIn = (frame: number, start: number, end: number, blurAmount = 10) => {
  const progress = interpolate(frame, [start, end], [0, 1], { easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const blur = interpolate(progress, [0, 1], [blurAmount, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return { opacity: progress, blur, scale: interpolate(progress, [0, 1], [1.03, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) };
};

export const DeutschifyVideo: React.FC = () => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const scene = (start: number, end: number, blurInStart?: number, enterFrames = 1 * fps, blurAmount = 10) => {
    const begin = Math.max(start, blurInStart ?? start);
    return blurIn(frame, begin, begin + enterFrames, blurAmount);
  };

  const scene1 = scene(0, 270, 0, 1.2 * fps, 10);
  const scene2 = scene(228, 600, 228, 1.3 * fps, 9);
  const scene3 = scene(552, 1008, 552, 1.1 * fps, 7);
  const scene4 = scene(948, 1320, 948, 1.2 * fps, 8);
  const scene5 = scene(1260, 1800, 1260, 1.1 * fps, 7);
  const scene6 = scene(1740, 2280, 1740, 1.2 * fps, 6);
  const scene7 = scene(2220, 2730, 2220, 1.2 * fps, 7);
  const scene8 = scene(2520, 3120, 2520, 1.3 * fps, 9);

  const activeScene = (() => {
    if (frame >= 2520) return scene8;
    if (frame >= 2016) return scene7;
    if (frame >= 1656) return scene6;
    if (frame >= 1260) return scene5;
    if (frame >= 948) return scene4;
    if (frame >= 552) return scene3;
    if (frame >= 228) return scene2;
    return scene1;
  })();

  const globalFilter =
    frame < 24 ? interpolate(frame, [0, 24], [0.85, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 1;

  return (
    <AbsoluteFill style={{ backgroundColor: '#100904' }}>
      <AbsoluteFill style={{ filter: `blur(${(activeScene.blur / 100) * 5}px)`, opacity: activeScene.opacity, transform: `scale(${1 + 0.015 * Math.sin((frame / (fps * 5)) * Math.PI * 2)})` }}>
        <div
          style={{
            width: '100%',
            height: '100%',
            transform: `scale(${activeScene.scale})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {frame < 228 && <Scene1BrandOpen />}
          {frame >= 228 && frame < 552 && <Scene2FromTunisia />}
          {frame >= 552 && frame < 948 && <Scene3FlightPath />}
          {frame >= 948 && frame < 1260 && <Scene4ToGermany />}
          {frame >= 1260 && frame < 1656 && <Scene5Modules />}
          {frame >= 1656 && frame < 2016 && <Scene6Practice />}
          {frame >= 2016 && frame < 2520 && <Scene7ExamReady />}
          {frame >= 2520 && <Scene8Close />}
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ pointerEvents: 'none', opacity: globalFilter, background: 'linear-gradient(180deg, rgba(16,9,4,0) 0%, rgba(16,9,4,0.18) 100%)' }}>
        <div
          style={{
            inset: 0,
            backdropFilter: 'saturate(170%)',
            WebkitBackdropFilter: 'blur(1px) saturate(170%)',
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
