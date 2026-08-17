import {
  Channel,
  AdMaster,
  NewsMaster,
  ProgramMaster,
  ProgramSchedule,
  AdPunch,
  ClipItem,
  User,
  SystemAlert,
  AuditLog,
  StorageStats,
  MonitoringSettings
} from '../types';

export const INITIAL_USERS: User[] = [
  { id: 'usr-1', username: 'admin', name: 'Administrator', email: 'admin@telemonitor.com', role: 'admin', active: true, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80' },
  { id: 'usr-2', username: 'supervisor', name: 'Supervisor', email: 'supervisor@telemonitor.com', role: 'supervisor', active: true, avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80' },
  { id: 'usr-3', username: 'operator', name: 'Operator', email: 'operator@telemonitor.com', role: 'operator', active: true, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' }
];

export const INITIAL_CHANNELS: Channel[] = [];

export const INITIAL_AD_MASTERS: AdMaster[] = [];

export const INITIAL_NEWS_MASTERS: NewsMaster[] = [];

export const INITIAL_PROGRAM_MASTERS: ProgramMaster[] = [];

export const INITIAL_SCHEDULES: ProgramSchedule[] = [];

export const INITIAL_AD_PUNCHES: AdPunch[] = [];

export const INITIAL_CLIPS: ClipItem[] = [];

export const INITIAL_ALERTS: SystemAlert[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-init',
    userId: 'usr-1',
    userName: 'Administrator',
    role: 'admin',
    action: 'SYSTEM_INITIALIZED',
    entity: 'System',
    details: 'System initialized fresh in clean production mode.',
    ip: '127.0.0.1',
    timestamp: new Date().toISOString()
  }
];

export const INITIAL_STORAGE: StorageStats = {
  usedGb: 0,
  freeGb: 5120,
  totalGb: 5120,
  continuousRecDays: 30,
  adClipsDays: 365,
  reportsDays: 3650
};

export const INITIAL_SETTINGS: MonitoringSettings = {
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
};
