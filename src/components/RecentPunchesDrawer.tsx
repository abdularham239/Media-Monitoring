import React, { useState } from 'react';
import { AdPunch, ClipItem } from '../types';
import { Play, RotateCcw, Shield, Trash2, Download, Film, Clock, Tag, ExternalLink, Check, AlertCircle } from 'lucide-react';

interface RecentPunchesDrawerProps {
  punches: AdPunch[];
  clips: ClipItem[];
  onPlayClip: (clip: ClipItem) => void;
  onProtectToggle: (clipId: string) => void;
  onDeleteClip: (clipId: string) => void;
}

export const RecentPunchesDrawer: React.FC<RecentPunchesDrawerProps> = ({
  punches,
  clips,
  onPlayClip,
  onProtectToggle,
  onDeleteClip
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'ad' | 'program' | 'news'>('all');

  const filteredClips = clips.filter(c => {
    if (selectedFilter === 'all') return true;
    return c.type === selectedFilter;
  });

  return (
    <div className="bg-[#16161a] border border-[#222225] rounded-2xl p-4 flex flex-col gap-3 shadow-2xl">
      <div className="flex items-center justify-between border-b border-[#222225] pb-3">
        <div className="flex items-center gap-2">
          <Film className="w-5 h-5 text-orange-500" />
          <h3 className="font-bold text-zinc-100 text-sm tracking-wide">RECENT PUNCHES & INSTANT REPLAY</h3>
          <span className="bg-orange-600/10 text-orange-400 border border-orange-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold">
            {clips.length} CLIPS
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-[#111113] p-1 rounded-xl border border-[#222225] text-[11px]">
          {(['all', 'ad', 'program', 'news'] as const).map(filter => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-2.5 py-1 rounded-lg capitalize font-bold transition-all cursor-pointer ${
                selectedFilter === filter ? 'bg-orange-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Clips Scroll Grid / List */}
      <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
        {filteredClips.length === 0 ? (
          <div className="py-8 text-center text-zinc-500 text-xs flex flex-col items-center gap-1">
            <Clock className="w-6 h-6 text-zinc-600 mb-1" />
            No punched clips yet. Press "AD START" to create an automatic clip.
          </div>
        ) : (
          filteredClips.map((clip, idx) => (
            <div
              key={clip.id}
              className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                idx === 0
                  ? 'bg-[#111113] border-orange-500/50 shadow-md shadow-orange-950/20'
                  : 'bg-[#111113]/80 border-[#222225] hover:border-zinc-700'
              }`}
            >
              {/* Thumbnail & Play Overlay */}
              <div
                onClick={() => onPlayClip(clip)}
                className="relative w-16 h-11 bg-zinc-900/90 rounded-lg shrink-0 group cursor-pointer border border-[#222225] hover:border-orange-500/50 flex items-center justify-center bg-gradient-to-br from-orange-950/20 to-zinc-950"
              >
                <Play className="w-4 h-4 text-orange-400 fill-orange-400 group-hover:scale-110 transition-transform" />
                <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-white font-mono text-[9px] px-1 rounded">
                  {clip.durationSec}s
                </span>
              </div>

              {/* Clip Details */}
              <div className="flex-1 min-w-0 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-zinc-100 truncate">{clip.title}</span>
                  {idx === 0 && (
                    <span className="bg-orange-600 text-white font-black px-1.5 py-0.2 text-[9px] rounded-md uppercase shrink-0">
                      NEWEST
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                  <span className="text-orange-400 font-semibold">{clip.channelName}</span>
                  <span>•</span>
                  <span>Op: {clip.createdBy}</span>
                  <span>•</span>
                  <span className="font-mono text-[10px]">{new Date(clip.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Clip Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => onPlayClip(clip)}
                  className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" /> REPLAY
                </button>

                <button
                  onClick={() => onProtectToggle(clip.id)}
                  className={`p-1.5 rounded-lg border cursor-pointer ${
                    clip.protected
                      ? 'bg-orange-500/10 border-orange-500 text-orange-400'
                      : 'bg-[#16161a] border-[#222225] text-zinc-400 hover:text-white'
                  }`}
                  title={clip.protected ? 'Protected Clip' : 'Protect Clip'}
                >
                  <Shield className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onDeleteClip(clip.id)}
                  className="p-1.5 rounded-lg bg-[#16161a] border border-[#222225] text-zinc-400 hover:text-red-400 hover:border-red-500/50 cursor-pointer"
                  title="Delete Clip"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
