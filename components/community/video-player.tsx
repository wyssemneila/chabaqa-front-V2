'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Play, Pause, Volume2, VolumeX, Maximize, Settings, RotateCcw, RotateCw, SkipBack,
} from 'lucide-react'

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const

interface Props {
  src: string
  poster?: string
  className?: string
}

export default function VideoPlayer({ src, poster, className }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const wrapRef  = useRef<HTMLDivElement>(null)

  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speed, setSpeed] = useState<number>(1)
  const [speedOpen, setSpeedOpen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const hideTimer = useRef<any>(null)

  // sync playing state on user pause/play/end
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onEnded = () => setPlaying(false)
    const onTime = () => setCurrentTime(v.currentTime)
    const onLoaded = () => setDuration(v.duration)
    const onVol = () => { setMuted(v.muted); setVolume(v.volume) }
    v.addEventListener('play', onPlay)
    v.addEventListener('pause', onPause)
    v.addEventListener('ended', onEnded)
    v.addEventListener('timeupdate', onTime)
    v.addEventListener('loadedmetadata', onLoaded)
    v.addEventListener('volumechange', onVol)
    return () => {
      v.removeEventListener('play', onPlay)
      v.removeEventListener('pause', onPause)
      v.removeEventListener('ended', onEnded)
      v.removeEventListener('timeupdate', onTime)
      v.removeEventListener('loadedmetadata', onLoaded)
      v.removeEventListener('volumechange', onVol)
    }
  }, [])

  // auto-hide controls while playing
  const bumpControls = () => {
    setShowControls(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    if (playing) hideTimer.current = setTimeout(() => setShowControls(false), 2500)
  }
  useEffect(() => { bumpControls() }, [playing])

  // keyboard shortcuts when hovered/focused
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const onKey = (e: KeyboardEvent) => {
      const v = videoRef.current
      if (!v) return
      if (e.key === ' ' || e.key === 'k') { e.preventDefault(); v.paused ? v.play() : v.pause() }
      else if (e.key === 'ArrowRight' || e.key === 'l') { e.preventDefault(); v.currentTime = Math.min(v.duration, v.currentTime + 10) }
      else if (e.key === 'ArrowLeft' || e.key === 'j') { e.preventDefault(); v.currentTime = Math.max(0, v.currentTime - 10) }
      else if (e.key === 'm') { e.preventDefault(); v.muted = !v.muted }
      else if (e.key === 'f') { e.preventDefault(); toggleFullscreen() }
      bumpControls()
    }
    el.addEventListener('keydown', onKey)
    return () => el.removeEventListener('keydown', onKey)
  }, [playing])

  const togglePlay = () => {
    const v = videoRef.current; if (!v) return
    v.paused ? v.play() : v.pause()
  }

  const toggleMute = () => {
    const v = videoRef.current; if (!v) return
    v.muted = !v.muted
  }

  const changeVolume = (val: number) => {
    const v = videoRef.current; if (!v) return
    v.volume = val
    v.muted = val === 0
  }

  const seek = (val: number) => {
    const v = videoRef.current; if (!v) return
    v.currentTime = val
  }

  const jump = (delta: number) => {
    const v = videoRef.current; if (!v) return
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + delta))
  }

  const setSpeedValue = (s: number) => {
    const v = videoRef.current; if (!v) return
    v.playbackRate = s
    setSpeed(s)
    setSpeedOpen(false)
  }

  const toggleFullscreen = () => {
    const el = wrapRef.current; if (!el) return
    if (document.fullscreenElement) document.exitFullscreen()
    else el.requestFullscreen?.()
  }

  const fmt = (t: number) => {
    if (!isFinite(t)) return '0:00'
    const h = Math.floor(t / 3600)
    const m = Math.floor((t % 3600) / 60)
    const s = Math.floor(t % 60)
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      : `${m}:${String(s).padStart(2, '0')}`
  }

  return (
    <div ref={wrapRef}
         tabIndex={0}
         onMouseMove={bumpControls}
         onMouseLeave={() => playing && setShowControls(false)}
         className={`relative bg-black rounded-2xl overflow-hidden outline-none group ${className || ''}`}
         style={{ aspectRatio: '16 / 9' }}>

      <video ref={videoRef} src={src} poster={poster}
             className="w-full h-full"
             onClick={togglePlay}
             playsInline />

      {/* Big center play button when paused */}
      {!playing && (
        <button onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center transition-opacity"
                style={{ background: 'rgba(0,0,0,.15)' }}>
          <span className="w-16 h-16 rounded-full flex items-center justify-center backdrop-blur-md transition-transform hover:scale-105"
                style={{ background: 'rgba(255,255,255,.25)' }}>
            <Play className="w-6 h-6 text-white ml-0.5" fill="#fff" />
          </span>
        </button>
      )}

      {/* Controls overlay */}
      <div className={`absolute bottom-0 left-0 right-0 px-3 pt-8 pb-2.5 transition-opacity duration-200 ${showControls ? 'opacity-100' : 'opacity-0'}`}
           style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,.75) 100%)' }}>

        {/* Seek bar */}
        <div className="flex items-center gap-2 mb-1.5">
          <input type="range"
                 min={0}
                 max={duration || 0}
                 step={0.1}
                 value={currentTime}
                 onChange={(e) => seek(Number(e.target.value))}
                 className="chabaqa-video-range flex-1 h-1 cursor-pointer accent-[#8e78fb]"
                 style={{
                   background: `linear-gradient(to right, #8e78fb 0%, #8e78fb ${duration ? (currentTime / duration) * 100 : 0}%, rgba(255,255,255,.3) ${duration ? (currentTime / duration) * 100 : 0}%, rgba(255,255,255,.3) 100%)`,
                   borderRadius: 999,
                 }} />
        </div>

        {/* Buttons row */}
        <div className="flex items-center gap-2">
          <IconButton onClick={togglePlay} title={playing ? 'Pause (K)' : 'Play (K)'}>
            {playing ? <Pause className="w-4 h-4" fill="#fff" /> : <Play className="w-4 h-4" fill="#fff" />}
          </IconButton>

          <IconButton onClick={() => jump(-10)} title="Back 10s (J)">
            <RotateCcw className="w-4 h-4" />
          </IconButton>

          <IconButton onClick={() => jump(10)} title="Forward 10s (L)">
            <RotateCw className="w-4 h-4" />
          </IconButton>

          <div className="flex items-center gap-1 group/vol">
            <IconButton onClick={toggleMute} title="Mute (M)">
              {muted || volume === 0
                ? <VolumeX className="w-4 h-4" />
                : <Volume2 className="w-4 h-4" />}
            </IconButton>
            <input type="range" min={0} max={1} step={0.05}
                   value={muted ? 0 : volume}
                   onChange={(e) => changeVolume(Number(e.target.value))}
                   className="w-0 group-hover/vol:w-20 h-1 cursor-pointer accent-[#8e78fb] transition-all overflow-hidden"
                   style={{ borderRadius: 999 }} />
          </div>

          <span className="text-[11px] font-mono text-white/85 ml-1">
            {fmt(currentTime)} / {fmt(duration)}
          </span>

          <div className="flex-1" />

          {/* Speed */}
          <div className="relative">
            <button onClick={() => setSpeedOpen(!speedOpen)}
                    title="Playback speed"
                    className="px-2 h-8 rounded-lg text-[12px] font-semibold text-white hover:bg-white/15 transition-colors flex items-center gap-1">
              {speed}×
            </button>
            {speedOpen && (
              <div className="absolute right-0 bottom-full mb-2 rounded-lg shadow-xl overflow-hidden"
                   style={{ background: 'rgba(20,18,40,.95)', backdropFilter: 'blur(8px)' }}>
                {SPEEDS.map((s) => (
                  <button key={s} onClick={() => setSpeedValue(s)}
                          className="block w-full text-left px-4 py-1.5 text-[12px] text-white/85 hover:bg-white/10 transition-colors"
                          style={{ background: s === speed ? 'rgba(142,120,251,.35)' : 'transparent' }}>
                    {s}×
                  </button>
                ))}
              </div>
            )}
          </div>

          <IconButton onClick={toggleFullscreen} title="Fullscreen (F)">
            <Maximize className="w-4 h-4" />
          </IconButton>
        </div>
      </div>
    </div>
  )
}

function IconButton({ children, onClick, title }:
  { children: React.ReactNode; onClick: () => void; title?: string }) {
  return (
    <button onClick={onClick} title={title}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white hover:bg-white/15 transition-colors">
      {children}
    </button>
  )
}
