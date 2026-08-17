import React, { useState, useEffect } from 'react';
import { User, SystemAlert } from '../types';
import { Tv, Clock, Bell, Shield, UserCheck, HardDrive, Download, Settings, Grid, Layers } from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  users: User[];
  alerts: SystemAlert[];
  gridLayout: number;
  onGridLayoutChange: (layout: number) => void;
  onRoleSwitch: (userId: string) => void;
  onOpenSettings: () => void;
  onOpenAlerts: () => void;
  onExportBackup: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  users,
  alerts,
  gridLayout,
  onGridLayoutChange,
  onRoleSwitch,
  onOpenSettings,
  onOpenAlerts,
  onExportBackup
}) => {
  const [timecode, setTimecode] = useState('');
  const unackAlertsCount = alerts.filter(a => !a.acknowledged).length;

  // Timecode generator
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      const ff = String(Math.floor((now.getMilliseconds() / 1000) * 50)).padStart(2, '0');
      setTimecode(`${hh}:${mm}:${ss}:${ff}`);
    }, 40);

    return () => clearInterval(timer);
  }, []);

  const gridOptions = [1, 2, 4, 6, 9, 12];

  return (
    <header className="bg-[#16161a] border-b border-[#222225] text-[#e1e1e1] px-4 py-2.5 flex items-center justify-between sticky top-0 z-40 shadow-2xl">
      {/* Brand & Tally Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg.111113 bg-[#111113] border border-[#222225] px-3 py-1.5 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-orange-600/20 text-orange-500 flex items-center justify-center font-black shadow-md border border-orange-500/30">
            <Tv className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <div className="font-extrabold tracking-wider text-sm flex items-center gap-2 text-zinc-100">
              TELEMONITOR <span className="text-orange-500 font-mono text-xs font-bold">PRO</span>
            </div>
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              BROADCAST CONTROL ROOM
            </div>
          </div>
        </div>

        {/* Master Timecode Box */}
        <div className="hidden lg:flex items-center gap-2.5 bg-[#111113] border border-[#222225] px-3.5 py-1.5 rounded-xl text-xs font-mono">
          <Clock className="w-3.5 h-3.5 text-orange-500" />
          <span className="text-zinc-500 uppercase text-[10px] font-bold tracking-widest">System Time</span>
          <span className="text-orange-400 font-bold text-sm tracking-wider">{timecode || '00:00:00:00'}</span>
        </div>
      </div>

      {/* Center Grid Selector Controls */}
      <div className="hidden md:flex items-center gap-1 bg-[#111113] p-1 rounded-xl border border-[#222225]">
        <span className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase px-2 flex items-center gap-1">
          <Grid className="w-3.5 h-3.5 text-zinc-500" /> GRID
        </span>
        {gridOptions.map(num => (
          <button
            key={num}
            onClick={() => onGridLayoutChange(num)}
            className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-all ${
              gridLayout === num
                ? 'bg-orange-600 text-white shadow-md shadow-orange-950/40'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {num}
          </button>
        ))}
      </div>

      {/* Right User Role, Alerts, Settings & Export */}
      <div className="flex items-center gap-2">
        {/* System Alerts */}
        <button
          onClick={onOpenAlerts}
          className="relative bg-[#111113] hover:bg-white/5 border border-[#222225] text-zinc-300 p-2 rounded-xl transition-colors"
          title="System Alerts Center"
        >
          <Bell className="w-4 h-4 text-zinc-300" />
          {unackAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-bounce shadow-md shadow-red-950">
              {unackAlertsCount}
            </span>
          )}
        </button>

        {/* Backup Export */}
        <button
          onClick={onExportBackup}
          className="hidden sm:flex items-center gap-1.5 bg-[#111113] hover:bg-white/5 border border-[#222225] text-zinc-300 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
          title="Export Database Snapshot"
        >
          <Download className="w-3.5 h-3.5 text-orange-400" />
          <span>Backup</span>
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="bg-[#111113] hover:bg-white/5 border border-[#222225] text-zinc-300 p-2 rounded-xl transition-colors"
          title="System Settings & Shortcut Remap"
        >
          <Settings className="w-4 h-4 text-zinc-300" />
        </button>

        {/* Role Selector Dropdown */}
        <div className="flex items-center gap-2 bg-[#111113] border border-[#222225] px-3 py-1.5 rounded-xl">
          <Shield className="w-4 h-4 text-orange-400" />
          <select
            value={currentUser.id}
            onChange={e => onRoleSwitch(e.target.value)}
            className="bg-transparent text-xs text-zinc-200 font-medium focus:outline-none cursor-pointer"
          >
            {users.map(u => (
              <option key={u.id} value={u.id} className="bg-[#111113] text-zinc-200">
                {u.name} ({(u.role || '').toUpperCase()})
              </option>
            ))}
          </select>
          <span
            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
              currentUser.role === 'admin'
                ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                : currentUser.role === 'supervisor'
                ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                : currentUser.role === 'operator'
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {currentUser.role}
          </span>
        </div>
      </div>
    </header>
  );
};
