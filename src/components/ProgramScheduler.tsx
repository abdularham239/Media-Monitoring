import React, { useState } from 'react';
import { ProgramSchedule, Channel, ProgramMaster } from '../types';
import { Calendar, Plus, Trash2, Clock, Tv, Copy, ArrowRight } from 'lucide-react';

interface ProgramSchedulerProps {
  schedules: ProgramSchedule[];
  channels: Channel[];
  programMasters: ProgramMaster[];
  onAddSchedule: (schedule: Partial<ProgramSchedule>) => void;
  onDeleteSchedule: (id: string) => void;
}

export const ProgramScheduler: React.FC<ProgramSchedulerProps> = ({
  schedules,
  channels,
  programMasters,
  onAddSchedule,
  onDeleteSchedule
}) => {
  const [selectedChannelId, setSelectedChannelId] = useState<string>(channels[0]?.id || 'ch-1');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [programId, setProgramId] = useState<string>(programMasters[0]?.id || '');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [dayOfWeek, setDayOfWeek] = useState(-1); // -1 = Daily

  const selectedChannel = channels.find(c => c.id === selectedChannelId);
  const channelSchedules = schedules.filter(s => s.channelId === selectedChannelId);

  const handleOpenAdd = () => {
    setProgramId(programMasters[0]?.id || '');
    setStartTime('09:00');
    setEndTime('11:00');
    setDayOfWeek(-1);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prg = programMasters.find(p => p.id === programId);
    if (!prg) return;

    onAddSchedule({
      channelId: selectedChannelId,
      programId: prg.id,
      programName: prg.name,
      startTime,
      endTime,
      dayOfWeek: Number(dayOfWeek),
      category: prg.category,
      host: prg.host
    });

    setIsModalOpen(false);
  };

  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="font-extrabold text-lg text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            PROGRAM SCHEDULER & TIMETABLE
          </h2>
          <p className="text-xs text-slate-400">
            Channel-wise broadcast transmission schedule. Ad punches automatically link to current scheduled program.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              try {
                const res = await fetch('/api/schedules/copy-day', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ fromDay: -1, toDay: 1, channelId: selectedChannelId })
                });
                const data = await res.json();
                if (data.success) {
                  alert(`Successfully copied ${data.copiedCount} schedule slots!`);
                  window.location.reload();
                }
              } catch (e) {
                console.error(e);
              }
            }}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 text-xs"
            title="Duplicate transmission schedule to another day"
          >
            <Copy className="w-3.5 h-3.5 text-amber-400" />
            COPY SCHEDULE TO DAY
          </button>
          <button
            onClick={handleOpenAdd}
            className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold px-4 py-2 rounded-lg flex items-center gap-2 text-xs shadow-lg shadow-cyan-950/40"
          >
            <Plus className="w-4 h-4" />
            ADD SCHEDULE SLOT
          </button>
        </div>
      </div>

      {/* Channel Switcher Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {channels.map(ch => (
          <button
            key={ch.id}
            onClick={() => setSelectedChannelId(ch.id)}
            className={`px-3 py-2 rounded-lg border text-xs font-bold flex items-center gap-2 shrink-0 transition-colors ${
              selectedChannelId === ch.id
                ? 'bg-cyan-950 border-cyan-500 text-cyan-400 shadow-md'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            {ch.name} ({ch.code})
          </button>
        ))}
      </div>

      {/* Schedule Timetable Timeline View */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
        <div className="text-xs text-slate-400 font-semibold flex items-center justify-between border-b border-slate-800/80 pb-2">
          <span>DAILY TRANSMISSION SCHEDULE — {selectedChannel?.name ? selectedChannel.name.toUpperCase() : 'CHANNEL'}</span>
          <span className="font-mono text-cyan-400">{channelSchedules.length} SCHEDULED SHOWS</span>
        </div>

        <div className="space-y-2">
          {channelSchedules.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No programs scheduled for this channel yet. Click "Add Schedule Slot" above.
            </div>
          ) : (
            channelSchedules.map(sch => (
              <div
                key={sch.id}
                className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-cyan-950 border border-cyan-800 text-cyan-400 font-mono text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1.5 shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    {sch.startTime} → {sch.endTime}
                  </div>

                  <div>
                    <div className="font-extrabold text-slate-100 text-sm">{sch.programName}</div>
                    <div className="text-xs text-slate-400 mt-0.5">Host: {sch.host || 'N/A'} • {sch.category}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="bg-slate-800 text-slate-300 font-mono text-[10px] px-2 py-0.5 rounded">
                    {sch.dayOfWeek === -1 ? 'DAILY REPEAT' : 'WEEKLY'}
                  </span>

                  <button
                    onClick={() => onDeleteSchedule(sch.id)}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded"
                    title="Delete Slot"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Dialog for Add Schedule Slot */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-5 shadow-2xl flex flex-col gap-3">
            <h3 className="font-bold text-slate-100 text-base border-b border-slate-800 pb-2">
              ADD PROGRAM TRANSMISSION SLOT
            </h3>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">SELECT MASTER PROGRAM *</label>
                <select
                  value={programId}
                  onChange={e => setProgramId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-100"
                >
                  {programMasters.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">START TIME</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">END TIME</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">REPEAT SCHEDULE</label>
                <select
                  value={dayOfWeek}
                  onChange={e => setDayOfWeek(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-100"
                >
                  <option value={-1}>Daily Recurring Transmission</option>
                  <option value={1}>Mondays Only</option>
                  <option value={2}>Tuesdays Only</option>
                  <option value={3}>Wednesdays Only</option>
                  <option value={4}>Thursdays Only</option>
                  <option value={5}>Fridays Only</option>
                  <option value={6}>Saturdays Only</option>
                  <option value={0}>Sundays Only</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded">
                  CANCEL
                </button>
                <button type="submit" className="px-5 py-2 bg-cyan-600 text-slate-950 text-xs font-bold rounded">
                  SAVE SLOT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
