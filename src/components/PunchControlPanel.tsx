import React, { useState, useEffect } from 'react';
import { Channel, AdMaster, ProgramMaster, NewsMaster, AdPunch, ClipItem, ShortcutConfig } from '../types';
import { Radio, Play, Square, Pause, RotateCcw, Search, Sparkles, Tag, Film, Tv, Newspaper, CheckCircle2, FastForward, Plus, FileText, Megaphone } from 'lucide-react';
import { PunchCaptionModal } from './PunchCaptionModal';

interface PunchControlPanelProps {
  channels: Channel[];
  selectedChannelId: string;
  onSelectChannel: (id: string) => void;
  adMasters: AdMaster[];
  programMasters: ProgramMaster[];
  newsMasters: NewsMaster[];
  shortcuts: ShortcutConfig;
  preRollSec: number;
  postRollSec: number;
  onPunchAdSubmit: (punchData: Partial<AdPunch>) => void;
  onPunchProgramSubmit: (data: any) => void;
  onPunchNewsSubmit: (data: any) => void;
  onReplayLatestClip: () => void;
  recentClips: ClipItem[];
  onAddNewsMaster?: (data: Partial<NewsMaster>) => Promise<any>;
  onAddAdMaster?: (data: Partial<AdMaster>) => Promise<any>;
}

