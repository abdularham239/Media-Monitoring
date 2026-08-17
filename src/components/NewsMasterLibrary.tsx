import React, { useState } from 'react';
import { NewsMaster } from '../types';
import { Newspaper, Plus, Search, Edit3, Trash2 } from 'lucide-react';

interface NewsMasterLibraryProps {
  newsMasters: NewsMaster[];
  onAddNewsMaster: (data: Partial<NewsMaster>) => void;
  onUpdateNewsMaster: (id: string, data: Partial<NewsMaster>) => void;
  onDeleteNewsMaster: (id: string) => void;
}

export const NewsMasterLibrary: React.FC<NewsMasterLibraryProps> = ({
  newsMasters,
  onAddNewsMaster,
  onUpdateNewsMaster,
  onDeleteNewsMaster
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsMaster | null>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('National News');
  const [presenter, setPresenter] = useState('');
  const [description, setDescription] = useState('');
  const [defaultDurationSec, setDefaultDurationSec] = useState(300);

  const handleOpenNew = () => {
    setEditingNews(null);
    setTitle('');
    setCategory('National News');
    setPresenter('');
    setDescription('');
    setDefaultDurationSec(300);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (n: NewsMaster) => {
    setEditingNews(n);
    setTitle(n.title);
    setCategory(n.category);
    setPresenter(n.presenter);
    setDescription(n.description);
    setDefaultDurationSec(n.defaultDurationSec);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title,
      category,
      presenter,
      description,
      defaultDurationSec: Number(defaultDurationSec)
    };

    if (editingNews) {
      onUpdateNewsMaster(editingNews.id, payload);
    } else {
      onAddNewsMaster(payload);
    }
    setIsModalOpen(false);
  };

  const filtered = newsMasters.filter(
    n => n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.presenter.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="font-extrabold text-lg text-slate-100 flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-purple-400" />
            NEWS MASTER LIBRARY
          </h2>
          <p className="text-xs text-slate-400">
            Permanent News Bulletins & Headlines repository. Select news masters directly during live monitoring.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 text-xs shadow-lg shadow-purple-950/40 shrink-0"
        >
          <Plus className="w-4 h-4" />
          CREATE NEWS MASTER
        </button>
      </div>

      <div className="relative w-full">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Search news bulletin title, anchor, presenter..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-slate-950 text-slate-100 pl-9 pr-4 py-2 border border-slate-800 rounded-lg text-xs focus:border-purple-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(news => (
          <div key={news.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="bg-purple-950 text-purple-400 font-mono text-[10px] px-2 py-0.5 rounded border border-purple-800">
                  {news.newsCode}
                </span>
                <span className="text-xs text-slate-400 font-mono">{Math.floor(news.defaultDurationSec / 60)} min</span>
              </div>

              <h3 className="font-bold text-slate-100 text-sm mt-2">{news.title}</h3>
              <p className="text-xs text-purple-400 font-medium mt-1">Anchor: {news.presenter}</p>
              <p className="text-[11px] text-slate-400 mt-2 line-clamp-2">{news.description}</p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-500">
              <span>Category: <strong>{news.category}</strong></span>
              <div className="flex items-center gap-1">
                <button onClick={() => handleOpenEdit(news)} className="p-1 text-slate-400 hover:text-white">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => onDeleteNewsMaster(news.id)} className="p-1 text-slate-400 hover:text-red-400">
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
              {editingNews ? 'EDIT NEWS MASTER' : 'CREATE NEWS MASTER'}
            </h3>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">BULLETIN TITLE *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
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

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">ANCHOR / PRESENTER</label>
                <input
                  type="text"
                  value={presenter}
                  onChange={e => setPresenter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">DEFAULT DURATION (SEC)</label>
                <input
                  type="number"
                  value={defaultDurationSec}
                  onChange={e => setDefaultDurationSec(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-100 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded">
                  CANCEL
                </button>
                <button type="submit" className="px-5 py-2 bg-purple-600 text-white text-xs font-bold rounded">
                  SAVE NEWS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
