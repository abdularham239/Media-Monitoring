import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { store } from './src/server/store';
import { AdPunch } from './src/types';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // API Routes

  // Stream Proxy Endpoint (Solves CORS & Mixed-Content HTTP/HTTPS restrictions for live streams)
  app.get('/api/proxy-stream', async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).send('Missing url parameter');
    }

    try {
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*',
        }
      });

      if (!response.ok) {
        return res.status(response.status).send(`Upstream Stream Error: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', '*');

      const isPlaylist = contentType.includes('mpegurl') || 
                         contentType.includes('m3u8') || 
                         targetUrl.includes('.m3u8') || 
                         contentType.includes('text/plain') || 
                         contentType.includes('application/octet-stream');

      if (isPlaylist) {
        const text = await response.text();
        if (text.trim().startsWith('#EXTM3U') || targetUrl.includes('.m3u8')) {
          res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
          
          const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
          const lines = text.split('\n');
          const rewritten = lines.map(line => {
            const trimmed = line.trim();
            if (!trimmed) return line;
            if (trimmed.startsWith('#')) {
              if (trimmed.startsWith('#EXT-X-KEY') && trimmed.includes('URI="')) {
                return trimmed.replace(/URI="([^"]+)"/, (_, uri) => {
                  const abs = uri.startsWith('http') ? uri : new URL(uri, baseUrl).href;
                  return `URI="/api/proxy-stream?url=${encodeURIComponent(abs)}"`;
                });
              }
              return line;
            }
            const fullUrl = (trimmed.startsWith('http://') || trimmed.startsWith('https://'))
              ? trimmed
              : new URL(trimmed, baseUrl).href;
            return `/api/proxy-stream?url=${encodeURIComponent(fullUrl)}`;
          });
          return res.send(rewritten.join('\n'));
        }
      }

      res.setHeader('Content-Type', contentType || 'video/mp2t');
      const buffer = await response.arrayBuffer();
      return res.send(Buffer.from(buffer));
    } catch (err: any) {
      console.error('Stream Proxy Error:', err.message);
      res.status(500).send(`Stream Proxy Error: ${err.message}`);
    }
  });

  // Health & System Monitor
  app.get('/api/health', (req, res) => {
    const totalChannels = store.channels.length;
    const onlineChannels = store.channels.filter(c => c.status === 'online').length;
    const offlineChannels = store.channels.filter(c => c.status === 'offline').length;
    const reconnectingChannels = store.channels.filter(c => c.status === 'reconnecting').length;

    res.json({
      status: 'ok',
      ffmpegStatus: 'active',
      streamEngine: 'FFmpeg / HLS v7.2.1',
      database: 'Connected (Relational Engine)',
      channels: {
        total: totalChannels,
        online: onlineChannels,
        offline: offlineChannels,
        reconnecting: reconnectingChannels
      },
      stats: {
        todayPunches: store.adPunches.length,
        todayClips: store.clips.length,
        storageUsedPercent: Math.round((store.storage.usedGb / store.storage.totalGb) * 100),
        activeOperators: store.users.filter(u => u.active && u.role === 'operator').length
      },
      uptimeSec: process.uptime()
    });
  });

  // Auth & User Role
  app.get('/api/auth/current', (req, res) => {
    res.json({ user: store.currentUser, users: store.users });
  });

  app.post('/api/auth/switch-role', (req, res) => {
    const { userId } = req.body;
    const foundUser = store.users.find(u => u.id === userId);
    if (foundUser) {
      store.currentUser = foundUser;
      store.addAuditLog('USER_ROLE_SWITCH', 'User', `Switched active identity to ${foundUser.name} (${foundUser.role})`);
      res.json({ success: true, user: store.currentUser });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  });

  // Channels
  app.get('/api/channels', (req, res) => {
    res.json(store.channels);
  });

  app.post('/api/channels', (req, res) => {
    const channelData = req.body;
    const newChannel = {
      id: `ch-${Date.now()}`,
      code: channelData.code || `CH-${store.channels.length + 1}`,
      logo: channelData.logo || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=120&auto=format&fit=crop&q=80',
      resolution: channelData.resolution || '1920x1080',
      bitrate: channelData.bitrate || '6.0 Mbps',
      fps: channelData.fps || 50,
      recordingEnabled: channelData.recordingEnabled ?? true,
      retentionDays: channelData.retentionDays || 30,
      status: 'online',
      signalQuality: 95,
      audioLevel: 80,
      pinned: false,
      testPattern: 'news',
      ...channelData
    };
    store.channels.push(newChannel);
    store.addAuditLog('CREATE_CHANNEL', `Channel:${newChannel.id}`, `Added channel ${newChannel.name}`);
    res.status(201).json(newChannel);
  });

  app.put('/api/channels/:id', (req, res) => {
    const { id } = req.params;
    const idx = store.channels.findIndex(c => c.id === id);
    if (idx !== -1) {
      store.channels[idx] = { ...store.channels[idx], ...req.body };
      store.addAuditLog('UPDATE_CHANNEL', `Channel:${id}`, `Updated channel ${store.channels[idx].name}`);
      res.json(store.channels[idx]);
    } else {
      res.status(404).json({ error: 'Channel not found' });
    }
  });

  app.delete('/api/channels/:id', (req, res) => {
    const { id } = req.params;
    const idx = store.channels.findIndex(c => c.id === id);
    if (idx !== -1) {
      const deleted = store.channels.splice(idx, 1)[0];
      store.addAuditLog('DELETE_CHANNEL', `Channel:${id}`, `Deleted channel ${deleted.name}`);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Channel not found' });
    }
  });

  // Ads Master
  app.get('/api/masters/ads', (req, res) => {
    res.json(store.adMasters);
  });

  app.post('/api/masters/ads/check-duplicate', (req, res) => {
    const { brand, adName, idToIgnore } = req.body;
    const existing = store.checkAdDuplicate(brand || '', adName || '', idToIgnore);
    if (existing) {
      res.json({ isDuplicate: true, existingRecord: existing });
    } else {
      res.json({ isDuplicate: false });
    }
  });

  app.post('/api/masters/ads', (req, res) => {
    const data = req.body;
    const newAdMaster = {
      id: `ad-${Date.now()}`,
      advertiserId: data.advertiserId || `adv-${Date.now()}`,
      brand: data.brand || 'Unbranded',
      adName: data.adName || 'Untitled Commercial',
      productName: data.productName || data.adName,
      category: data.category || 'General',
      version: data.version || 'V1',
      campaignName: data.campaignName || 'General Campaign',
      targetDurationSec: Number(data.targetDurationSec) || 30,
      thumbnail: data.thumbnail || 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=300&auto=format&fit=crop&q=80',
      brandLogo: data.brandLogo || 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=100&auto=format&fit=crop&q=80',
      tags: data.tags || [],
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: data.notes || ''
    };
    store.adMasters.unshift(newAdMaster);
    store.addAuditLog('CREATE_AD_MASTER', `AdMaster:${newAdMaster.id}`, `Created master ad ${newAdMaster.brand} - ${newAdMaster.adName}`);
    res.status(201).json(newAdMaster);
  });

  app.put('/api/masters/ads/:id', (req, res) => {
    const { id } = req.params;
    const idx = store.adMasters.findIndex(a => a.id === id);
    if (idx !== -1) {
      store.adMasters[idx] = {
        ...store.adMasters[idx],
        ...req.body,
        updatedAt: new Date().toISOString()
      };
      store.addAuditLog('UPDATE_AD_MASTER', `AdMaster:${id}`, `Updated master ad ${store.adMasters[idx].brand}`);
      res.json(store.adMasters[idx]);
    } else {
      res.status(404).json({ error: 'Ad Master not found' });
    }
  });

  app.delete('/api/masters/ads/:id', (req, res) => {
    const { id } = req.params;
    const idx = store.adMasters.findIndex(a => a.id === id);
    if (idx !== -1) {
      const removed = store.adMasters.splice(idx, 1)[0];
      store.addAuditLog('DELETE_AD_MASTER', `AdMaster:${id}`, `Deleted master ad ${removed.brand} - ${removed.adName}`);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Ad Master not found' });
    }
  });

  // News Master
  app.get('/api/masters/news', (req, res) => {
    res.json(store.newsMasters);
  });

  app.post('/api/masters/news', (req, res) => {
    const data = req.body;
    const newNews = {
      id: `news-${Date.now()}`,
      newsCode: data.newsCode || `NEWS-${Date.now().toString().slice(-4)}`,
      title: data.title || 'Hourly Bulletin',
      shortTitle: data.shortTitle || data.title,
      category: data.category || 'General News',
      presenter: data.presenter || 'News Desk',
      description: data.description || '',
      defaultDurationSec: Number(data.defaultDurationSec) || 300,
      logo: data.logo || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=120&auto=format&fit=crop&q=80',
      tags: data.tags || [],
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    store.newsMasters.unshift(newNews);
    store.addAuditLog('CREATE_NEWS_MASTER', `NewsMaster:${newNews.id}`, `Created news master ${newNews.title}`);
    res.status(201).json(newNews);
  });

  app.put('/api/masters/news/:id', (req, res) => {
    const { id } = req.params;
    const idx = store.newsMasters.findIndex(n => n.id === id);
    if (idx !== -1) {
      store.newsMasters[idx] = { ...store.newsMasters[idx], ...req.body, updatedAt: new Date().toISOString() };
      store.addAuditLog('UPDATE_NEWS_MASTER', `NewsMaster:${id}`, `Updated news master ${store.newsMasters[idx].title}`);
      res.json(store.newsMasters[idx]);
    } else {
      res.status(404).json({ error: 'News Master not found' });
    }
  });

  // Programs Master
  app.get('/api/masters/programs', (req, res) => {
    res.json(store.programMasters);
  });

  app.post('/api/masters/programs', (req, res) => {
    const data = req.body;
    const newPrg = {
      id: `prg-${Date.now()}`,
      programCode: data.programCode || `PRG-${Date.now().toString().slice(-4)}`,
      name: data.name || 'Untitled Show',
      shortName: data.shortName || data.name,
      channelId: data.channelId || 'ch-1',
      channelName: data.channelName || 'PTV News HD',
      category: data.category || 'General',
      presenter: data.presenter || '',
      host: data.host || '',
      season: data.season || '2026',
      episodeFormat: data.episodeFormat || 'Standard',
      defaultDurationSec: Number(data.defaultDurationSec) || 3600,
      logo: data.logo || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=120&auto=format&fit=crop&q=80',
      thumbnail: data.thumbnail || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300&auto=format&fit=crop&q=80',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    store.programMasters.unshift(newPrg);
    store.addAuditLog('CREATE_PROGRAM_MASTER', `ProgramMaster:${newPrg.id}`, `Created program master ${newPrg.name}`);
    res.status(201).json(newPrg);
  });

  // Schedules
  app.get('/api/schedules', (req, res) => {
    res.json(store.schedules);
  });

  app.post('/api/schedules', (req, res) => {
    const data = req.body;
    const newSch = {
      id: `sch-${Date.now()}`,
      channelId: data.channelId,
      programId: data.programId,
      programName: data.programName,
      startTime: data.startTime,
      endTime: data.endTime,
      dayOfWeek: Number(data.dayOfWeek ?? -1),
      category: data.category || 'General',
      host: data.host || ''
    };
    store.schedules.push(newSch);
    store.addAuditLog('CREATE_SCHEDULE', `Schedule:${newSch.id}`, `Scheduled ${newSch.programName} on channel ${newSch.channelId}`);
    res.status(201).json(newSch);
  });

  app.delete('/api/schedules/:id', (req, res) => {
    const { id } = req.params;
    const idx = store.schedules.findIndex(s => s.id === id);
    if (idx !== -1) {
      store.schedules.splice(idx, 1);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Schedule not found' });
    }
  });

  // Punches (Ads, Programs, News)
  app.get('/api/punches/ads', (req, res) => {
    res.json(store.adPunches);
  });

  app.post('/api/punches/ads', (req, res) => {
    const data = req.body;
    const ch = store.channels.find(c => c.id === data.channelId);
    const adM = store.adMasters.find(a => a.id === data.adMasterId);

    const punchId = `punch-${Date.now()}`;
    const startTimeIso = data.startTime || new Date().toISOString();
    const endTimeIso = data.endTime || new Date().toISOString();
    const durationSec = Number(data.durationSec) || (adM ? adM.targetDurationSec : 30);

    const now = new Date();
    const tcStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}:00`;

    const newPunch: AdPunch = {
      id: punchId,
      channelId: data.channelId,
      channelName: ch ? ch.name : (data.channelName || 'TV Channel'),
      adMasterId: data.adMasterId,
      adName: adM ? adM.adName : (data.adName || 'Ad Commercial'),
      brand: adM ? adM.brand : (data.brand || 'Brand'),
      campaignName: adM ? adM.campaignName : 'Campaign 2026',
      category: adM ? adM.category : 'General',
      programId: data.programId || (ch?.currentProgramId || 'prg-1'),
      programName: data.programName || (ch?.currentProgramName || 'Live Broadcast'),
      startTime: startTimeIso,
      endTime: endTimeIso,
      durationSec,
      preRollSec: Number(data.preRollSec ?? store.settings.preRollSec),
      postRollSec: Number(data.postRollSec ?? store.settings.postRollSec),
      operatorId: store.currentUser.id,
      operatorName: store.currentUser.name,
      status: 'completed',
      timecodeStart: tcStr,
      timecodeEnd: tcStr,
      videoUrl: adM?.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnailUrl: adM?.thumbnail || 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=300&auto=format&fit=crop&q=80',
      notes: data.notes || '',
      createdAt: new Date().toISOString()
    };

    store.adPunches.unshift(newPunch);

    // Automatic Clip Creation
    const generatedClip = store.generateClipForAdPunch(newPunch);
    newPunch.clipId = generatedClip.id;

    // Update Channel lastPunchedEvent
    if (ch) {
      ch.lastPunchedEvent = `${newPunch.brand} ${newPunch.adName} (${newPunch.durationSec}s)`;
    }

    store.addAuditLog('PUNCH_AD', `AdPunch:${punchId}`, `Punched ${newPunch.brand} - ${newPunch.adName} on ${newPunch.channelName}`);

    res.status(201).json({
      punch: newPunch,
      generatedClip
    });
  });

  // Program Punch
  app.post('/api/punches/programs', (req, res) => {
    const data = req.body;
    const ch = store.channels.find(c => c.id === data.channelId);
    const prgM = store.programMasters.find(p => p.id === data.programMasterId);

    const punch = {
      id: `prg-punch-${Date.now()}`,
      channelId: data.channelId,
      channelName: ch ? ch.name : 'Channel',
      programMasterId: data.programMasterId,
      programName: prgM ? prgM.name : 'Program',
      startTime: data.startTime || new Date().toISOString(),
      endTime: data.endTime || new Date().toISOString(),
      durationSec: Number(data.durationSec) || 3600,
      operatorId: store.currentUser.id,
      operatorName: store.currentUser.name,
      notes: data.notes || '',
      createdAt: new Date().toISOString()
    };

    store.programPunches.unshift(punch);
    if (ch && prgM) {
      ch.currentProgramId = prgM.id;
      ch.currentProgramName = prgM.name;
    }
    store.addAuditLog('PUNCH_PROGRAM', `ProgramPunch:${punch.id}`, `Punched program ${punch.programName}`);
    res.status(201).json(punch);
  });

  // News Punch
  app.post('/api/punches/news', (req, res) => {
    const data = req.body;
    const ch = store.channels.find(c => c.id === data.channelId);
    const newsM = store.newsMasters.find(n => n.id === data.newsMasterId);

    const punch = {
      id: `news-punch-${Date.now()}`,
      channelId: data.channelId,
      channelName: ch ? ch.name : 'Channel',
      newsMasterId: data.newsMasterId,
      newsTitle: newsM ? newsM.title : 'News Bulletin',
      category: newsM ? newsM.category : 'News',
      presenter: newsM ? newsM.presenter : 'Presenter',
      startTime: data.startTime || new Date().toISOString(),
      endTime: data.endTime || new Date().toISOString(),
      durationSec: Number(data.durationSec) || 300,
      operatorId: store.currentUser.id,
      operatorName: store.currentUser.name,
      notes: data.notes || '',
      createdAt: new Date().toISOString()
    };

    store.newsPunches.unshift(punch);
    store.addAuditLog('PUNCH_NEWS', `NewsPunch:${punch.id}`, `Punched news bulletin ${punch.newsTitle}`);
    res.status(201).json(punch);
  });

  // Clips Library
  app.get('/api/clips', (req, res) => {
    res.json(store.clips);
  });

  app.patch('/api/clips/:id/protect', (req, res) => {
    const { id } = req.params;
    const clip = store.clips.find(c => c.id === id);
    if (clip) {
      clip.protected = !clip.protected;
      store.addAuditLog('TOGGLE_CLIP_PROTECTION', `Clip:${id}`, `Protection status changed to ${clip.protected}`);
      res.json(clip);
    } else {
      res.status(404).json({ error: 'Clip not found' });
    }
  });

  app.delete('/api/clips/:id', (req, res) => {
    const { id } = req.params;
    const idx = store.clips.findIndex(c => c.id === id);
    if (idx !== -1) {
      const clip = store.clips[idx];
      if (clip.protected) {
        return res.status(403).json({ error: 'Clip is protected from deletion.' });
      }
      store.clips.splice(idx, 1);
      store.addAuditLog('DELETE_CLIP', `Clip:${id}`, `Deleted clip ${clip.title}`);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Clip not found' });
    }
  });

  // Analytics & Reports
  app.get('/api/reports/analytics', (req, res) => {
    // Brand frequency
    const brandCounts: Record<string, { spots: number; totalSec: number }> = {};
    store.adPunches.forEach(p => {
      if (!brandCounts[p.brand]) {
        brandCounts[p.brand] = { spots: 0, totalSec: 0 };
      }
      brandCounts[p.brand].spots += 1;
      brandCounts[p.brand].totalSec += p.durationSec;
    });

    const brandAnalytics = Object.entries(brandCounts).map(([brand, stat]) => ({
      brand,
      spots: stat.spots,
      totalDurationMin: Number((stat.totalSec / 60).toFixed(1))
    }));

    // Channel occurrences
    const channelCounts: Record<string, number> = {};
    store.adPunches.forEach(p => {
      channelCounts[p.channelName] = (channelCounts[p.channelName] || 0) + 1;
    });

    const channelAnalytics = Object.entries(channelCounts).map(([channel, spots]) => ({
      channel,
      spots
    }));

    res.json({
      totalPunches: store.adPunches.length,
      brandAnalytics,
      channelAnalytics,
      totalAdSeconds: store.adPunches.reduce((acc, p) => acc + p.durationSec, 0)
    });
  });

  // Audit Logs
  app.get('/api/audit-logs', (req, res) => {
    res.json(store.auditLogs);
  });

  // System Alerts
  app.get('/api/alerts', (req, res) => {
    res.json(store.alerts);
  });

  app.post('/api/alerts/:id/ack', (req, res) => {
    const { id } = req.params;
    const alert = store.alerts.find(a => a.id === id);
    if (alert) {
      alert.acknowledged = true;
      res.json(alert);
    } else {
      res.status(404).json({ error: 'Alert not found' });
    }
  });

  // Storage
  app.get('/api/storage', (req, res) => {
    res.json(store.storage);
  });

  app.post('/api/storage/cleanup', (req, res) => {
    const countBefore = store.clips.length;
    // Keep protected clips, purge oldest unprotected clips if > 100
    const protectedClips = store.clips.filter(c => c.protected);
    const unprotectedClips = store.clips.filter(c => !c.protected);
    const keptUnprotected = unprotectedClips.slice(0, 50);

    store.clips = [...protectedClips, ...keptUnprotected];
    const purged = countBefore - store.clips.length;

    store.storage.usedGb = Math.max(100, Number((store.storage.usedGb - purged * 0.015).toFixed(1)));
    store.addAuditLog('STORAGE_CLEANUP', 'Storage', `Purged ${purged} unprotected clips. Used space updated.`);

    res.json({ success: true, purgedClipsCount: purged, storage: store.storage });
  });

  // Settings
  app.get('/api/settings', (req, res) => {
    res.json(store.settings);
  });

  app.post('/api/settings', (req, res) => {
    store.settings = { ...store.settings, ...req.body };
    store.addAuditLog('UPDATE_SETTINGS', 'Settings', 'Updated monitoring shortcut keys & pre/post-roll presets');
    res.json(store.settings);
  });

  // Channels FFmpeg Worker Status & Control
  app.post('/api/channels/:id/worker/restart', (req, res) => {
    const { id } = req.params;
    const result = store.restartChannelWorker(id);
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  });

  // Continuous 24h Recordings
  app.get('/api/recordings', (req, res) => {
    const { channelId } = req.query;
    if (channelId) {
      const filtered = store.recordingSegments.filter(s => s.channelId === String(channelId));
      return res.json(filtered);
    }
    res.json(store.recordingSegments);
  });

  // Commercial Breaks (grouped punches)
  app.get('/api/commercial-breaks', (req, res) => {
    const { channelId } = req.query;
    const cBreaks = store.getCommercialBreaks(channelId ? String(channelId) : undefined);
    res.json(cBreaks);
  });

  // FFprobe Media Metadata Probe
  app.post('/api/media/probe', (req, res) => {
    const { videoUrl } = req.body;
    if (!videoUrl) {
      return res.status(400).json({ error: 'videoUrl is required' });
    }
    const metadata = store.probeMediaMetadata(videoUrl);
    res.json(metadata);
  });

  // Manual FFmpeg Clip Slicing Endpoint
  app.post('/api/clips/slice', (req, res) => {
    const { channelId, startTime, endTime, title, preRollSec, postRollSec, brandOrHost } = req.body;
    const ch = store.channels.find(c => c.id === channelId);
    if (!ch) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    const start = new Date(startTime || Date.now() - 30000);
    const end = new Date(endTime || Date.now());
    const durationSec = Math.max(5, Math.round((end.getTime() - start.getTime()) / 1000));
    const preRoll = Number(preRollSec ?? store.settings.preRollSec);
    const postRoll = Number(postRollSec ?? store.settings.postRollSec);
    const totalDuration = durationSec + preRoll + postRoll;

    const clipId = `clip-slice-${Date.now()}`;
    const yearStr = start.getFullYear();
    const monthStr = String(start.getMonth() + 1).padStart(2, '0');
    const dayStr = String(start.getDate()).padStart(2, '0');
    const filePath = `/storage/clips/${yearStr}/${monthStr}/${dayStr}/${clipId}.mp4`;

    const newClip = {
      id: clipId,
      type: 'ad' as const,
      channelId: ch.id,
      channelName: ch.name,
      title: title || `Custom Cut - ${ch.name} (${totalDuration}s)`,
      brandOrHost: brandOrHost || 'Manual Slice',
      durationSec: totalDuration,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      fileUrl: ch.streamUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      thumbnailUrl: ch.logo || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=300&auto=format&fit=crop&q=80',
      fileSizeMb: Number((totalDuration * 0.45).toFixed(1)),
      protected: false,
      createdBy: store.currentUser.name,
      createdAt: new Date().toISOString()
    };

    store.clips.unshift(newClip);
    store.addAuditLog('FFMPEG_SLICE_CLIP', `Clip:${clipId}`, `Sliced ${totalDuration}s clip from ${ch.name} [${filePath}]`);
    res.status(201).json({ clip: newClip, filePath });
  });

  // Copy Program Schedules
  app.post('/api/schedules/copy-day', (req, res) => {
    const { fromDay, toDay, channelId } = req.body;
    const sourceSchedules = store.schedules.filter(
      s => (channelId ? s.channelId === channelId : true) && s.dayOfWeek === Number(fromDay)
    );

    let count = 0;
    sourceSchedules.forEach(src => {
      const newSch = {
        ...src,
        id: `sch-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        dayOfWeek: Number(toDay)
      };
      store.schedules.push(newSch);
      count++;
    });

    store.addAuditLog('COPY_SCHEDULE', 'Schedule', `Copied ${count} schedule entries from day ${fromDay} to day ${toDay}`);
    res.json({ success: true, copiedCount: count });
  });

  // CSV Report Exporter
  app.get('/api/reports/export', (req, res) => {
    const type = req.query.type || 'ads';

    if (type === 'ads') {
      const header = 'Punch ID,Channel,Brand,Ad Name,Campaign,Category,Program,Start Time,End Time,Duration (s),Operator,Status,Timecode\n';
      const rows = store.adPunches.map(p => 
        `"${p.id}","${p.channelName}","${p.brand}","${p.adName}","${p.campaignName}","${p.category}","${p.programName}","${p.startTime}","${p.endTime}",${p.durationSec},"${p.operatorName}","${p.status}","${p.timecodeStart}"`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="ad_monitoring_report.csv"');
      return res.send(header + rows);
    }

    if (type === 'audit') {
      const header = 'Log ID,User,Role,Action,Entity,Details,IP,Timestamp\n';
      const rows = store.auditLogs.map(l =>
        `"${l.id}","${l.userName}","${l.role}","${l.action}","${l.entity}","${l.details.replace(/"/g, '""')}","${l.ip}","${l.timestamp}"`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="audit_log_report.csv"');
      return res.send(header + rows);
    }

    res.json({ error: 'Unsupported report type' });
  });

  // Backup
  app.get('/api/backup/export', (req, res) => {
    res.json({
      exportDate: new Date().toISOString(),
      channels: store.channels,
      adMasters: store.adMasters,
      newsMasters: store.newsMasters,
      programMasters: store.programMasters,
      schedules: store.schedules,
      adPunches: store.adPunches,
      clips: store.clips,
      settings: store.settings
    });
  });

  // Vite middleware for development vs static production serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[TeleMonitor Pro] Broadcast server running at http://localhost:${PORT}`);
  });
}

startServer();
