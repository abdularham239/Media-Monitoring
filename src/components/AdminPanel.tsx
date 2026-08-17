import React, { useState } from 'react';
import { Channel, User, StorageStats, AuditLog, SystemAlert, MonitoringSettings } from '../types';
import { Shield, Tv, Users, HardDrive, Activity, FileText, Settings, Plus, Edit3, Trash2, CheckCircle2, AlertTriangle, RefreshCw, Download, Database } from 'lucide-react';

interface AdminPanelProps {
  channels: Channel[];
  users: User[];
  storage: StorageStats;
  auditLogs: AuditLog[];
  alerts: SystemAlert[];
  settings: MonitoringSettings;
  onAddChannel: (c: Partial<Channel>) => void;
  onUpdateChannel: (id: string, c: Partial<Channel>) => void;
  onDeleteChannel: (id: string) => void;
  onStorageCleanup: () => void;
  onUpdateSettings: (s: Partial<MonitoringSettings>) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  channels,
  users,
  storage,
  auditLogs,
  alerts,
  settings,
  onAddChannel,
  onUpdateChannel,
  onDeleteChannel,
  onStorageCleanup,
  onUpdateSettings
}) => {
  const [activeTab, setActiveTab] = useState<'channels' | 'users' | 'storage' | 'audit' | 'settings'>('channels');

  // Channel Form State
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [channelCode, setChannelCode] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [streamType, setStreamType] = useState<any>('hls');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [videoFormat, setVideoFormat] = useState<any>('H.264');
  const [audioFormat, setAudioFormat] = useState<any>('AAC-LC');
  const [recordingQuality, setRecordingQuality] = useState<any>('1080p60');
  const [storageLocation, setStorageLocation] = useState('');
  const [segmentDurationMin, setSegmentDurationMin] = useState(60);
  const [retentionDays, setRetentionDays] = useState(30);

  // Shortcut config state
  const [adStartKey, setAdStartKey] = useState(settings.shortcuts.adStartKey);
  const [adEndKey, setAdEndKey] = useState(settings.shortcuts.adEndKey);
  const [preRollSec, setPreRollSec] = useState(settings.preRollSec);
  const [postRollSec, setPostRollSec] = useState(settings.postRollSec);

  const handleOpenNewChannel = () => {
    setChannelName('');
    setChannelCode('');
    setStreamUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4');
    setStreamType('http');
    setUsername('');
    setPassword('');
    setVideoFormat('H.264');
    setAudioFormat('AAC-LC');
    setRecordingQuality('1080p60');
    setStorageLocation('/storage/recordings/ch-new/');
    setSegmentDurationMin(60);
    setRetentionDays(30);
    setIsChannelModalOpen(true);
  };

  const handleChannelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddChannel({
      name: channelName,
      code: channelCode || (channelName ? channelName.slice(0, 4).toUpperCase() : 'CHNL'),
      streamUrl: streamUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      streamType,
      username,
      password,
      videoFormat,
      audioFormat,
      recordingQuality,
      storageLocation: storageLocation || `/storage/recordings/${(channelCode || 'ch').toLowerCase()}/`,
      segmentDurationMin: Number(segmentDurationMin),
      retentionDays: Number(retentionDays)
    });
    setIsChannelModalOpen(false);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      preRollSec: Number(preRollSec),
      postRollSec: Number(postRollSec),
      shortcuts: {
        ...settings.shortcuts,
        adStartKey,
        adEndKey
      }
    });
  };

  const usedPercent = Math.round((storage.usedGb / storage.totalGb) * 100);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-5 shadow-xl">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="font-extrabold text-lg text-slate-100 flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-500" />
            ADMIN CONTROL PANEL & SYSTEM ADMINISTRATION
          </h2>
          <p className="text-xs text-slate-400">
            Channel configuration, stream decoder status, role permissions, storage retention, audit trail, and shortcuts.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {[
          { key: 'channels', label: 'Channels Manager', icon: Tv },
          { key: 'users', label: 'Users & Roles', icon: Users },
          { key: 'storage', label: 'Storage & Retention', icon: HardDrive },
          { key: 'audit', label: 'Audit Trail Logs', icon: FileText },
          { key: 'settings', label: 'System Shortcuts & Buffer', icon: Settings }
        ].map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shrink-0 transition-colors ${
                activeTab === t.key
                  ? 'bg-red-950 border border-red-800 text-red-400 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}

      {/* 1. CHANNELS MANAGER */}
      {activeTab === 'channels' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-semibold">MONITORED CHANNELS ({channels.length})</span>
            <button
              onClick={handleOpenNewChannel}
              className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-2 text-xs"
            >
              <Plus className="w-4 h-4" /> ADD NEW CHANNEL
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {channels.map(ch => (
              <div key={ch.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${ch.status === 'online' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                    <span className="font-bold text-slate-100 text-sm">{ch.name}</span>
                  </div>
                  <span className="font-mono text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">{ch.code}</span>
                </div>

                <div className="text-xs text-slate-400 space-y-1 font-mono">
                  <div>Resolution: <strong className="text-slate-200">{ch.resolution} @ {ch.fps}fps</strong></div>
                  <div>Bitrate: <strong className="text-slate-200">{ch.bitrate}</strong></div>
                  <div>Retention: <strong className="text-cyan-400">{ch.retentionDays} Days</strong></div>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-800/80">
                  <button onClick={() => onDeleteChannel(ch.id)} className="p-1.5 text-slate-400 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. USERS & ROLES */}
      {activeTab === 'users' && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
              <tr>
                <th className="p-3">USER NAME</th>
                <th className="p-3">USERNAME</th>
                <th className="p-3">EMAIL</th>
                <th className="p-3">ROLE PERMISSION</th>
                <th className="p-3">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-900/50">
                  <td className="p-3 font-bold text-slate-100">{u.name}</td>
                  <td className="p-3 font-mono text-slate-400">@{u.username}</td>
                  <td className="p-3 text-slate-300">{u.email}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase border ${
                      u.role === 'admin'
                        ? 'bg-red-950 border-red-800 text-red-400'
                        : u.role === 'supervisor'
                        ? 'bg-amber-950 border-amber-800 text-amber-400'
                        : 'bg-cyan-950 border-cyan-800 text-cyan-400'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="text-emerald-400 font-bold text-xs">● ACTIVE</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. STORAGE & RETENTION */}
      {activeTab === 'storage' && (
        <div className="flex flex-col gap-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-100 text-sm">STORAGE USAGE MONITOR</h3>
                <p className="text-xs text-slate-400">
                  Total Allocated: {storage.totalGb} GB ({ (storage.totalGb / 1024).toFixed(1) } TB)
                </p>
              </div>
              <button
                onClick={onStorageCleanup}
                className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> RUN MANUAL CLEANUP
              </button>
            </div>

            {/* Storage Meter Bar */}
            <div className="w-full bg-slate-900 h-4 rounded-full overflow-hidden border border-slate-800 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-300 ${usedPercent > 80 ? 'bg-red-500' : 'bg-cyan-500'}`}
                style={{ width: `${usedPercent}%` }}
              />
            </div>

            <div className="flex justify-between text-xs font-mono text-slate-300">
              <span>USED: <strong>{storage.usedGb} GB</strong> ({usedPercent}%)</span>
              <span>FREE: <strong>{storage.freeGb} GB</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* 4. AUDIT TRAIL LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800 sticky top-0">
              <tr>
                <th className="p-3">TIMESTAMP</th>
                <th className="p-3">USER</th>
                <th className="p-3">ACTION</th>
                <th className="p-3">ENTITY</th>
                <th className="p-3">DETAILS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {auditLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-900/50">
                  <td className="p-3 font-mono text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="p-3 font-bold text-cyan-400">{log.userName} ({log.role})</td>
                  <td className="p-3 font-mono font-bold text-amber-400">{log.action}</td>
                  <td className="p-3 font-mono text-slate-300">{log.entity}</td>
                  <td className="p-3 text-slate-300">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. SETTINGS & SHORTCUTS */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
          <h3 className="font-bold text-slate-100 text-sm border-b border-slate-800 pb-2">
            CLIP BUFFER & HOTKEY REMAP CONFIGURATION
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">PRE-ROLL CLIP BUFFER (SEC)</label>
              <input
                type="number"
                value={preRollSec}
                onChange={e => setPreRollSec(Number(e.target.value))}
                className="w-full bg-slate-900 text-slate-100 border border-slate-800 rounded p-2 text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">POST-ROLL CLIP BUFFER (SEC)</label>
              <input
                type="number"
                value={postRollSec}
                onChange={e => setPostRollSec(Number(e.target.value))}
                className="w-full bg-slate-900 text-slate-100 border border-slate-800 rounded p-2 text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">AD START HOTKEY</label>
              <input
                type="text"
                value={adStartKey}
                onChange={e => setAdStartKey(e.target.value)}
                className="w-full bg-slate-900 text-amber-400 font-bold border border-slate-800 rounded p-2 text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">AD END HOTKEY</label>
              <input
                type="text"
                value={adEndKey}
                onChange={e => setAdEndKey(e.target.value)}
                className="w-full bg-slate-900 text-red-400 font-bold border border-slate-800 rounded p-2 text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold px-5 py-2 rounded text-xs">
              SAVE SETTINGS
            </button>
          </div>
        </form>
      )}

      {/* Add Channel Modal */}
      {isChannelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-5 shadow-2xl flex flex-col gap-3 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-slate-100 text-base border-b border-slate-800 pb-2 flex items-center justify-between">
              <span>ADD REAL PRODUCTION TV CHANNEL</span>
              <span className="text-[10px] bg-cyan-950 border border-cyan-800 text-cyan-400 px-2 py-0.5 rounded font-mono">INGEST SOURCE</span>
            </h3>

            <form onSubmit={handleChannelSubmit} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">CHANNEL NAME *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PTV News HD"
                    value={channelName}
                    onChange={e => setChannelName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">CHANNEL CODE *</label>
                  <input
                    type="text"
                    placeholder="e.g. PTV-NEWS"
                    value={channelCode}
                    onChange={e => setChannelCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">STREAM TYPE *</label>
                  <select
                    value={streamType}
                    onChange={e => setStreamType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-100 font-mono"
                  >
                    <option value="http">HTTP Video / MP4</option>
                    <option value="hls font-mono">HLS (.m3u8)</option>
                    <option value="srt">SRT (Secure Reliable Transport)</option>
                    <option value="rtmp">RTMP Live Feed</option>
                    <option value="mpegts">MPEG-TS Multicast</option>
                    <option value="udp">UDP Raw Stream</option>
                    <option value="sdi">SDI Capture Device Card</option>
                    <option value="hdmi">HDMI Hardware Capture</option>
                    <option value="encoder">Professional Hardware Encoder</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">RECORDING QUALITY</label>
                  <select
                    value={recordingQuality}
                    onChange={e => setRecordingQuality(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-100 font-mono"
                  >
                    <option value="1080p60">1080p @ 60fps (8.0 Mbps)</option>
                    <option value="1080p30">1080p @ 30fps (6.0 Mbps)</option>
                    <option value="720p60">720p @ 60fps (4.5 Mbps)</option>
                    <option value="480p">480p SD (2.0 Mbps)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">STREAM URL / INGEST ADDRESS *</label>
                <input
                  type="text"
                  required
                  placeholder="srt://192.168.1.100:9000 OR rtmp://live.encoder.com/app/stream"
                  value={streamUrl}
                  onChange={e => setStreamUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-100 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">STREAM USERNAME (OPTIONAL)</label>
                  <input
                    type="text"
                    placeholder="User ID"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">STREAM PASSWORD (OPTIONAL)</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">VIDEO FORMAT</label>
                  <select
                    value={videoFormat}
                    onChange={e => setVideoFormat(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-100 font-mono"
                  >
                    <option value="H.264">H.264 (AVC)</option>
                    <option value="H.265 (HEVC)">H.265 (HEVC)</option>
                    <option value="MPEG-2">MPEG-2 Broadcast</option>
                    <option value="ProRes">Apple ProRes 422</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">AUDIO FORMAT</label>
                  <select
                    value={audioFormat}
                    onChange={e => setAudioFormat(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-100 font-mono"
                  >
                    <option value="AAC-LC">AAC-LC Stereo</option>
                    <option value="AC3">Dolby Digital AC3</option>
                    <option value="MP3">MPEG Audio Layer 3</option>
                    <option value="PCM">Uncompressed PCM</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">RETENTION (DAYS)</label>
                  <input
                    type="number"
                    value={retentionDays}
                    onChange={e => setRetentionDays(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">SEGMENT DURATION (MIN)</label>
                  <input
                    type="number"
                    value={segmentDurationMin}
                    onChange={e => setSegmentDurationMin(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">STORAGE MOUNT LOCATION</label>
                <input
                  type="text"
                  value={storageLocation}
                  placeholder="/storage/recordings/channel-id/"
                  onChange={e => setStorageLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-100 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setIsChannelModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded">
                  CANCEL
                </button>
                <button type="submit" className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold rounded">
                  SAVE & INITIALIZE FFmpeg WORKER
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
