import React, { useState, useRef } from 'react';
import { ClipItem } from '../types';
import { X, Play, Pause, RotateCcw, Download, Shield, Trash2, FastForward, Rewind, Maximize, Film } from 'lucide-react';

interface ClipPlayerModalProps {
  clip: ClipItem | null;
  onClose: () => void;
  onProtectToggle: (clipId: string) => void;
  onDeleteClip: (clipId: string) => void;
}

export const ClipPlayerModal: React.FC<ClipPlayerModalProps> = ({
  clip,
  onClose,
  onProtectToggle,
  onDeleteClip
}) => {
  if (!clip) return null;

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const setSpeed = (speed: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlaybackRate(speed);
  };

  const stepFrame = (frames: number) => {
    if (!videoRef.current) return;
    videoRef.current.pause();
    setIsPlaying(false);
    videoRef.current.currentTime += frames * (1 / 25); // assuming 25fps
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#16161a] border border-[#222225] rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-[#111113] px-5 py-3.5 border-b border-[#222225] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-orange-500" />
            <h2 className="font-extrabold text-zinc-100 text-base">{clip.title}</h2>
            <span className="bg-[#16161a] border border-[#222225] text-zinc-300 text-xs px-2.5 py-0.5 rounded-lg font-mono">
              {clip.channelName}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player */}
        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            src={clip.fileUrl}
            autoPlay
            controls={false}
            onTimeUpdate={() => videoRef.current && setCurrentTime(videoRef.current.currentTime)}
            className="w-full h-full object-contain"
          />

          {/* Burn-in Overlay */}
          <div className="absolute top-3 left-3 bg-black/80 px-3 py-1 rounded-lg text-xs font-mono text-orange-400 border border-[#222225]">
            RECORDED PUNCH CLIP | {clip.durationSec} SEC
          </div>
        </div>

        {/* Video Controls Bar */}
        <div className="bg-[#111113] p-4 border-t border-[#222225] flex flex-col gap-3">
          {/* Timeline Seek Bar */}
          <input
            type="range"
            min={0}
            max={clip.durationSec}
            step={0.1}
            value={currentTime}
            onChange={e => {
              if (videoRef.current) {
                videoRef.current.currentTime = Number(e.target.value);
                setCurrentTime(Number(e.target.value));
              }
            }}
            className="w-full accent-orange-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
          />

          <div className="flex items-center justify-between text-xs text-zinc-300">
            <div className="flex items-center gap-2 font-mono">
              <span>{currentTime.toFixed(1)}s</span>
              <span>/</span>
              <span>{clip.durationSec}s</span>
            </div>

            {/* Play, Pause, Frame-by-Frame Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => stepFrame(-1)}
                className="px-2 py-1 bg-[#16161a] hover:bg-white/5 text-zinc-200 border border-[#222225] rounded-lg font-mono text-[11px] cursor-pointer"
                title="Step Back 1 Frame"
              >
                -1F
              </button>

              <button
                onClick={togglePlay}
                className="bg-orange-600 hover:bg-orange-500 text-white font-bold p-2.5 rounded-full shadow-md shadow-orange-950/40 cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              </button>

              <button
                onClick={() => stepFrame(1)}
                className="px-2 py-1 bg-[#16161a] hover:bg-white/5 text-zinc-200 border border-[#222225] rounded-lg font-mono text-[11px] cursor-pointer"
                title="Step Forward 1 Frame"
              >
                +1F
              </button>
            </div>

            {/* Speed Selector */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mr-1">Speed:</span>
              {[0.5, 0.75, 1, 1.5, 2].map(speed => (
                <button
                  key={speed}
                  onClick={() => setSpeed(speed)}
                  className={`px-2 py-0.5 text-[10px] rounded-lg font-mono cursor-pointer transition-all ${
                    playbackRate === speed ? 'bg-orange-600 text-white font-bold' : 'bg-[#16161a] text-zinc-400 border border-[#222225]'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          {/* Footer Metadata & Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-[#222225] text-xs text-zinc-400">
            <div>
              <span>Created By: <strong className="text-zinc-200">{clip.createdBy}</strong></span>
              <span className="mx-2">•</span>
              <span>Size: <strong className="text-zinc-200">{clip.fileSizeMb} MB</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onProtectToggle(clip.id)}
                className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-bold border text-xs cursor-pointer ${
                  clip.protected
                    ? 'bg-orange-500/10 border-orange-500 text-orange-400'
                    : 'bg-[#16161a] border-[#222225] text-zinc-300 hover:text-white'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                {clip.protected ? 'Protected' : 'Protect'}
              </button>

              <a
                href={clip.fileUrl}
                download={`${clip.title}.mp4`}
                target="_blank"
                rel="noreferrer"
                className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs shadow-md cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download Clip
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
