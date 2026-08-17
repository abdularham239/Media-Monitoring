export type Role = 'admin' | 'supervisor' | 'operator' | 'viewer';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  avatar?: string;
}

export interface Channel {
  id: string;
  name: string;
  code: string;
  logo: string;
  streamUrl: string;
  streamType: 'hls' | 'rtmp' | 'srt' | 'http' | 'mpegts' | 'udp' | 'sdi' | 'hdmi' | 'encoder' | 'demo';
  resolution: string;
  bitrate: string;
  fps: number;
  recordingEnabled: boolean;
  retentionDays: number;
  status: 'online' | 'offline' | 'reconnecting';
  signalQuality: number; // 0-100
  audioLevel: number; // 0-100
  currentProgramId?: string;
  currentProgramName?: string;
  commercialBreakActive?: boolean;
  lastPunchedEvent?: string;
  pinned?: boolean;
  testPattern?: 'colorbars' | 'news' | 'sports' | 'entertainment' | 'movie';
  // Advanced Real Stream & Storage Config
  username?: string;
  password?: string;
  videoFormat?: 'H.264' | 'H.265 (HEVC)' | 'MPEG-2' | 'ProRes';
  audioFormat?: 'AAC-LC' | 'AC3' | 'MP3' | 'PCM';
  recordingQuality?: '1080p60' | '1080p30' | '720p60' | '480p';
  storageLocation?: string;
  segmentDurationMin?: number; // Default 60 mins
  workerPid?: number;
  workerStatus?: 'running' | 'reconnecting' | 'stopped' | 'failed';
  uptimeSec?: number;
}

export interface RecordingSegment {
  id: string;
  channelId: string;
  channelName: string;
  startTime: string; // ISO
  endTime: string;   // ISO
  filePath: string;
  durationSec: number;
  codec: string;
  resolution: string;
  fileSizeMb: number;
  status: 'active' | 'completed' | 'archived';
  segmentIndex: number;
}

export interface MediaProbeResult {
  durationSec: number;
  width: number;
  height: number;
  videoCodec: string;
  audioCodec: string;
  bitrateKbps: number;
  fps: number;
  formatName: string;
  fileSizeBytes: number;
}

export interface AdMaster {
  id: string;
  advertiserId: string;
  brand: string;
  adName: string;
  productName: string;
  category: string;
  version: string;
  campaignName: string;
  targetDurationSec: number;
  videoUrl?: string;
  thumbnail: string;
  brandLogo: string;
  tags: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface NewsMaster {
  id: string;
  newsCode: string;
  title: string;
  shortTitle: string;
  category: string;
  presenter: string;
  description: string;
  defaultDurationSec: number;
  logo: string;
  tags: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProgramMaster {
  id: string;
  programCode: string;
  name: string;
  shortName: string;
  channelId: string;
  channelName: string;
  category: string;
  presenter: string;
  host: string;
  season?: string;
  episodeFormat?: string;
  defaultDurationSec: number;
  logo: string;
  thumbnail: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProgramSchedule {
  id: string;
  channelId: string;
  programId: string;
  programName: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  dayOfWeek: number; // 0-6 (Sun-Sat) or -1 for daily
  dateStr?: string;  // YYYY-MM-DD for specific day
  category: string;
  host: string;
}

export interface AdPunch {
  id: string;
  channelId: string;
  channelName: string;
  adMasterId: string;
  adName: string;
  brand: string;
  campaignName: string;
  category: string;
  programId: string;
  programName: string;
  startTime: string; // ISO
  endTime: string;   // ISO
  durationSec: number;
  preRollSec: number;
  postRollSec: number;
  operatorId: string;
  operatorName: string;
  clipId?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  status: 'completed' | 'processing' | 'failed';
  timecodeStart: string;
  timecodeEnd: string;
  commercialBreakId?: string;
  notes?: string;
  createdAt: string;
}

export interface ProgramPunch {
  id: string;
  channelId: string;
  channelName: string;
  programMasterId: string;
  programName: string;
  startTime: string;
  endTime: string;
  durationSec: number;
  operatorId: string;
  operatorName: string;
  clipId?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface NewsPunch {
  id: string;
  channelId: string;
  channelName: string;
  newsMasterId: string;
  newsTitle: string;
  category: string;
  presenter: string;
  startTime: string;
  endTime: string;
  durationSec: number;
  operatorId: string;
  operatorName: string;
  clipId?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface CommercialBreak {
  id: string;
  channelId: string;
  channelName: string;
  programId: string;
  programName: string;
  startTime: string;
  endTime?: string;
  totalAdsCount: number;
  totalDurationSec: number;
  punches: AdPunch[];
}

export interface ClipItem {
  id: string;
  type: 'ad' | 'program' | 'news';
  channelId: string;
  channelName: string;
  title: string;
  brandOrHost: string;
  durationSec: number;
  startTime: string;
  endTime: string;
  fileUrl: string;
  thumbnailUrl: string;
  fileSizeMb: number;
  protected: boolean;
  createdBy: string;
  createdAt: string;
  punchId?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  role: Role;
  action: string;
  entity: string;
  details: string;
  ip: string;
  timestamp: string;
}

export interface SystemAlert {
  id: string;
  channelId?: string;
  channelName?: string;
  severity: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface StorageStats {
  usedGb: number;
  freeGb: number;
  totalGb: number;
  continuousRecDays: number;
  adClipsDays: number;
  reportsDays: number;
}

export interface ShortcutConfig {
  adStartKey: string;
  adEndKey: string;
  programStartKey: string;
  programEndKey: string;
  newsStartKey: string;
  newsEndKey: string;
  pauseKey: string;
  replayKey: string;
}

export interface MonitoringSettings {
  preRollSec: number;
  postRollSec: number;
  recordingQuality: '1080p' | '720p' | '480p';
  shortcuts: ShortcutConfig;
  alertSound: boolean;
  autoRefreshSec: number;
  theme: 'dark' | 'midnight' | 'studio';
  timeZone: string;
}