export const PunchControlPanel: React.FC<PunchControlPanelProps> = ({
  channels,
  selectedChannelId,
  onSelectChannel,
  adMasters,
  programMasters,
  newsMasters,
  shortcuts,
  preRollSec,
  postRollSec,
  onPunchAdSubmit,
  onPunchProgramSubmit,
  onPunchNewsSubmit,
  onReplayLatestClip,
  recentClips,
  onAddNewsMaster,
  onAddAdMaster
}) => {
  const [activeTab, setActiveTab] = useState<'ad' | 'program' | 'news'>('ad');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected master items
  const [selectedAdId, setSelectedAdId] = useState<string>(adMasters[0]?.id || '');
  const [selectedProgramId, setSelectedProgramId] = useState<string>(programMasters[0]?.id || '');
  const [selectedNewsId, setSelectedNewsId] = useState<string>(newsMasters[0]?.id || '');

  // Punch active states
  const [isAdPunchActive, setIsAdPunchActive] = useState(false);
  const [adStartTime, setAdStartTime] = useState<Date | null>(null);
  const [adElapsedSec, setAdElapsedSec] = useState(0);

  // Caption Modal State
  const [isCaptionModalOpen, setIsCaptionModalOpen] = useState(false);
  const [customCaption, setCustomCaption] = useState('');

  const selectedChannel = channels.find(c => c.id === selectedChannelId) || channels[0];
  const selectedAd = adMasters.find(a => a.id === selectedAdId);
  const selectedNews = newsMasters.find(n => n.id === selectedNewsId);

  // Ad active punch timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAdPunchActive && adStartTime) {
      interval = setInterval(() => {
        setAdElapsedSec(Math.floor((Date.now() - adStartTime.getTime()) / 1000));
      }, 200);
    } else {
      setAdElapsedSec(0);
    }
    return () => clearInterval(interval);
  }, [isAdPunchActive, adStartTime]);

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcut if typing in input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === shortcuts.adStartKey) {
        e.preventDefault();
        handleAdStart();
      } else if (e.key === shortcuts.adEndKey) {
        e.preventDefault();
        handleAdEnd();
      } else if (e.key === 'r' || e.key === 'R' || e.key === shortcuts.replayKey) {
        e.preventDefault();
        onReplayLatestClip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, isAdPunchActive, selectedChannelId, selectedAdId]);

  const handleAdStart = () => {
    if (!selectedChannel) return;
    setIsAdPunchActive(true);
    setAdStartTime(new Date());
    setIsCaptionModalOpen(true); // Auto-open caption & news/ad creation panel!
  };

  const confirmAdPunchEnd = () => {
    if (!isAdPunchActive || !adStartTime || !selectedChannel) {
      setIsAdPunchActive(false);
      setIsCaptionModalOpen(false);
      return;
    }

    const endTime = new Date();
    const durationSec = Math.max(1, Math.round((endTime.getTime() - adStartTime.getTime()) / 1000));
    const activeAd = adMasters.find(a => a.id === selectedAdId) || adMasters[0];
    const activeNews = newsMasters.find(n => n.id === selectedNewsId);

    onPunchAdSubmit({
      channelId: selectedChannel.id,
      channelName: selectedChannel.name,
      adMasterId: activeAd?.id || 'ad-1',
      adName: activeAd?.adName || activeNews?.title || (customCaption ? customCaption.slice(0, 30) : 'Punched Clip'),
      brand: activeAd?.brand || activeNews?.category || 'Punch Item',
      campaignName: activeAd?.campaignName || 'General Campaign',
      category: activeAd?.category || activeNews?.category || 'Commercial',
      programId: selectedChannel.currentProgramId || 'prg-1',
      programName: selectedChannel.currentProgramName || 'Live Broadcast',
      startTime: adStartTime.toISOString(),
      endTime: endTime.toISOString(),
      durationSec,
      preRollSec,
      postRollSec,
      notes: customCaption || (activeNews ? `News Bulletin: ${activeNews.title}` : '')
    });

    setIsAdPunchActive(false);
    setAdStartTime(null);
    setIsCaptionModalOpen(false);
  };

  const handleAdEnd = () => {
    if (!isCaptionModalOpen && isAdPunchActive) {
      setIsCaptionModalOpen(true);
    } else {
      confirmAdPunchEnd();
    }
  };

  const sq = (searchQuery || '').toLowerCase();
  const filteredAds = adMasters.filter(
    a => a.active && ((a.brand || '').toLowerCase().includes(sq) || (a.adName || '').toLowerCase().includes(sq) || (a.category || '').toLowerCase().includes(sq))
  );

  const filteredPrograms = programMasters.filter(
    p => p.active && ((p.name || '').toLowerCase().includes(sq) || (p.category || '').toLowerCase().includes(sq))
  );

  const filteredNews = newsMasters.filter(
    n => n.active && ((n.title || '').toLowerCase().includes(sq) || (n.presenter || '').toLowerCase().includes(sq))
  );

  return (
    <div className="bg-[#16161a] border border-[#222225] rounded-2xl p-4 flex flex-col gap-4 shadow-2xl">
      {/* Top Shortcuts Legend Bar */}
      <div className="bg-[#111113] p-3 rounded-xl border border-[#222225] flex items-center justify-between text-xs text-zinc-300 overflow-x-auto">
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="text-orange-500 font-bold uppercase tracking-widest text-[10px] flex items-center gap-1">
            <Radio className="w-3.5 h-3.5 text-orange-500" /> HOTKEYS:
          </span>
          <span className="bg-[#16161a] text-zinc-200 px-2 py-0.5 rounded-lg border border-[#222225]">
            {shortcuts.adStartKey}: AD START
          </span>
          <span className="bg-[#16161a] text-zinc-200 px-2 py-0.5 rounded-lg border border-[#222225]">
            {shortcuts.adEndKey}: AD END
          </span>
          <span className="bg-[#16161a] text-zinc-200 px-2 py-0.5 rounded-lg border border-[#222225]">
            R: REPLAY CLIP
          </span>
        </div>

        <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-3 shrink-0">
          <span>
            BUFFER: <strong className="text-orange-400">{preRollSec}s PRE</strong> / <strong className="text-orange-400">{postRollSec}s POST</strong>
          </span>
        </div>
      </div>

      {/* Target Channel Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
        <div>
          <label className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase block mb-1">TARGET MONITORING CHANNEL</label>
          <select
            value={selectedChannelId}
            onChange={e => onSelectChannel(e.target.value)}
            className="w-full bg-[#111113] text-zinc-100 border border-[#222225] rounded-xl p-2.5 text-xs font-semibold focus:border-orange-500 focus:outline-none"
          >
            {channels.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code}) - {(c.status || 'offline').toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Master Type Toggle */}
        <div className="md:col-span-2 flex items-center gap-2 bg-[#111113] p-1 rounded-xl border border-[#222225] self-end">
          <button
            onClick={() => setActiveTab('ad')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'ad' ? 'bg-orange-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            ADS MASTER ({adMasters.length})
          </button>

          <button
            onClick={() => setActiveTab('program')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'program' ? 'bg-blue-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            PROGRAMS ({programMasters.length})
          </button>

          <button
            onClick={() => setActiveTab('news')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'news' ? 'bg-purple-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" />
            NEWS ({newsMasters.length})
          </button>
        </div>
      </div>

      {/* Search Input for Master Data Selection */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-2.5" />
        <input
          type="text"
          placeholder={`Search ${activeTab.toUpperCase()} library master records...`}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-[#111113] text-zinc-100 pl-10 pr-4 py-2 border border-[#222225] rounded-xl text-xs focus:border-orange-500 focus:outline-none"
        />
      </div>

      {/* Master Items Cards List Selection */}
      <div className="max-h-48 overflow-y-auto pr-1 flex flex-col gap-2">
        {activeTab === 'ad' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {filteredAds.map(ad => (
              <div
                key={ad.id}
                onClick={() => setSelectedAdId(ad.id)}
                className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-all ${
                  selectedAdId === ad.id
                    ? 'bg-orange-500/10 border-orange-500 text-white shadow-md'
                    : 'bg-[#111113] border-[#222225] text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-orange-950/40 border border-orange-500/30 flex items-center justify-center shrink-0">
                  <Megaphone className="w-5 h-5 text-orange-400" />
                </div>
                <div className="overflow-hidden text-xs">
                  <div className="font-bold text-orange-400 truncate">{ad.brand}</div>
                  <div className="text-zinc-200 truncate">{ad.adName}</div>
                  <div className="text-[10px] text-zinc-500 flex items-center gap-2">
                    <span>{ad.targetDurationSec}s</span>
                    <span>•</span>
                    <span className="truncate">{ad.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'program' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {filteredPrograms.map(prg => (
              <div
                key={prg.id}
                onClick={() => setSelectedProgramId(prg.id)}
                className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-all ${
                  selectedProgramId === prg.id
                    ? 'bg-blue-500/10 border-blue-500 text-white shadow-md'
                    : 'bg-[#111113] border-[#222225] text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-blue-950/40 border border-blue-500/30 flex items-center justify-center shrink-0">
                  <Tv className="w-5 h-5 text-blue-400" />
                </div>
                <div className="overflow-hidden text-xs">
                  <div className="font-bold text-blue-400 truncate">{prg.name}</div>
                  <div className="text-zinc-300 text-[11px] truncate">{prg.host}</div>
                  <div className="text-[10px] text-zinc-500">{prg.category}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'news' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {filteredNews.map(news => (
              <div
                key={news.id}
                onClick={() => setSelectedNewsId(news.id)}
                className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-all ${
                  selectedNewsId === news.id
                    ? 'bg-purple-500/10 border-purple-500 text-white shadow-md'
                    : 'bg-[#111113] border-[#222225] text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <div className="w-12 h-9 bg-purple-950/60 border border-purple-800/80 rounded-lg flex items-center justify-center font-bold text-purple-300 text-[10px]">
                  NEWS
                </div>
                <div className="overflow-hidden text-xs">
                  <div className="font-bold text-purple-400 truncate">{news.title}</div>
                  <div className="text-zinc-300 text-[11px] truncate">{news.presenter}</div>
                  <div className="text-[10px] text-zinc-500">{news.category}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Punch Action Execution Bar */}
      <div className="bg-[#111113] p-3.5 rounded-xl border border-[#222225] flex flex-wrap items-center justify-between gap-4">
        {/* Current Active Punch Summary */}
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              isAdPunchActive ? 'bg-red-500 animate-ping' : 'bg-emerald-500'
            }`}
          />
          <div>
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Punch Status</div>
            <div className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              {isAdPunchActive ? (
                <span className="text-red-400 font-mono animate-pulse">
                  ● PUNCHING AD ({adElapsedSec}s)
                </span>
              ) : (
                <span className="text-zinc-300">Ready to Punch</span>
              )}
            </div>
          </div>
        </div>

        {/* Punch Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {!isAdPunchActive ? (
            <button
              onClick={handleAdStart}
              className="bg-orange-600 hover:bg-orange-500 text-white font-black px-6 py-2.5 rounded-xl shadow-lg shadow-orange-950/50 flex items-center gap-2 text-sm transition-transform active:scale-95 cursor-pointer"
            >
              <Radio className="w-4 h-4 animate-pulse text-white" />
              AD START ({shortcuts.adStartKey})
            </button>
          ) : (
            <button
              onClick={handleAdEnd}
              className="bg-red-600 hover:bg-red-500 text-white font-black px-6 py-2.5 rounded-xl shadow-lg shadow-red-950/50 flex items-center gap-2 text-sm transition-transform active:scale-95 animate-pulse cursor-pointer"
            >
              <Square className="w-4 h-4" />
              AD END ({shortcuts.adEndKey})
            </button>
          )}

          <button
            onClick={() => setIsCaptionModalOpen(true)}
            className="bg-purple-950/40 hover:bg-purple-900/50 text-purple-200 border border-purple-500/40 font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 text-xs transition-colors cursor-pointer"
            title="Open Caption Search & News / Ad Creator Panel"
          >
            <Search className="w-4 h-4 text-purple-400" />
            <Plus className="w-3.5 h-3.5 text-purple-400" />
            CAPTION SEARCH / NEWS CREATOR
          </button>

          <button
            onClick={onReplayLatestClip}
            className="bg-[#16161a] hover:bg-white/5 text-zinc-200 border border-[#222225] font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs transition-colors cursor-pointer"
            title="Instant Replay Latest Clip"
          >
            <RotateCcw className="w-4 h-4 text-orange-400" />
            INSTANT REPLAY (R)
          </button>
        </div>
      </div>

      {/* Dedicated Punch Caption Search & Quick News / Ad Creator Modal */}
      <PunchCaptionModal
        isOpen={isCaptionModalOpen}
        onClose={() => setIsCaptionModalOpen(false)}
        isAdPunchActive={isAdPunchActive}
        adElapsedSec={adElapsedSec}
        selectedChannel={selectedChannel}
        adMasters={adMasters}
        newsMasters={newsMasters}
        programMasters={programMasters}
        selectedAdId={selectedAdId}
        onSelectAdId={setSelectedAdId}
        selectedNewsId={selectedNewsId}
        onSelectNewsId={setSelectedNewsId}
        customCaption={customCaption}
        setCustomCaption={setCustomCaption}
        onAddNewsMaster={onAddNewsMaster || (async () => {})}
        onAddAdMaster={onAddAdMaster || (async () => {})}
        onConfirmAdPunch={confirmAdPunchEnd}
        onStartAdPunch={handleAdStart}
      />
    </div>
  );
};
