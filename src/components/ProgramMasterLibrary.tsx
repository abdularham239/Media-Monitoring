import React, { useState } from 'react';
import { ProgramMaster, Channel } from '../types';
import { Tv, Plus, Search, Edit3, Trash2 } from 'lucide-react';

interface ProgramMasterLibraryProps {
  programMasters: ProgramMaster[];
  channels: Channel[];
  onAddProgramMaster: (data: Partial<ProgramMaster>) => void;
  onUpdateProgramMaster: (id: string, data: Partial<ProgramMaster>) => void;
  onDeleteProgramMaster: (id: string) => void;
}

export const ProgramMasterLibrary: React.FC<ProgramMasterLibraryProps> = ({
  programMasters,
  channels,
  onAddProgramMaster,
  onUpdateProgramMaster,
  onDeleteProgramMaster
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<ProgramMaster | null>(null);

  const [name, setName] = useState('');
  const [channelId, setChannelId] = useState(channels[0]?.id || 'ch-1');
  const [category, setCategory] = useState('Infotainment');
  const [host, setHost] = useState('');
  const [season, setSeason] = useState('2026');
  const [defaultDurationSec, setDefaultDurationSec] = useState(3600);
  const [thumbnail, setThumbnail] = useState('');

  const handleOpenNew = () => {
    setEditingProgram(null);
    setName('');
    setChannelId(channels[0]?.id || 'ch-1');
    setCategory('Infotainment');
    setHost('');
    setSeason('2026');
    setDefaultDurationSec(3600);
    setThumbnail('https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300&auto=format&fit=crop&q=80');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: ProgramMaster) => {
    setEditingProgram(p);
    setName(p.name);
    setChannelId(p.channelId);
    setCategory(p.category);
    setHost(p.host);
    setSeason(p.season || '2026');
    setDefaultDurationSec(p.defaultDurationSec);
    setThumbnail(p.thumbnail);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ch = channels.find(c => c.id === channelId);
    const payload = {
      name,
      channelId,
      channelName: ch ? ch.name : 'Channel',
      category,
      host,
      season,
      defaultDurationSec: Number(defaultDurationSec),
      thumbnail: thumbnail || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300&auto=format&fit=crop&q=80'
    };

    if (editingProgram) {
      onUpdateProgramMaster(editingProgram.id, payload);
    } else {
      onAddProgramMaster(payload);
    }
    setIsModalOpen(false);
  };

  const filtered = programMasters.filter(
    p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.host.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="font-extrabold text-lg text-slate-100 flex items-center gap-2">
            <Tv className="w-5 h-5 text-cyan-400" />
            PROGRAM MASTER LIBRARY
          </h2>
          <p className="text-xs text-slate-400">
            Permanent TV Shows & Program Master repository. Automatically detected by schedule during ad punching.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold px-4 py-2 rounded-lg flex items-center gap-2 text-xs shadow-lg shadow-cyan-950/40 shrink-0"
        >
          <Plus className="w-4 h-4" />
          CREATE PROGRAM MASTER
        </button>
      </div>

      <div className="relative w-full">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Search program show name, host, anchor..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-slate-950 text-slate-100 pl-9 pr-4 py-2 border border-slate-800 rounded-lg text-xs focus:border-cyan-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {filtered.map(prg => (
          <div key={prg.id} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between">
            <div>
              <div className="relative aspect-video bg-slate-900 border-b border-slate-800 flex flex-col items-center justify-center p-3 text-center bg-gradient-to-br from-cyan-950/30 to-slate-950">
                <Tv className="w-8 h-8 text-cyan-400 mb-1" />
                <span className="text-[11px] font-mono font-bold text-cyan-300 truncate max-w-full px-2">{prg.category}</span>
                <span className="absolute top-2 left-2 bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold text-[10px] px-2 py-0.5 rounded">
                  {prg.channelName}
                </span>
                <span className="absolute bottom-2 right-2 bg-slate-900 border border-slate-800 text-white font-mono text-[10px] px-1.5 py-0.5 rounded">
                  {Math.floor(prg.defaultDurationSec / 60)} min
                </span>
              </div>

              <div className="p-3">
                <h3 className="font-bold text-slate-100 text-sm truncate">{prg.name}</h3>
                <div className="text-xs text-cyan-400 font-medium truncate mt-0.5">Host: {prg.host}</div>
                <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
                  <span>Category: <strong>{prg.category}</strong></span>
                  <span className="font-mono bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded text-[10px]">{prg.season}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/60 px-3 py-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
              <span className="text-[10px] text-slate-500">ID: {prg.programCode}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => handleOpenEdit(prg)} className="p-1 text-slate-400 hover:text-white">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => onDeleteProgramMaster(prg.id)} className="p-1 text-slate-400 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-5 shadow-2xl flex flex-col gap-3">
            <h3 className="font-bold text-slate-100 text-base border-b border-slate-800 pb-2">
              {editingProgram ? 'EDIT PROGRAM MASTER' : 'CREATE PROGRAM MASTER'}
            </h3>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">PROGRAM SHOW NAME *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">PRIMARY CHANNEL</label>
                <select
                  value={channelId}
                  onChange={e => setChannelId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-100"
                >
                  {channels.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">HOST / PRESENTER</label>
                <input
                  type="text"
                  value={host}
                  onChange={e => setHost(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">CATEGORY</label>
                <input
                  type="text"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded">
                  CANCEL
                </button>
                <button type="submit" className="px-5 py-2 bg-cyan-600 text-slate-950 text-xs font-bold rounded">
                  SAVE PROGRAM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
