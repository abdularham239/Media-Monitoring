import fs from 'fs';
import path from 'path';

import {
  User,
  Channel,
  AdMaster,
  NewsMaster,
  ProgramMaster,
  ProgramSchedule,
  AdPunch,
  ProgramPunch,
  NewsPunch,
  ClipItem,
  AuditLog,
  SystemAlert,
  StorageStats,
  MonitoringSettings,
  RecordingSegment,
  CommercialBreak,
  MediaProbeResult
} from '../types';

import {
  INITIAL_USERS,
  INITIAL_CHANNELS,
  INITIAL_AD_MASTERS,
  INITIAL_NEWS_MASTERS,
  INITIAL_PROGRAM_MASTERS,
  INITIAL_SCHEDULES,
  INITIAL_AD_PUNCHES,
  INITIAL_CLIPS,
  INITIAL_ALERTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_STORAGE,
  INITIAL_SETTINGS
} from '../data/initialData';

const DB_FILE_PATH = path.join(process.cwd(), 'db_store.json');

class BroadcastStore {
  public users: User[] = [...INITIAL_USERS];
  public channels: Channel[] = [...INITIAL_CHANNELS];
  public adMasters: AdMaster[] = [...INITIAL_AD_MASTERS];
  public newsMasters: NewsMaster[] = [...INITIAL_NEWS_MASTERS];
  public programMasters: ProgramMaster[] = [...INITIAL_PROGRAM_MASTERS];
  public schedules: ProgramSchedule[] = [...INITIAL_SCHEDULES];
  public adPunches: AdPunch[] = [...INITIAL_AD_PUNCHES];
  public programPunches: ProgramPunch[] = [];
  public newsPunches: NewsPunch[] = [];
  public clips: ClipItem[] = [...INITIAL_CLIPS];
  public alerts: SystemAlert[] = [...INITIAL_ALERTS];
  public auditLogs: AuditLog[] = [...INITIAL_AUDIT_LOGS];
  public storage: StorageStats = { ...INITIAL_STORAGE };
  public settings: MonitoringSettings = { ...INITIAL_SETTINGS };
  public recordingSegments: RecordingSegment[] = [];

  public currentUser: User = INITIAL_USERS[0]; // default Admin

  constructor() {
    this.loadFromDisk();
    this.initChannelsConfig();
    this.generate24HourRecordingSegments();
  }

  public saveToDisk() {
    try {
      const data = {
        users: this.users,
        channels: this.channels,
        adMasters: this.adMasters,
        newsMasters: this.newsMasters,
        programMasters: this.programMasters,
        schedules: this.schedules,
        adPunches: this.adPunches,
        programPunches: this.programPunches,
        newsPunches: this.newsPunches,
        clips: this.clips,
        alerts: this.alerts,
        auditLogs: this.auditLogs,
        storage: this.storage,
        settings: this.settings
      };
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save store to disk:', err);
    }
  }

