import React, { useState, useEffect } from 'react';
import {
  User,
  Channel,
  AdMaster,
  NewsMaster,
  ProgramMaster,
  ProgramSchedule,
  AdPunch,
  ClipItem,
  SystemAlert,
  AuditLog,
  StorageStats,
  MonitoringSettings
} from './types';

import { Navbar } from './components/Navbar';
import { BroadcastPlayer } from './components/BroadcastPlayer';
import { PunchControlPanel } from './components/PunchControlPanel';
import { RecentPunchesDrawer } from './components/RecentPunchesDrawer';
import { ClipPlayerModal } from './components/ClipPlayerModal';
import { AdMasterLibrary } from './components/AdMasterLibrary';
import { NewsMasterLibrary } from './components/NewsMasterLibrary';
import { ProgramMasterLibrary } from './components/ProgramMasterLibrary';
import { ProgramScheduler } from './components/ProgramScheduler';
import { BroadcastReports } from './components/BroadcastReports';
import { AdminPanel } from './components/AdminPanel';

import { Tv, Tag, Newspaper, Calendar, BarChart2, Shield, Film, Radio, Bell, Download, RefreshCw, X } from 'lucide-react';

export default function App() {
  const [activeNavTab, setActiveNavTab] = useState<'control_room' | 'ads_master' | 'news_master' | 'program_master' | 'scheduler' | 'reports' | 'admin'>('control_room');
  const [gridLayout, setGridLayout] = useState<number>(4);

  // Core App States
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [adMasters, setAdMasters] = useState<AdMaster[]>([]);
  const [newsMasters, setNewsMasters] = useState<NewsMaster[]>([]);
  const [programMasters, setProgramMasters] = useState<ProgramMaster[]>([]);
  const [schedules, setSchedules] = useState<ProgramSchedule[]>([]);
  const [adPunches, setAdPunches] = useState<AdPunch[]>([]);
  const [clips, setClips] = useState<ClipItem[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [storage, setStorage] = useState<StorageStats>({
    usedGb: 3240,
    freeGb: 1880,
    totalGb: 5120,
    continuousRecDays: 30,
    adClipsDays: 365,
    reportsDays: 3650
  });
  const [settings, setSettings] = useState<MonitoringSettings>({
    preRollSec: 3,
    postRollSec: 3,
    recordingQuality: '1080p',
    shortcuts: {
      adStartKey: 'F1',
      adEndKey: 'F2',
      programStartKey: 'F3',
      programEndKey: 'F4',
      newsStartKey: 'F5',
      newsEndKey: 'F6',
      pauseKey: 'Space',
      replayKey: 'KeyR'
    },
    alertSound: true,
    autoRefreshSec: 5,
    theme: 'dark',
    timeZone: 'Asia/Karachi (+05:00)'
  });

  // Active Control Room Selection States
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');
  const [focusedChannelId, setFocusedChannelId] = useState<string | null>(null);
  const [activeClipForReplay, setActiveClipForReplay] = useState<ClipItem | null>(null);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);

  // Fetch initial data from server
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [uRes, cRes, aRes, nRes, pRes, sRes, punchRes, clipRes, altRes, audRes, stRes, setRes] = await Promise.all([
        fetch('/api/auth/current').then(r => r.json()),
        fetch('/api/channels').then(r => r.json()),
        fetch('/api/masters/ads').then(r => r.json()),
        fetch('/api/masters/news').then(r => r.json()),
        fetch('/api/masters/programs').then(r => r.json()),
        fetch('/api/schedules').then(r => r.json()),
        fetch('/api/punches/ads').then(r => r.json()),
        fetch('/api/clips').then(r => r.json()),
        fetch('/api/alerts').then(r => r.json()),
        fetch('/api/audit-logs').then(r => r.json()),
        fetch('/api/storage').then(r => r.json()),
        fetch('/api/settings').then(r => r.json())
      ]);

      setUsers(uRes.users || []);
      setCurrentUser(uRes.user || null);
      setChannels(cRes || []);
      setAdMasters(aRes || []);
      setNewsMasters(nRes || []);
      setProgramMasters(pRes || []);
      setSchedules(sRes || []);
      setAdPunches(punchRes || []);
      setClips(clipRes || []);
      setAlerts(altRes || []);
      setAuditLogs(audRes || []);
      if (stRes) setStorage(stRes);
      if (setRes) setSettings(setRes);

      if (cRes && cRes.length > 0 && !selectedChannelId) {
        setSelectedChannelId(cRes[0].id);
      }
    } catch (err) {
      console.error('Error fetching broadcast API data:', err);
    }
  };

  // Role Switcher
  const handleRoleSwitch = async (userId: string) => {
    try {
      const res = await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      }).then(r => r.json());
      if (res.success && res.user) {
        setCurrentUser(res.user);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to switch role:', err);
    }
  };

  // Ad Punch Handler
  const handlePunchAdSubmit = async (punchData: Partial<AdPunch>) => {
    try {
      const res = await fetch('/api/punches/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(punchData)
      }).then(r => r.json());

      if (res.punch && res.generatedClip) {
        setAdPunches(prev => [res.punch, ...prev]);
        setClips(prev => [res.generatedClip, ...prev]);
        setActiveClipForReplay(res.generatedClip); // Instant replay popup!

        // Update channel last punched event
        setChannels(prev =>
          prev.map(c => (c.id === res.punch.channelId ? { ...c, lastPunchedEvent: `${res.punch.brand} ${res.punch.adName}` } : c))
        );
      }
    } catch (err) {
      console.error('Failed to submit ad punch:', err);
    }
  };

  // Check Duplicate Helper
  const handleCheckDuplicate = async (brand: string, adName: string) => {
    const res = await fetch('/api/masters/ads/check-duplicate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand, adName })
    }).then(r => r.json());
    return res;
  };

  // Master Ad Handlers
  const handleAddAdMaster = async (data: Partial<AdMaster>) => {
    const res = await fetch('/api/masters/ads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json());
    setAdMasters(prev => [res, ...prev]);
  };

  const handleUpdateAdMaster = async (id: string, data: Partial<AdMaster>) => {
    const res = await fetch(`/api/masters/ads/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json());
    setAdMasters(prev => prev.map(a => (a.id === id ? res : a)));
  };

  const handleDeleteAdMaster = async (id: string) => {
    await fetch(`/api/masters/ads/${id}`, { method: 'DELETE' });
    setAdMasters(prev => prev.filter(a => a.id !== id));
  };

  // News Master Handlers
  const handleAddNewsMaster = async (data: Partial<NewsMaster>) => {
    const res = await fetch('/api/masters/news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json());
    setNewsMasters(prev => [res, ...prev]);
  };

  const handleUpdateNewsMaster = async (id: string, data: Partial<NewsMaster>) => {
    const res = await fetch(`/api/masters/news/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json());
    setNewsMasters(prev => prev.map(n => (n.id === id ? res : n)));
  };

  const handleDeleteNewsMaster = async (id: string) => {
    await fetch(`/api/masters/news/${id}`, { method: 'DELETE' });
    setNewsMasters(prev => prev.filter(n => n.id !== id));
  };

  // Program Master Handlers
  const handleAddProgramMaster = async (data: Partial<ProgramMaster>) => {
    const res = await fetch('/api/masters/programs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json());
    setProgramMasters(prev => [res, ...prev]);
  };

  const handleUpdateProgramMaster = async (id: string, data: Partial<ProgramMaster>) => {
    const res = await fetch(`/api/masters/programs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json());
    setProgramMasters(prev => prev.map(p => (p.id === id ? res : p)));
  };

  const handleDeleteProgramMaster = async (id: string) => {
    await fetch(`/api/masters/programs/${id}`, { method: 'DELETE' });
    setProgramMasters(prev => prev.filter(p => p.id !== id));
  };

  // Schedule Handlers
  const handleAddSchedule = async (data: Partial<ProgramSchedule>) => {
    const res = await fetch('/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json());
    setSchedules(prev => [...prev, res]);
  };

  const handleDeleteSchedule = async (id: string) => {
    await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
    setSchedules(prev => prev.filter(s => s.id !== id));
  };

  // Clip Protection & Deletion
  const handleProtectToggle = async (clipId: string) => {
    const res = await fetch(`/api/clips/${clipId}/protect`, { method: 'PATCH' }).then(r => r.json());
    if (res.id) {
      setClips(prev => prev.map(c => (c.id === clipId ? res : c)));
    }
  };

  const handleDeleteClip = async (clipId: string) => {
    const res = await fetch(`/api/clips/${clipId}`, { method: 'DELETE' }).then(r => r.json());
    if (res.success) {
      setClips(prev => prev.filter(c => c.id !== clipId));
    }
  };

  // Channel Admin Handlers
  const handleAddChannel = async (cData: Partial<Channel>) => {
    const res = await fetch('/api/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cData)
    }).then(r => r.json());
    setChannels(prev => [...prev, res]);
  };

  const handleUpdateChannel = async (id: string, cData: Partial<Channel>) => {
    const res = await fetch(`/api/channels/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cData)
    }).then(r => r.json());
    setChannels(prev => prev.map(c => (c.id === id ? res : c)));
  };

  const handleDeleteChannel = async (id: string) => {
    await fetch(`/api/channels/${id}`, { method: 'DELETE' });
    setChannels(prev => prev.filter(c => c.id !== id));
  };

  // Storage Cleanup
  const handleStorageCleanup = async () => {
    const res = await fetch('/api/storage/cleanup', { method: 'POST' }).then(r => r.json());
    if (res.success) {
      fetchData();
    }
  };

  // Update Settings
  const handleUpdateSettings = async (sData: Partial<MonitoringSettings>) => {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sData)
    }).then(r => r.json());
    setSettings(res);
  };

  // Backup Export Trigger
  const handleExportBackup = () => {
    window.open('/api/backup/export', '_blank');
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] text-[#e1e1e1] flex items-center justify-center p-4 font-sans">
        <div className="flex items-center gap-3 text-orange-500 animate-pulse">
          <Tv className="w-8 h-8 text-orange-500" />
          <span className="font-extrabold text-lg">Initializing TeleMonitor Control Room...</span>
        </div>
      </div>
    );
  }

  const displayedChannels = focusedChannelId
    ? channels.filter(c => c.id === focusedChannelId)
    : channels.slice(0, gridLayout);

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#e1e1e1] flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        users={users}
        alerts={alerts}
        gridLayout={gridLayout}
        onGridLayoutChange={l => {
          setGridLayout(l);
          setFocusedChannelId(null);
        }}
        onRoleSwitch={handleRoleSwitch}
        onOpenSettings={() => setActiveNavTab('admin')}
        onOpenAlerts={() => setIsAlertsModalOpen(true)}
        onExportBackup={handleExportBackup}
      />

      {/* Main Broadcast Navigation Tab Header */}
      <nav className="bg-[#16161a] border-b border-[#222225] px-4 py-2 flex items-center gap-1.5 overflow-x-auto sticky top-[53px] z-30 shadow-lg">
        {[
          { key: 'control_room', label: 'Live Monitoring Control Room', icon: Tv },
          { key: 'ads_master', label: 'Ad Master Library', icon: Tag },
          { key: 'news_master', label: 'News Master Library', icon: Newspaper },
          { key: 'program_master', label: 'Program Master Library', icon: Film },
          { key: 'scheduler', label: 'Program Scheduler', icon: Calendar },
          { key: 'reports', label: 'Reports & Analytics', icon: BarChart2 },
          { key: 'admin', label: 'Admin & System Config', icon: Shield }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveNavTab(tab.key as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                activeNavTab === tab.key
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-950/40'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Main Body Content */}
      <main className="flex-1 p-4 max-w-[1920px] w-full mx-auto space-y-4">
        {/* TAB 1: LIVE CONTROL ROOM */}
        {activeNavTab === 'control_room' && (
          <div className="flex flex-col gap-4">
            {/* Top Channel Focus Release Bar if zoomed */}
            {focusedChannelId && (
              <div className="bg-[#111113] border border-orange-500/30 px-4 py-2.5 rounded-2xl flex items-center justify-between text-xs text-orange-200">
                <span className="font-bold flex items-center gap-2">
                  <Tv className="w-4 h-4 text-orange-500" /> SINGLE CHANNEL FOCUS VIEW ENABLED
                </span>
                <button
                  onClick={() => setFocusedChannelId(null)}
                  className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer"
                >
                  SHOW ALL {gridLayout} GRID CHANNELS
                </button>
              </div>
            )}

            {/* Multi-Channel Live Video Grid */}
            {displayedChannels.length === 0 ? (
              <div className="bg-[#111113] border border-[#222225] rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-full bg-orange-950/40 border border-orange-500/30 flex items-center justify-center">
                  <Tv className="w-8 h-8 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-100">NO CHANNEL CONFIGURED</h3>
                  <p className="text-xs text-zinc-400 max-w-md mt-1">
                    Your monitoring system is ready and completely clean. Click below to add your real TV channel source (SRT, RTMP, HLS, HTTP, SDI, HDMI).
                  </p>
                </div>
                <button
                  onClick={() => setActiveNavTab('admin')}
                  className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-orange-950/50 cursor-pointer"
                >
                  <Tv className="w-4 h-4" />
                  ADD REAL TV CHANNEL IN ADMIN PANEL
                </button>
              </div>
            ) : (
              <div
                className={`grid gap-3.5 ${
                  displayedChannels.length === 1
                    ? 'grid-cols-1'
                    : displayedChannels.length === 2
                    ? 'grid-cols-1 md:grid-cols-2'
                    : displayedChannels.length <= 4
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4'
                    : displayedChannels.length <= 6
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                    : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                }`}
              >
                {displayedChannels.map(ch => (
                  <BroadcastPlayer
                    key={ch.id}
                    channel={ch}
                    isFocused={selectedChannelId === ch.id}
                    onFocus={() => {
                      setSelectedChannelId(ch.id);
                      setFocusedChannelId(ch.id);
                    }}
                    onPinToggle={() => {
                      setChannels(prev =>
                        prev.map(c => (c.id === ch.id ? { ...c, pinned: !c.pinned } : c))
                      );
                    }}
                    onPunchClick={targetCh => {
                      setSelectedChannelId(targetCh.id);
                    }}
                    onUpdateChannel={handleUpdateChannel}
                  />
                ))}
              </div>
            )}

            {/* Live Punching Control Panel & Instant Replay */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
              <div className="lg:col-span-2">
                <PunchControlPanel
                  channels={channels}
                  selectedChannelId={selectedChannelId}
                  onSelectChannel={setSelectedChannelId}
                  adMasters={adMasters}
                  programMasters={programMasters}
                  newsMasters={newsMasters}
                  shortcuts={settings.shortcuts}
                  preRollSec={settings.preRollSec}
                  postRollSec={settings.postRollSec}
                  onPunchAdSubmit={handlePunchAdSubmit}
                  onPunchProgramSubmit={() => {}}
                  onPunchNewsSubmit={() => {}}
                  onReplayLatestClip={() => {
                    if (clips.length > 0) {
                      setActiveClipForReplay(clips[0]);
                    }
                  }}
                  recentClips={clips}
                  onAddNewsMaster={handleAddNewsMaster}
                  onAddAdMaster={handleAddAdMaster}
                />
              </div>

              <div>
                <RecentPunchesDrawer
                  punches={adPunches}
                  clips={clips}
                  onPlayClip={clip => setActiveClipForReplay(clip)}
                  onProtectToggle={handleProtectToggle}
                  onDeleteClip={handleDeleteClip}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AD MASTER LIBRARY */}
        {activeNavTab === 'ads_master' && (
          <AdMasterLibrary
            adMasters={adMasters}
            onAddAdMaster={handleAddAdMaster}
            onUpdateAdMaster={handleUpdateAdMaster}
            onDeleteAdMaster={handleDeleteAdMaster}
            onCheckDuplicate={handleCheckDuplicate}
          />
        )}

        {/* TAB 3: NEWS MASTER LIBRARY */}
        {activeNavTab === 'news_master' && (
          <NewsMasterLibrary
            newsMasters={newsMasters}
            onAddNewsMaster={handleAddNewsMaster}
            onUpdateNewsMaster={handleUpdateNewsMaster}
            onDeleteNewsMaster={handleDeleteNewsMaster}
          />
        )}

        {/* TAB 4: PROGRAM MASTER LIBRARY */}
        {activeNavTab === 'program_master' && (
          <ProgramMasterLibrary
            programMasters={programMasters}
            channels={channels}
            onAddProgramMaster={handleAddProgramMaster}
            onUpdateProgramMaster={handleUpdateProgramMaster}
            onDeleteProgramMaster={handleDeleteProgramMaster}
          />
        )}

        {/* TAB 5: PROGRAM SCHEDULER */}
        {activeNavTab === 'scheduler' && (
          <ProgramScheduler
            schedules={schedules}
            channels={channels}
            programMasters={programMasters}
            onAddSchedule={handleAddSchedule}
            onDeleteSchedule={handleDeleteSchedule}
          />
        )}

        {/* TAB 6: REPORTS & ANALYTICS */}
        {activeNavTab === 'reports' && (
          <BroadcastReports
            adPunches={adPunches}
            clips={clips}
            channels={channels}
          />
        )}

        {/* TAB 7: ADMIN CONTROL PANEL */}
        {activeNavTab === 'admin' && (
          <AdminPanel
            channels={channels}
            users={users}
            storage={storage}
            auditLogs={auditLogs}
            alerts={alerts}
            settings={settings}
            onAddChannel={handleAddChannel}
            onUpdateChannel={handleUpdateChannel}
            onDeleteChannel={handleDeleteChannel}
            onStorageCleanup={handleStorageCleanup}
            onUpdateSettings={handleUpdateSettings}
          />
        )}
      </main>

      {/* Bento System Telemetry Footer */}
      <footer className="bg-[#16161a] border-t border-[#222225] px-4 py-2 text-[11px] text-zinc-400 font-mono flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-zinc-300 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            SYSTEM ONLINE
          </span>
          <span>OPERATOR: <strong className="text-zinc-200">{currentUser.name}</strong></span>
          <span>DATABASE: <strong className="text-emerald-400">CONNECTED (SYNCED)</strong></span>
          <span>ENCODER: <strong className="text-orange-400">FFMPEG H.264/NVENC</strong></span>
        </div>

        <div className="flex items-center gap-4 text-zinc-500">
          <span>CPU: <strong className="text-zinc-300">14%</strong></span>
          <span>RAM: <strong className="text-zinc-300">4.2 / 16 GB</strong></span>
          <span>GPU: <strong className="text-zinc-300">28%</strong></span>
          <span>STORAGE: <strong className="text-zinc-300">{storage.usedGb}GB / {storage.totalGb}GB</strong></span>
        </div>
      </footer>

      {/* Instant Clip Replay Modal */}
      <ClipPlayerModal
        clip={activeClipForReplay}
        onClose={() => setActiveClipForReplay(null)}
        onProtectToggle={handleProtectToggle}
        onDeleteClip={handleDeleteClip}
      />

      {/* System Alerts Modal */}
      {isAlertsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#16161a] border border-[#222225] rounded-2xl max-w-lg w-full p-5 shadow-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-[#222225] pb-3">
              <h3 className="font-bold text-zinc-100 text-base flex items-center gap-2">
                <Bell className="w-5 h-5 text-red-500" />
                SYSTEM ALERTS & SIGNAL NOTIFICATIONS
              </h3>
              <button onClick={() => setIsAlertsModalOpen(false)} className="p-1 text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {alerts.map(alt => (
                <div key={alt.id} className="bg-[#111113] border border-[#222225] rounded-xl p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-orange-400">{alt.title}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">{new Date(alt.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-zinc-300">{alt.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
