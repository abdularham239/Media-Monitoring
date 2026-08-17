import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Channel } from '../types';
import { Play, Pause, Volume2, VolumeX, Maximize2, Radio, AlertTriangle, RefreshCw, Pin, Eye, Link, Settings, CheckCircle2, Tv, Globe, X } from 'lucide-react';

interface BroadcastPlayerProps {
  channel: Channel;
  isFocused?: boolean;
  onFocus?: () => void;
  onPinToggle?: () => void;
  onPunchClick?: (channel: Channel) => void;
  onUpdateChannel?: (id: string, c: Partial<Channel>) => void;
}

function getYouTubeEmbedUrl(url: string | undefined): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  if (match && match[1]) {
    return `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1&controls=1&enablejsapi=1`;
  }
  return null;
}

export const BroadcastPlayer: React.FC<BroadcastPlayerProps> = ({
  channel,
  isFocused = false,
  onFocus,
  onPinToggle,
  onPunchClick,
  onUpdateChannel
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [vuLevel, setVuLevel] = useState(channel.audioLevel);
  const containerRef = useRef<HTMLDivElement>(null);

  // Stream Link Connector Modal State
  const [isStreamModalOpen, setIsStreamModalOpen] = useState(false);
  const [inputUrl, setInputUrl] = useState(channel.streamUrl || '');
  const [inputStreamType, setInputStreamType] = useState<'hls' | 'rtmp' | 'srt' | 'http' | 'demo'>(channel.streamType || 'hls');
  const [testSuccess, setTestSuccess] = useState(false);

  // YouTube Embed Check
  const ytEmbedUrl = getYouTubeEmbedUrl(channel.streamUrl);

  // Check if current streamUrl is an HLS or playable video stream
  const isHlsStream = Boolean(channel.streamUrl?.includes('.m3u8') || channel.streamType === 'hls');
  const isDirectVideo = Boolean(
    channel.streamUrl && 
    (channel.streamUrl.endsWith('.mp4') || 
     channel.streamUrl.endsWith('.webm') || 
     channel.streamUrl.includes('gtv-videos-bucket') || 
     channel.streamType === 'http' ||
     isHlsStream ||
     ytEmbedUrl)
  );

  // HLS.js Live Stream & Media Loader
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !channel.streamUrl || ytEmbedUrl) return;

    let hls: Hls | null = null;
    let attemptedProxy = false;
    const streamSource = channel.streamUrl;

    if (isHlsStream) {
      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          manifestLoadingTimeOut: 10000,
        });

        const isHttpOrIp = streamSource.startsWith('http://') || Boolean(streamSource.match(/\d+\.\d+\.\d+\.\d+/));
        const initialUrl = isHttpOrIp ? `/api/proxy-stream?url=${encodeURIComponent(streamSource)}` : streamSource;

        hls.loadSource(initialUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (isPlaying) video.play().catch(() => {});
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            if (!attemptedProxy && !initialUrl.includes('/api/proxy-stream')) {
              attemptedProxy = true;
              console.warn('Direct stream failed. Switching to backend proxy for:', streamSource);
              hls?.loadSource(`/api/proxy-stream?url=${encodeURIComponent(streamSource)}`);
            } else {
              hls?.startLoad();
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        const isHttpOrIp = streamSource.startsWith('http://') || Boolean(streamSource.match(/\d+\.\d+\.\d+\.\d+/));
        video.src = isHttpOrIp ? `/api/proxy-stream?url=${encodeURIComponent(streamSource)}` : streamSource;
        if (isPlaying) video.play().catch(() => {});
      }
    } else {
      const isHttpOrIp = streamSource.startsWith('http://') || Boolean(streamSource.match(/\d+\.\d+\.\d+\.\d+/));
      video.src = isHttpOrIp ? `/api/proxy-stream?url=${encodeURIComponent(streamSource)}` : streamSource;
      if (isPlaying) video.play().catch(() => {});
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [channel.streamUrl, channel.streamType, isPlaying, isHlsStream, ytEmbedUrl]);

  // Preset News Streams & Test Streams
  const STREAM_PRESETS = [
    { name: 'Mux HLS Test Stream', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', type: 'hls' as const, resolution: '1080p60' },
    { name: 'Geo News Live (YouTube Feed)', url: 'https://www.youtube.com/watch?v=s48A962m_oE', type: 'http' as const, resolution: '1080p60' },
    { name: 'ARY News Live (YouTube Feed)', url: 'https://www.youtube.com/watch?v=5_X42vVj50E', type: 'http' as const, resolution: '1080p60' },
    { name: 'Express News HD (Tears of Steel)', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', type: 'http' as const, resolution: '1080p60' },
    { name: 'Sintel HD Video Feed', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', type: 'http' as const, resolution: '1080p60' },
    { name: 'Tears of Steel Unified HLS', url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8', type: 'hls' as const, resolution: '1080p50' },
    { name: 'Big Buck Bunny MP4 Feed', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', type: 'http' as const, resolution: '720p30' }
  ];

  // Timecode animation & canvas generation for simulated live stream
  useEffect(() => {
    let animFrame: number;
    const canvas = canvasRef.current;
    if (!canvas || isDirectVideo) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameCount = 0;

    const render = () => {
      frameCount++;
      const w = canvas.width;
      const h = canvas.height;

      // Dynamic Audio VU Fluctuation
      if (channel.status === 'online') {
        const jitter = Math.sin(frameCount * 0.1) * 15 + (Math.random() * 8 - 4);
        setVuLevel(Math.min(100, Math.max(10, Math.round(channel.audioLevel + jitter))));
      } else {
        setVuLevel(5);
      }

      // Background rendering based on status & testPattern
      if (channel.status === 'offline' || channel.status === 'reconnecting') {
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, w, h);

        // Signal Loss Noise / Static
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          const noise = Math.random() * 40;
          data[i] = noise;
          data[i + 1] = noise;
          data[i + 2] = noise;
          data[i + 3] = 255;
        }
        ctx.putImageData(imgData, 0, 0);

        // Warning Overlay
        ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
        ctx.fillRect(w / 2 - 140, h / 2 - 30, 280, 60);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(channel.status === 'reconnecting' ? 'SIGNAL LOSS - RECONNECTING...' : 'CHANNEL OFFLINE', w / 2, h / 2 + 5);
      } else {
        // Render Live Simulated TV Stream Pattern
        const time = frameCount * 0.03;

        if (channel.testPattern === 'colorbars') {
          const colors = ['#ffffff', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0'];
          const barW = w / colors.length;
          colors.forEach((col, idx) => {
            ctx.fillStyle = col;
            ctx.fillRect(idx * barW, 0, barW, h * 0.75);
          });
          // Bottom sync bars
          ctx.fillStyle = '#00214c';
          ctx.fillRect(0, h * 0.75, w, h * 0.25);
        } else {
          // Dynamic Motion TV Visual
          const gradient = ctx.createLinearGradient(0, 0, w, h);
          if (channel.testPattern === 'news') {
            gradient.addColorStop(0, '#0f172a');
            gradient.addColorStop(0.5, '#1e293b');
            gradient.addColorStop(1, '#0f172a');
          } else if (channel.testPattern === 'sports') {
            gradient.addColorStop(0, '#022c22');
            gradient.addColorStop(0.5, '#065f46');
            gradient.addColorStop(1, '#022c22');
          } else {
            gradient.addColorStop(0, '#31124b');
            gradient.addColorStop(0.5, '#581c87');
            gradient.addColorStop(1, '#1e1b4b');
          }
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, w, h);

          // Animated Grid Graphics & Studio Waveform
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.lineWidth = 1;
          for (let x = 0; x < w; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
          }

          // Live Center Graphic / Ticker Motion
          ctx.save();
          ctx.translate(w / 2, h / 2 - 10);
          ctx.beginPath();
          ctx.arc(0, 0, 45 + Math.sin(time) * 5, 0, Math.PI * 2);
          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = 3;
          ctx.stroke();

          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 15px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(channel.code, 0, 5);
          ctx.restore();

          // Commercial Break Overlay if active
          if (channel.commercialBreakActive) {
            ctx.fillStyle = 'rgba(245, 158, 11, 0.9)';
            ctx.fillRect(w - 180, 15, 160, 28);
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('● COMMERCIAL BREAK', w - 100, 33);
          }
        }

        // Ticker Bar at Bottom
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.fillRect(0, h - 28, w, 28);

        // Animated Ticker Text
        ctx.fillStyle = '#f97316';
        ctx.fillRect(0, h - 28, 70, 28);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('LIVE NOW', 35, h - 10);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'left';
        const tickerX = (w - (frameCount * 2) % (w + 400));
        ctx.fillText(`NEWS TRANSMISSION: ${channel.currentProgramName || 'Live Bulletin'}  |  STREAM: ${(channel.streamType || 'hls').toUpperCase()} (${channel.resolution || '1080p60'})  |  SIGNAL: ${channel.signalQuality ?? 95}%`, tickerX, h - 10);

        // Burned-in Timecode Top Right
        const now = new Date();
        const timecode = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}:${String(Math.floor((now.getMilliseconds() / 1000) * channel.fps)).padStart(2, '0')}`;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(10, 10, 125, 22);
        ctx.fillStyle = '#4ade80';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(timecode, 18, 26);
      }

      if (isPlaying) {
        animFrame = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, [isPlaying, channel, isDirectVideo]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleSaveStreamUrl = () => {
    if (!inputUrl.trim()) return;
    const isYt = getYouTubeEmbedUrl(inputUrl);
    const isHls = inputUrl.includes('.m3u8');
    const autoType = isYt ? 'http' : isHls ? 'hls' : inputStreamType;

    if (onUpdateChannel) {
      onUpdateChannel(channel.id, {
        streamUrl: inputUrl,
        streamType: autoType as any,
        status: 'online',
        signalQuality: 98
      });
    }
    setTestSuccess(true);
    setTimeout(() => {
      setTestSuccess(false);
      setIsStreamModalOpen(false);
    }, 1200);
  };

  return (
    <div
      ref={containerRef}
      className={`relative group bg-[#111113] border rounded-2xl overflow-hidden flex flex-col transition-all duration-200 ${
        isFocused ? 'ring-2 ring-orange-500 border-orange-500 shadow-xl shadow-orange-950/40' : 'border-[#222225] hover:border-zinc-700'
      }`}
    >
      {/* Top Stream Header */}
      <div className="bg-[#16161a] px-3.5 py-2 flex items-center justify-between border-b border-[#222225] text-xs text-zinc-300 select-none">
        <div className="flex items-center gap-2 overflow-hidden">
          {/* Tally Light */}
          <span
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              channel.status === 'online'
                ? channel.recordingEnabled
                  ? 'bg-red-500 animate-pulse shadow-sm shadow-red-500'
                  : 'bg-emerald-500'
                : channel.status === 'reconnecting'
                ? 'bg-orange-500 animate-ping'
                : 'bg-zinc-600'
            }`}
            title={channel.recordingEnabled ? 'LIVE & RECORDING' : (channel.status || 'online').toUpperCase()}
          />
          <span className="font-bold text-zinc-100 truncate">{channel.name}</span>
          <span className="bg-[#111113] text-zinc-400 border border-[#222225] px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0">
            {channel.code}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Stream Type / Link Status Badge */}
          <button
            onClick={() => {
              setInputUrl(channel.streamUrl || '');
              setInputStreamType(channel.streamType || 'hls');
              setIsStreamModalOpen(true);
            }}
            className="bg-orange-600/10 hover:bg-orange-600/20 border border-orange-500/30 text-orange-400 px-2 py-0.5 rounded-lg text-[10px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
            title="Click to change Live Stream URL / Connect News Feed"
          >
            <Link className="w-3 h-3 text-orange-500" />
            <span className="hidden sm:inline">{(channel.streamType || 'hls').toUpperCase()} CONNECTED</span>
          </button>

          <span className="text-[11px] text-zinc-400 font-mono hidden md:inline">{channel.resolution}</span>
          
          <button
            onClick={onPinToggle}
            className={`p-1 rounded hover:bg-white/5 ${channel.pinned ? 'text-orange-400' : 'text-zinc-500'}`}
            title={channel.pinned ? 'Unpin Channel' : 'Pin Channel'}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>

          {onFocus && (
            <button
              onClick={onFocus}
              className="p-1 rounded hover:bg-white/5 text-zinc-400 hover:text-orange-400"
              title="Focus View"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Video Canvas / Video Screen */}
      <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
        {ytEmbedUrl ? (
          <iframe
            src={ytEmbedUrl}
            title={channel.name}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : isDirectVideo ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            loop
            muted={isMuted}
            className="w-full h-full object-cover"
          />
        ) : (
          <canvas
            ref={canvasRef}
            width={640}
            height={360}
            className="w-full h-full object-contain"
          />
        )}

        {/* Audio VU Meter Bar on Left Side */}
        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 h-28 w-2 bg-black/80 rounded border border-[#222225] overflow-hidden flex flex-col justify-end p-0.5 pointer-events-none">
          <div
            className={`w-full rounded-sm transition-all duration-75 ${
              vuLevel > 88 ? 'bg-red-500' : vuLevel > 70 ? 'bg-orange-400' : 'bg-emerald-400'
            }`}
            style={{ height: `${vuLevel}%` }}
          />
        </div>

        {/* Quick Overlay Action Bar on Hover */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex flex-col justify-between p-3 pointer-events-none">
          <div className="flex justify-between items-start pointer-events-auto">
            <span className="bg-[#111113]/90 text-zinc-200 text-[11px] px-2.5 py-1 rounded-lg border border-[#222225] font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Signal: <strong className={channel.signalQuality > 80 ? 'text-emerald-400' : 'text-orange-400'}>{channel.signalQuality}%</strong>
            </span>

            {onPunchClick && (
              <button
                onClick={() => onPunchClick(channel)}
                className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-3 py-1.5 rounded-xl shadow-lg shadow-orange-950/50 flex items-center gap-1.5 text-xs transition-transform active:scale-95 cursor-pointer"
              >
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                PUNCH AD NOW
              </button>
            )}
          </div>

          <div className="flex items-center justify-between pointer-events-auto bg-[#16161a]/90 p-1.5 rounded-xl border border-[#222225]">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="text-zinc-300 hover:text-white p-1 cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-zinc-300 hover:text-white p-1 cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-zinc-500" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>
              <button
                onClick={() => setIsStreamModalOpen(true)}
                className="text-orange-400 hover:text-orange-300 p-1 font-mono text-[11px] flex items-center gap-1 bg-orange-600/10 px-2 rounded-lg border border-orange-500/20 cursor-pointer"
              >
                <Link className="w-3 h-3" /> STREAM LINK
              </button>
            </div>

            <button
              onClick={toggleFullscreen}
              className="text-zinc-300 hover:text-white p-1 cursor-pointer"
              title="Full Screen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer Details: Current Program & Stream URL Preview */}
      <div className="bg-[#16161a] px-3.5 py-2 border-t border-[#222225] text-xs flex items-center justify-between text-zinc-400">
        <div className="truncate pr-2">
          <span className="text-zinc-500 uppercase text-[10px] block font-bold tracking-widest">Live Show / Program</span>
          <span className="text-zinc-200 font-medium truncate block">
            {channel.currentProgramName || 'Live Broadcast Transmission'}
          </span>
        </div>

        <div className="text-right shrink-0">
          <span className="text-zinc-500 uppercase text-[10px] block font-bold tracking-widest">Stream Source Link</span>
          <span className="text-orange-400 font-mono text-[10px] truncate max-w-[140px] block" title={channel.streamUrl}>
            {channel.streamUrl || 'https://live-feed.telemonitor.com/hls/primary.m3u8'}
          </span>
        </div>
      </div>

      {/* Stream Link Connection Modal */}
      {isStreamModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#16161a] border border-[#222225] rounded-2xl max-w-lg w-full p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#222225] pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-orange-500" />
                <h3 className="font-extrabold text-zinc-100 text-sm">CONNECT STREAM LINK — {channel.name}</h3>
              </div>
              <button
                onClick={() => setIsStreamModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {testSuccess && (
              <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-300 p-2.5 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Stream Link Connected & Updated Successfully!</span>
              </div>
            )}

            {/* URL Input Form */}
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-1">
                  LIVE STREAM / NEWS FEED URL (HLS .m3u8 / MP4 / RTSP)
                </label>
                <input
                  type="text"
                  value={inputUrl}
                  onChange={e => setInputUrl(e.target.value)}
                  placeholder="https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
                  className="w-full bg-[#111113] text-zinc-100 p-2.5 border border-[#222225] rounded-xl text-xs font-mono focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-1">
                  STREAM PROTOCOL / TYPE
                </label>
                <select
                  value={inputStreamType}
                  onChange={e => setInputStreamType(e.target.value as any)}
                  className="w-full bg-[#111113] text-zinc-100 p-2.5 border border-[#222225] rounded-xl text-xs focus:border-orange-500 focus:outline-none font-mono"
                >
                  <option value="hls">HLS (HTTP Live Streaming .m3u8)</option>
                  <option value="http">HTTP Video / MP4 File Direct Link</option>
                  <option value="rtmp">RTMP Push Stream</option>
                  <option value="srt">SRT Secure Reliable Transport</option>
                  <option value="demo">Demo Test Pattern</option>
                </select>
              </div>

              {/* News Stream Presets */}
              <div>
                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-1.5">
                  POPULAR NEWS STREAM PRESETS
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {STREAM_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setInputUrl(preset.url);
                        setInputStreamType(preset.type);
                      }}
                      className="text-left bg-[#111113] hover:bg-white/5 border border-[#222225] hover:border-orange-500/50 p-2 rounded-xl text-xs cursor-pointer transition-colors"
                    >
                      <div className="font-bold text-orange-400 text-[11px] truncate">{preset.name}</div>
                      <div className="text-[9px] text-zinc-500 font-mono truncate">{(preset.type || 'hls').toUpperCase()} • {preset.resolution}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222225]">
              <button
                type="button"
                onClick={() => setIsStreamModalOpen(false)}
                className="bg-[#111113] hover:bg-white/5 text-zinc-300 border border-[#222225] font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveStreamUrl}
                className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                CONNECT STREAM LINK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

