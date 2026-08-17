import React, { useState } from 'react';
import { Channel, AdMaster, NewsMaster, ProgramMaster } from '../types';
import {
  X,
  Search,
  Plus,
  Radio,
  Square,
  Tag,
  Newspaper,
  CheckCircle2,
  Tv,
  Sparkles,
  FileText,
  Clock,
  Layers,
  Megaphone
} from 'lucide-react';

interface PunchCaptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdPunchActive: boolean;
  adElapsedSec: number;
  selectedChannel: Channel;
  adMasters: AdMaster[];
  newsMasters: NewsMaster[];
  programMasters: ProgramMaster[];
  selectedAdId: string;
  onSelectAdId: (id: string) => void;
  selectedNewsId: string;
  onSelectNewsId: (id: string) => void;
  customCaption: string;
  setCustomCaption: (text: string) => void;
  onAddNewsMaster: (data: Partial<NewsMaster>) => Promise<any>;
  onAddAdMaster: (data: Partial<AdMaster>) => Promise<any>;
  onConfirmAdPunch: () => void;
  onStartAdPunch: () => void;
}

export const PunchCaptionModal: React.FC<PunchCaptionModalProps> = ({
  isOpen,
  onClose,
  isAdPunchActive,
  adElapsedSec,
  selectedChannel,
  adMasters,
  newsMasters,
  programMasters,
  selectedAdId,
  onSelectAdId,
  selectedNewsId,
  onSelectNewsId,
  customCaption,
  setCustomCaption,
  onAddNewsMaster,
  onAddAdMaster,
  onConfirmAdPunch,
  onStartAdPunch
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'create_news' | 'create_ad'>('search');
  const [searchQuery, setSearchQuery] = useState('');

  // Quick Create News Form State
  const [newsForm, setNewsForm] = useState({
    title: '',
    category: 'Breaking News',
    presenter: 'News Desk',
    description: '',
    defaultDurationSec: 300
  });

  // Quick Create Ad Form State
  const [adForm, setAdForm] = useState({
    brand: '',
    adName: '',
    category: 'General',
    targetDurationSec: 30
  });

  const [isSubmittingNew, setIsSubmittingNew] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const currentSelectedAd = adMasters.find(a => a.id === selectedAdId);
  const currentSelectedNews = newsMasters.find(n => n.id === selectedNewsId);

  // Search filter
  const q = (searchQuery || '').toLowerCase();
  const filteredNews = newsMasters.filter(
    n =>
      n.active &&
      ((n.title || '').toLowerCase().includes(q) ||
        (n.category || '').toLowerCase().includes(q) ||
        (n.presenter || '').toLowerCase().includes(q))
  );

  const filteredAds = adMasters.filter(
    a =>
      a.active &&
      ((a.brand || '').toLowerCase().includes(q) ||
        (a.adName || '').toLowerCase().includes(q) ||
        (a.category || '').toLowerCase().includes(q))
  );

  const handleCreateNewsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsForm.title.trim()) return;
    setIsSubmittingNew(true);
    try {
      const created = await onAddNewsMaster({
        title: newsForm.title,
        shortTitle: newsForm.title,
        category: newsForm.category,
        presenter: newsForm.presenter,
        description: newsForm.description,
        defaultDurationSec: newsForm.defaultDurationSec,
        tags: [newsForm.category.toLowerCase(), 'live-caption']
      });

      if (created && created.id) {
        onSelectNewsId(created.id);
        if (!customCaption) {
          setCustomCaption(`NEWS: ${created.title}`);
        }
      }
      setSuccessMsg(`Created & Selected News Bulletin: "${newsForm.title}"`);
      setTimeout(() => setSuccessMsg(''), 3000);
      setNewsForm({
        title: '',
        category: 'Breaking News',
        presenter: 'News Desk',
        description: '',
        defaultDurationSec: 300
      });
      setActiveTab('search');
    } catch (err) {
      console.error('Failed to create quick news item:', err);
    } finally {
      setIsSubmittingNew(false);
    }
  };

  const handleCreateAdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adForm.brand.trim() || !adForm.adName.trim()) return;
    setIsSubmittingNew(true);
    try {
      const created = await onAddAdMaster({
        brand: adForm.brand,
        adName: adForm.adName,
        productName: adForm.adName,
        category: adForm.category,
        targetDurationSec: adForm.targetDurationSec,
        version: 'V1',
        campaignName: `${adForm.brand} Campaign`,
        tags: [adForm.brand.toLowerCase(), adForm.category.toLowerCase()]
      });

      if (created && created.id) {
        onSelectAdId(created.id);
        if (!customCaption) {
          setCustomCaption(`AD: ${created.brand} - ${created.adName}`);
        }
      }
      setSuccessMsg(`Created & Selected Ad Master: "${adForm.brand} - ${adForm.adName}"`);
      setTimeout(() => setSuccessMsg(''), 3000);
      setAdForm({
        brand: '',
        adName: '',
        category: 'General',
        targetDurationSec: 30
      });
      setActiveTab('search');
    } catch (err) {
      console.error('Failed to create quick ad master:', err);
    } finally {
      setIsSubmittingNew(false);
    }
  };

  const handleAppendTag = (tag: string) => {
    if (customCaption.includes(tag)) return;
    setCustomCaption(customCaption ? `${customCaption} ${tag}` : tag);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#16161a] border border-[#222225] rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-[#111113] px-5 py-4 border-b border-[#222225] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-500">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="font-extrabold text-zinc-100 text-sm flex items-center gap-2">
                PUNCH CAPTION SEARCH & CREATOR
                <span className="bg-orange-600/10 text-orange-400 text-[10px] font-mono px-2 py-0.5 rounded-full border border-orange-500/20 font-bold">
                  LIVE PANEL
                </span>
              </div>
              <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-2 mt-0.5">
                <span>Channel: <strong className="text-zinc-200">{selectedChannel?.name}</strong></span>
                <span>•</span>
                {isAdPunchActive ? (
                  <span className="text-red-400 font-bold animate-pulse flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    PUNCHING LIVE: {adElapsedSec}s
                  </span>
                ) : (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    READY / END PUNCH
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert Banner */}
        {successMsg && (
          <div className="bg-emerald-950/80 border-b border-emerald-800/80 px-5 py-2 text-xs text-emerald-300 font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab Selection Header */}
        <div className="bg-[#111113] px-5 py-2 border-b border-[#222225] flex items-center gap-2">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'search'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            SEARCH CAPTIONS & MASTERS
          </button>

          <button
            onClick={() => setActiveTab('create_news')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'create_news'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            + CREATE NEWS ITEM
          </button>

          <button
            onClick={() => setActiveTab('create_ad')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'create_ad'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            + CREATE AD MASTER
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Active Selection Banner */}
          <div className="bg-[#111113] p-3 rounded-xl border border-[#222225] flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">ATTACHED MASTER RECORD</span>
              <span className="font-bold text-zinc-100 flex items-center gap-2 mt-0.5">
                {currentSelectedAd ? (
                  <>
                    <Tag className="w-3.5 h-3.5 text-orange-400" />
                    <span className="text-orange-400">{currentSelectedAd.brand}</span> - {currentSelectedAd.adName}
                  </>
                ) : currentSelectedNews ? (
                  <>
                    <Newspaper className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-purple-400">{currentSelectedNews.title}</span> ({currentSelectedNews.category})
                  </>
                ) : (
                  <span className="text-zinc-400 italic">No master record selected yet</span>
                )}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">DURATION</span>
              <span className="font-mono font-bold text-zinc-300">
                {currentSelectedAd?.targetDurationSec || currentSelectedNews?.defaultDurationSec || 30}s
              </span>
            </div>
          </div>

          {/* TAB 1: SEARCH CAPTIONS & MASTERS */}
          {activeTab === 'search' && (
            <div className="space-y-3">
              {/* Live Search Input */}
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Type to search captions, news titles, brands, or tags..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#111113] text-zinc-100 pl-10 pr-4 py-2.5 border border-[#222225] rounded-xl text-xs focus:border-orange-500 focus:outline-none"
                  autoFocus
                />
              </div>

              {/* Custom Caption Input Field */}
              <div>
                <label className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase block mb-1">
                  CUSTOM CAPTION / NEWS TICKER TRANSCRIPT
                </label>
                <textarea
                  rows={2}
                  placeholder="Write live caption, ticker headline, or remarks for this punched clip..."
                  value={customCaption}
                  onChange={e => setCustomCaption(e.target.value)}
                  className="w-full bg-[#111113] text-zinc-100 p-2.5 border border-[#222225] rounded-xl text-xs focus:border-orange-500 focus:outline-none resize-none"
                />
                {/* Quick Tag Pills */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase mr-1">Quick Tags:</span>
                  {['#BreakingNews', '#AdBreak', '#Commercial', '#Headline', '#PressConf', '#SportsUpdate'].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleAppendTag(tag)}
                      className="bg-[#111113] hover:bg-white/10 text-zinc-300 border border-[#222225] px-2 py-0.5 rounded-lg text-[10px] font-mono transition-colors cursor-pointer"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtered Master Results List */}
              <div className="space-y-2">
                <label className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase block">
                  MATCHING MASTER ITEMS ({filteredNews.length + filteredAds.length})
                </label>

                <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                  {/* News Matches */}
                  {filteredNews.map(news => (
                    <div
                      key={news.id}
                      onClick={() => {
                        onSelectNewsId(news.id);
                        if (!customCaption) setCustomCaption(`NEWS: ${news.title}`);
                      }}
                      className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between gap-3 transition-all ${
                        selectedNewsId === news.id
                          ? 'bg-purple-500/10 border-purple-500 text-white shadow-md'
                          : 'bg-[#111113] border-[#222225] text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-purple-950/80 border border-purple-800/80 flex items-center justify-center text-purple-300 shrink-0">
                          <Newspaper className="w-4 h-4" />
                        </div>
                        <div className="truncate text-xs">
                          <div className="font-bold text-purple-400 truncate">{news.title}</div>
                          <div className="text-[10px] text-zinc-500 flex items-center gap-2">
                            <span>Category: {news.category}</span>
                            <span>•</span>
                            <span>Anchor: {news.presenter}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-colors ${
                          selectedNewsId === news.id
                            ? 'bg-purple-600 text-white'
                            : 'bg-[#16161a] text-zinc-400 border border-[#222225]'
                        }`}
                      >
                        {selectedNewsId === news.id ? 'SELECTED' : 'SELECT'}
                      </button>
                    </div>
                  ))}

                  {/* Ad Matches */}
                  {filteredAds.map(ad => (
                    <div
                      key={ad.id}
                      onClick={() => {
                        onSelectAdId(ad.id);
                        if (!customCaption) setCustomCaption(`AD: ${ad.brand} - ${ad.adName}`);
                      }}
                      className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between gap-3 transition-all ${
                        selectedAdId === ad.id
                          ? 'bg-orange-500/10 border-orange-500 text-white shadow-md'
                          : 'bg-[#111113] border-[#222225] text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-orange-950/40 border border-orange-500/30 flex items-center justify-center shrink-0">
                          <Megaphone className="w-4 h-4 text-orange-400" />
                        </div>
                        <div className="truncate text-xs">
                          <div className="font-bold text-orange-400 truncate">{ad.brand} - {ad.adName}</div>
                          <div className="text-[10px] text-zinc-500 flex items-center gap-2">
                            <span>Category: {ad.category}</span>
                            <span>•</span>
                            <span>{ad.targetDurationSec}s</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-colors ${
                          selectedAdId === ad.id
                            ? 'bg-orange-600 text-white'
                            : 'bg-[#16161a] text-zinc-400 border border-[#222225]'
                        }`}
                      >
                        {selectedAdId === ad.id ? 'SELECTED' : 'SELECT'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CREATE NEW NEWS BULLETIN */}
          {activeTab === 'create_news' && (
            <form onSubmit={handleCreateNewsSubmit} className="space-y-3">
              <div className="bg-purple-950/20 border border-purple-800/30 p-3 rounded-xl text-xs text-purple-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Instantly create a missing News Bulletin or Caption topic and attach it to this live punch!</span>
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase block mb-1">
                  NEWS TITLE / CAPTION *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Breaking: Election Commission Press Conference"
                  value={newsForm.title}
                  onChange={e => setNewsForm({ ...newsForm, title: e.target.value })}
                  className="w-full bg-[#111113] text-zinc-100 p-2.5 border border-[#222225] rounded-xl text-xs focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase block mb-1">
                    CATEGORY
                  </label>
                  <select
                    value={newsForm.category}
                    onChange={e => setNewsForm({ ...newsForm, category: e.target.value })}
                    className="w-full bg-[#111113] text-zinc-100 p-2.5 border border-[#222225] rounded-xl text-xs focus:border-purple-500 focus:outline-none"
                  >
                    <option value="Breaking News">Breaking News</option>
                    <option value="Politics">Politics</option>
                    <option value="Economy">Economy</option>
                    <option value="Sports">Sports</option>
                    <option value="Crime & Justice">Crime & Justice</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="International">International</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase block mb-1">
                    PRESENTER / DESK
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. News Desk 1"
                    value={newsForm.presenter}
                    onChange={e => setNewsForm({ ...newsForm, presenter: e.target.value })}
                    className="w-full bg-[#111113] text-zinc-100 p-2.5 border border-[#222225] rounded-xl text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase block mb-1">
                  DESCRIPTION / DETAILS
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief details or bullet points of the news headline..."
                  value={newsForm.description}
                  onChange={e => setNewsForm({ ...newsForm, description: e.target.value })}
                  className="w-full bg-[#111113] text-zinc-100 p-2.5 border border-[#222225] rounded-xl text-xs focus:border-purple-500 focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingNew || !newsForm.title.trim()}
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {isSubmittingNew ? 'CREATING...' : 'CREATE & ATTACH NEWS BULLETIN TO PUNCH'}
              </button>
            </form>
          )}

          {/* TAB 3: CREATE NEW AD MASTER */}
          {activeTab === 'create_ad' && (
            <form onSubmit={handleCreateAdSubmit} className="space-y-3">
              <div className="bg-blue-950/20 border border-blue-800/30 p-3 rounded-xl text-xs text-blue-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Quickly add a new commercial ad master record to the database and select it immediately!</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase block mb-1">
                    BRAND NAME *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Coca Cola"
                    value={adForm.brand}
                    onChange={e => setAdForm({ ...adForm, brand: e.target.value })}
                    className="w-full bg-[#111113] text-zinc-100 p-2.5 border border-[#222225] rounded-xl text-xs focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase block mb-1">
                    COMMERCIAL TITLE *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Real Magic Summer 30s"
                    value={adForm.adName}
                    onChange={e => setAdForm({ ...adForm, adName: e.target.value })}
                    className="w-full bg-[#111113] text-zinc-100 p-2.5 border border-[#222225] rounded-xl text-xs focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase block mb-1">
                    CATEGORY
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Beverages"
                    value={adForm.category}
                    onChange={e => setAdForm({ ...adForm, category: e.target.value })}
                    className="w-full bg-[#111113] text-zinc-100 p-2.5 border border-[#222225] rounded-xl text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase block mb-1">
                    DURATION (SECONDS)
                  </label>
                  <input
                    type="number"
                    value={adForm.targetDurationSec}
                    onChange={e => setAdForm({ ...adForm, targetDurationSec: Number(e.target.value) })}
                    className="w-full bg-[#111113] text-zinc-100 p-2.5 border border-[#222225] rounded-xl text-xs focus:border-blue-500 focus:outline-none font-mono"
                    min={5}
                    max={300}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingNew || !adForm.brand.trim() || !adForm.adName.trim()}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {isSubmittingNew ? 'CREATING...' : 'CREATE & ATTACH AD MASTER TO PUNCH'}
              </button>
            </form>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="bg-[#111113] p-4 border-t border-[#222225] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-zinc-400">
            {isAdPunchActive ? (
              <span>Punching in background...</span>
            ) : (
              <span>Ready to submit or start punch</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isAdPunchActive ? (
              <button
                onClick={() => {
                  onStartAdPunch();
                }}
                className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Radio className="w-4 h-4 animate-pulse" />
                START AD PUNCH
              </button>
            ) : (
              <button
                onClick={() => {
                  onConfirmAdPunch();
                  onClose();
                }}
                className="bg-red-600 hover:bg-red-500 text-white font-black px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-red-950/50 animate-pulse cursor-pointer"
              >
                <Square className="w-4 h-4" />
                END AD PUNCH & SAVE CLIP
              </button>
            )}

            <button
              onClick={onClose}
              className="bg-[#16161a] hover:bg-white/5 text-zinc-300 border border-[#222225] font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