  public loadFromDisk() {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        const data = JSON.parse(raw);
        if (Array.isArray(data.users) && data.users.length > 0) this.users = data.users;
        if (Array.isArray(data.channels)) this.channels = data.channels;
        if (Array.isArray(data.adMasters)) this.adMasters = data.adMasters;
        if (Array.isArray(data.newsMasters)) this.newsMasters = data.newsMasters;
        if (Array.isArray(data.programMasters)) this.programMasters = data.programMasters;
        if (Array.isArray(data.schedules)) this.schedules = data.schedules;
        if (Array.isArray(data.adPunches)) this.adPunches = data.adPunches;
        if (Array.isArray(data.programPunches)) this.programPunches = data.programPunches;
        if (Array.isArray(data.newsPunches)) this.newsPunches = data.newsPunches;
        if (Array.isArray(data.clips)) this.clips = data.clips;
        if (Array.isArray(data.alerts)) this.alerts = data.alerts;
        if (Array.isArray(data.auditLogs)) this.auditLogs = data.auditLogs;
        if (data.storage) this.storage = data.storage;
        if (data.settings) this.settings = data.settings;
      }
    } catch (err) {
      console.error('Failed to load store from disk:', err);
    }
  }

  private initChannelsConfig() {
    this.channels.forEach((c, idx) => {
      if (!c.storageLocation) {
        c.storageLocation = `/storage/recordings/${c.id}/`;
      }
      if (!c.videoFormat) {
        c.videoFormat = 'H.264';
      }
      if (!c.audioFormat) {
        c.audioFormat = 'AAC-LC';
      }
      if (!c.recordingQuality) {
        c.recordingQuality = '1080p60';
      }
      if (!c.segmentDurationMin) {
        c.segmentDurationMin = 60;
      }
      if (!c.workerStatus) {
        c.workerStatus = c.status === 'online' ? 'running' : 'reconnecting';
      }
      if (!c.workerPid) {
        c.workerPid = 4100 + idx * 12;
      }
      if (!c.uptimeSec) {
        c.uptimeSec = 86400 * 3 + idx * 3600;
      }
    });
  }

  public generate24HourRecordingSegments() {
    const segments: RecordingSegment[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.channels.forEach(ch => {
      for (let hour = 0; hour < 24; hour++) {
        const segStart = new Date(today.getTime() + hour * 3600 * 1000);
        const segEnd = new Date(segStart.getTime() + 3600 * 1000);
        const hourStr = String(hour).padStart(2, '0');
        const nextHourStr = String((hour + 1) % 24).padStart(2, '0');
        const fileName = `${ch.code}_${segStart.toISOString().slice(0, 10)}_${hourStr}-00.ts`;
        const isCurrentHour = hour === new Date().getHours();

        segments.push({
          id: `seg-${ch.id}-${hourStr}`,
          channelId: ch.id,
          channelName: ch.name,
          startTime: segStart.toISOString(),
          endTime: segEnd.toISOString(),
          filePath: `${ch.storageLocation || `/storage/recordings/${ch.id}/`}${segStart.toISOString().slice(0, 10)}/${fileName}`,
          durationSec: isCurrentHour ? new Date().getMinutes() * 60 + new Date().getSeconds() : 3600,
          codec: `${ch.videoFormat || 'H.264'} / ${ch.audioFormat || 'AAC'}`,
          resolution: ch.resolution || '1920x1080',
          fileSizeMb: isCurrentHour ? Number((new Date().getMinutes() * 45).toFixed(1)) : 2850,
          status: isCurrentHour ? 'active' : 'completed',
          segmentIndex: hour
        });
      }
    });

    this.recordingSegments = segments;
  }

  public getCommercialBreaks(channelId?: string): CommercialBreak[] {
    const punchesToGroup = channelId
      ? this.adPunches.filter(p => p.channelId === channelId)
      : this.adPunches;

    // Group punches by channel & 2-minute time window proximity
    const breakGroups: Map<string, AdPunch[]> = new Map();

    punchesToGroup.forEach(punch => {
      const punchTime = new Date(punch.startTime).getTime();
      let matchedKey: string | null = null;

      for (const [groupKey, groupPunches] of breakGroups.entries()) {
        const firstTime = new Date(groupPunches[0].startTime).getTime();
        if (punch.channelId === groupPunches[0].channelId && Math.abs(punchTime - firstTime) < 180000) {
          matchedKey = groupKey;
          break;
        }
      }

      if (matchedKey) {
        breakGroups.get(matchedKey)!.push(punch);
      } else {
        const newGroupKey = `cb-${punch.channelId}-${punchTime}`;
        breakGroups.set(newGroupKey, [punch]);
      }
    });

    const commercialBreaks: CommercialBreak[] = [];
    breakGroups.forEach((groupPunches, key) => {
      const sorted = [...groupPunches].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const totalSec = sorted.reduce((acc, p) => acc + p.durationSec, 0);

      commercialBreaks.push({
        id: key,
        channelId: first.channelId,
        channelName: first.channelName,
        programId: first.programId,
        programName: first.programName,
        startTime: first.startTime,
        endTime: last.endTime,
        totalAdsCount: sorted.length,
        totalDurationSec: totalSec,
        punches: sorted
      });
    });

    return commercialBreaks.sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  }

  public getCurrentProgramForChannel(channelId: string): { id: string; name: string } {
    const now = new Date();
    const curHH = String(now.getHours()).padStart(2, '0');
    const curMM = String(now.getMinutes()).padStart(2, '0');
    const curTimeStr = `${curHH}:${curMM}`;
    const curDayOfWeek = now.getDay();

    const matchedSch = this.schedules.find(s => {
      if (s.channelId !== channelId) return false;
      if (s.dayOfWeek !== -1 && s.dayOfWeek !== curDayOfWeek) return false;
      return curTimeStr >= s.startTime && curTimeStr <= s.endTime;
    });

    if (matchedSch) {
      return { id: matchedSch.programId, name: matchedSch.programName };
    }

    const ch = this.channels.find(c => c.id === channelId);
    return {
      id: ch?.currentProgramId || 'prg-1',
      name: ch?.currentProgramName || 'Live Transmission'
    };
  }

  public restartChannelWorker(channelId: string) {
    const ch = this.channels.find(c => c.id === channelId);
    if (ch) {
      ch.status = 'online';
      ch.workerStatus = 'running';
      ch.workerPid = Math.floor(1000 + Math.random() * 8000);
      ch.signalQuality = 98;
      ch.audioLevel = 80;
      this.addAuditLog('FFMPEG_RESTART', `Channel:${channelId}`, `Restarted FFmpeg ingestion worker PID ${ch.workerPid}`);
      return { success: true, channel: ch };
    }
    return { success: false, error: 'Channel not found' };
  }

  public probeMediaMetadata(videoUrl: string): MediaProbeResult {
    const isMp4 = videoUrl.endsWith('.mp4') || videoUrl.includes('gtv-videos-bucket');
    return {
      durationSec: isMp4 ? 30 : 60,
      width: 1920,
      height: 1080,
      videoCodec: 'h264 (High) (avc1 / 0x31637661)',
      audioCodec: 'aac (LC) (mp4a / 0x6134706D)',
      bitrateKbps: 6500,
      fps: 50,
      formatName: 'mov,mp4,m4a,3gp,3g2,mj2',
      fileSizeBytes: 24500000
    };
  }

  public addAuditLog(action: string, entity: string, details: string, user: User = this.currentUser) {
    const log: AuditLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: user.id,
      userName: user.name,
      role: user.role,
      action,
      entity,
      details,
      ip: '127.0.0.1',
      timestamp: new Date().toISOString()
    };
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
    this.saveToDisk();
    return log;
  }

  public checkAdDuplicate(brand: string, adName: string, idToIgnore?: string): AdMaster | null {
    const brandNorm = brand.trim().toLowerCase();
    const nameNorm = adName.trim().toLowerCase();
    return this.adMasters.find(
      a => a.id !== idToIgnore && (a.brand.toLowerCase() === brandNorm && a.adName.toLowerCase() === nameNorm)
    ) || null;
  }

  public generateClipForAdPunch(punch: AdPunch): ClipItem {
    const clipId = `clip-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date();
    const yearStr = now.getFullYear();
    const monthStr = String(now.getMonth() + 1).padStart(2, '0');
    const dayStr = String(now.getDate()).padStart(2, '0');
    const localFilePath = `/storage/clips/${yearStr}/${monthStr}/${dayStr}/${clipId}.mp4`;

    const newClip: ClipItem = {
      id: clipId,
      type: 'ad',
      channelId: punch.channelId,
      channelName: punch.channelName,
      title: `${punch.brand} - ${punch.adName} (${punch.durationSec}s)`,
      brandOrHost: punch.brand,
      durationSec: punch.durationSec + punch.preRollSec + punch.postRollSec,
      startTime: punch.startTime,
      endTime: punch.endTime,
      fileUrl: punch.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnailUrl: punch.thumbnailUrl || 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=300&auto=format&fit=crop&q=80',
      fileSizeMb: Number(((punch.durationSec + punch.preRollSec + punch.postRollSec) * 0.45).toFixed(1)),
      protected: false,
      createdBy: punch.operatorName,
      createdAt: new Date().toISOString(),
      punchId: punch.id
    };

    // Attach local clip path to punch
    (punch as any).localFilePath = localFilePath;

    this.clips.unshift(newClip);
    this.storage.usedGb = Number((this.storage.usedGb + newClip.fileSizeMb / 1024).toFixed(3));
    return newClip;
  }
}

export const store = new BroadcastStore();
