import React, { useState } from 'react';
import { AdPunch, ClipItem, Channel } from '../types';
import { BarChart2, Download, FileText, Filter, Calendar, Tv, Tag, UserCheck, TrendingUp, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

interface BroadcastReportsProps {
  adPunches: AdPunch[];
  clips: ClipItem[];
  channels: Channel[];
}

export const BroadcastReports: React.FC<BroadcastReportsProps> = ({
  adPunches,
  clips,
  channels
}) => {
  const [activeTab, setActiveTab] = useState<'ads' | 'programs' | 'channels' | 'operators'>('ads');
  const [dateRange, setDateRange] = useState('7d');
  const [selectedChannel, setSelectedChannel] = useState('all');

  // Compute Brand Statistics
  const brandStatsMap: Record<string, { brand: string; spots: number; totalSec: number; lastAired: string }> = {};
  adPunches.forEach(p => {
    if (!brandStatsMap[p.brand]) {
      brandStatsMap[p.brand] = { brand: p.brand, spots: 0, totalSec: 0, lastAired: p.createdAt };
    }
    brandStatsMap[p.brand].spots += 1;
    brandStatsMap[p.brand].totalSec += p.durationSec;
    if (new Date(p.createdAt) > new Date(brandStatsMap[p.brand].lastAired)) {
      brandStatsMap[p.brand].lastAired = p.createdAt;
    }
  });

  const brandChartData = Object.values(brandStatsMap).map(b => ({
    brand: b.brand,
    spots: b.spots,
    totalMinutes: Number((b.totalSec / 60).toFixed(1))
  }));

  // Compute Channel Statistics
  const channelStatsMap: Record<string, { channel: string; spots: number; totalSec: number }> = {};
  adPunches.forEach(p => {
    if (!channelStatsMap[p.channelName]) {
      channelStatsMap[p.channelName] = { channel: p.channelName, spots: 0, totalSec: 0 };
    }
    channelStatsMap[p.channelName].spots += 1;
    channelStatsMap[p.channelName].totalSec += p.durationSec;
  });

  const channelChartData = Object.values(channelStatsMap);

  // Export CSV Report Helper
  const handleExportCSV = () => {
    let headers = '';
    let rows: string[] = [];

    if (activeTab === 'ads') {
      headers = 'Punch ID,Date Time,Channel,Brand,Ad Name,Campaign,Program,Duration (sec),Operator\n';
      rows = adPunches.map(
        p => `"${p.id}","${p.createdAt}","${p.channelName}","${p.brand}","${p.adName}","${p.campaignName}","${p.programName}",${p.durationSec},"${p.operatorName}"`
      );
    } else if (activeTab === 'channels') {
      headers = 'Channel Name,Monitored Status,Total Ad Spots,Total Ad Duration (min),Signal Quality\n';
      rows = channels.map(c => {
        const stat = channelStatsMap[c.name] || { spots: 0, totalSec: 0 };
        return `"${c.name}","${c.status}",${stat.spots},${(stat.totalSec / 60).toFixed(1)},${c.signalQuality}%`;
      });
    } else {
      headers = 'Brand,Total Spots,Total Duration (min),Last Airing Date\n';
      rows = Object.values(brandStatsMap).map(
        b => `"${b.brand}",${b.spots},${(b.totalSec / 60).toFixed(1)},"${b.lastAired}"`
      );
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + headers + rows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Broadcast_Report_${activeTab}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const COLORS = ['#f59e0b', '#06b6d4', '#a855f7', '#10b981', '#ec4899', '#3b82f6'];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-5 shadow-xl">
      {/* Title & Export Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="font-extrabold text-lg text-slate-100 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-amber-400" />
            BROADCAST MONITORING REPORTS & ANALYTICS
          </h2>
          <p className="text-xs text-slate-400">
            Commercial occurrences, share of voice, program ad ratios, channel uptime, and operator compliance reports.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 text-xs shadow-lg shadow-emerald-950/40 shrink-0"
        >
          <Download className="w-4 h-4" />
          EXPORT EXCEL / CSV REPORT
        </button>
      </div>

      {/* Tabs Selector */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        {(['ads', 'programs', 'channels', 'operators'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors ${
              activeTab === tab ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {tab} Reports
          </button>
        ))}
      </div>

      {/* Analytics Charts Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Brand Frequency Bar Chart */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
          <h3 className="font-bold text-slate-200 text-xs flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            BRAND COMMERCIAL SPOTS FREQUENCY
          </h3>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={brandChartData}>
                <XAxis dataKey="brand" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', fontSize: '12px' }}
                />
                <Bar dataKey="spots" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                  {brandChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Channel Occurrences Bar Chart */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
          <h3 className="font-bold text-slate-200 text-xs flex items-center gap-2">
            <Tv className="w-4 h-4 text-cyan-400" />
            COMMERCIAL SPOTS PER CHANNEL
          </h3>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelChartData}>
                <XAxis dataKey="channel" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', fontSize: '12px' }}
                />
                <Bar dataKey="spots" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Main Detailed Data Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 font-bold text-slate-200 text-xs flex items-center justify-between">
          <span>LOGGED OCCURRENCES ({adPunches.length} RECORDS)</span>
          <span className="text-slate-400 font-mono text-[11px]">SORTED BY NEWEST</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/60 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3">DATE / TIMECODE</th>
                <th className="p-3">CHANNEL</th>
                <th className="p-3">BRAND</th>
                <th className="p-3">COMMERCIAL TITLE</th>
                <th className="p-3">PROGRAM</th>
                <th className="p-3">DURATION</th>
                <th className="p-3">OPERATOR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {adPunches.map(p => (
                <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="p-3 font-mono text-slate-400">{new Date(p.createdAt).toLocaleString()}</td>
                  <td className="p-3 font-bold text-cyan-400">{p.channelName}</td>
                  <td className="p-3 font-bold text-amber-400">{p.brand}</td>
                  <td className="p-3 font-medium text-slate-100">{p.adName}</td>
                  <td className="p-3 text-slate-300">{p.programName}</td>
                  <td className="p-3 font-mono font-bold text-emerald-400">{p.durationSec}s</td>
                  <td className="p-3 text-slate-400">{p.operatorName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
