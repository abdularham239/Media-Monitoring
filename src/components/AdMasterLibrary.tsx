import React, { useState } from 'react';
import { AdMaster } from '../types';
import { Plus, Search, Tag, Edit3, Trash2, ShieldAlert, Sparkles, AlertCircle, CheckCircle2, Megaphone } from 'lucide-react';

interface AdMasterLibraryProps {
  adMasters: AdMaster[];
  onAddAdMaster: (adData: Partial<AdMaster>) => void;
  onUpdateAdMaster: (id: string, adData: Partial<AdMaster>) => void;
  onDeleteAdMaster: (id: string) => void;
  onCheckDuplicate: (brand: string, adName: string) => Promise<{ isDuplicate: boolean; existingRecord?: AdMaster }>;
}

export const AdMasterLibrary: React.FC<AdMasterLibraryProps> = ({
  adMasters,
  onAddAdMaster,
  onUpdateAdMaster,
  onDeleteAdMaster,
  onCheckDuplicate
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<AdMaster | null>(null);

  // Form State
  const [brand, setBrand] = useState('');
  const [adName, setAdName] = useState('');
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('Beverages');
  const [version, setVersion] = useState('V1');
  const [campaignName, setCampaignName] = useState('');
  const [targetDurationSec, setTargetDurationSec] = useState(30);
  const [thumbnail, setThumbnail] = useState('');
  const [notes, setNotes] = useState('');

  // Duplicate Modal State
  const [duplicateWarning, setDuplicateWarning] = useState<AdMaster | null>(null);

  const categories = Array.from(new Set(adMasters.map(a => a.category)));

  const handleOpenNew = () => {
    setEditingAd(null);
    setBrand('');
    setAdName('');
    setProductName('');
    setCategory('Beverages');
    setVersion('V1');
    setCampaignName('');
    setTargetDurationSec(30);
    setThumbnail('https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=300&auto=format&fit=crop&q=80');
    setNotes('');
    setDuplicateWarning(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ad: AdMaster) => {
    setEditingAd(ad);
    setBrand(ad.brand);
    setAdName(ad.adName);
    setProductName(ad.productName);
    setCategory(ad.category);
    setVersion(ad.version);
    setCampaignName(ad.campaignName);
    setTargetDurationSec(ad.targetDurationSec);
    setThumbnail(ad.thumbnail);
    setNotes(ad.notes || '');
    setDuplicateWarning(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingAd) {
      // Check duplicate protection rule
      const res = await onCheckDuplicate(brand, adName);
      if (res.isDuplicate && res.existingRecord) {
        setDuplicateWarning(res.existingRecord);
        return;
      }
    }

    saveAdRecord();
  };

  const saveAdRecord = (forceNewVersion = false) => {
    const payload = {
      brand,
      adName,
      productName: productName || adName,
      category,
      version: forceNewVersion ? `${version} (Rev)` : version,
      campaignName,
      targetDurationSec: Number(targetDurationSec),
      thumbnail: thumbnail || 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=300&auto=format&fit=crop&q=80',
      notes
    };

    if (editingAd) {
      onUpdateAdMaster(editingAd.id, payload);
    } else {
      onAddAdMaster(payload);
    }

    setIsModalOpen(false);
    setDuplicateWarning(null);
  };

  const filteredAds = adMasters.filter(a => {
    const matchesSearch =
      a.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.adName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.campaignName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || a.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4 shadow-xl">
      {/* Title & Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="font-extrabold text-lg text-slate-100 flex items-center gap-2">
            <Tag className="w-5 h-5 text-amber-400" />
            ADVERTISEMENT MASTER LIBRARY
          </h2>
          <p className="text-xs text-slate-400">
            Permanent master repository for brand commercials. Master records are saved once and reused forever across channel monitoring.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg flex items-center gap-2 text-xs shadow-lg shadow-amber-950/40 transition-transform active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          CREATE MASTER AD
        </button>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search advertiser, brand name, campaign..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 text-slate-100 pl-9 pr-4 py-2 border border-slate-800 rounded-lg text-xs focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-semibold shrink-0">Category:</span>
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg p-2 text-xs focus:border-amber-500 focus:outline-none"
          >
            <option value="all">All Categories ({adMasters.length})</option>
            {categories.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Master Ads */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filteredAds.map(ad => (
          <div
            key={ad.id}
            className="bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-xl overflow-hidden flex flex-col justify-between group transition-all"
          >
            <div>
              <div className="relative aspect-video bg-slate-900 border-b border-slate-800 flex flex-col items-center justify-center p-3 text-center bg-gradient-to-br from-amber-950/30 to-slate-950">
                <Megaphone className="w-8 h-8 text-amber-400 mb-1" />
                <span className="text-[11px] font-mono font-bold text-amber-300 truncate max-w-full px-2">{ad.brand}</span>
                <span className="absolute top-2 left-2 bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-[10px] px-2 py-0.5 rounded">
                  {ad.category}
                </span>
                <span className="absolute bottom-2 right-2 bg-slate-900 border border-slate-800 text-white font-mono text-[10px] px-1.5 py-0.5 rounded">
                  {ad.targetDurationSec}s
                </span>
              </div>

              <div className="p-3">
                <h3 className="font-bold text-slate-100 text-sm truncate">{ad.adName}</h3>
                <div className="text-xs text-amber-400 font-medium truncate mt-0.5">{ad.campaignName}</div>
                <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
                  <span>Category: <strong>{ad.category}</strong></span>
                  <span className="font-mono bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded text-[10px]">{ad.version}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/60 px-3 py-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
              <span className="text-[10px] text-slate-500">
                Created {new Date(ad.createdAt).toLocaleDateString()}
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(ad)}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                  title="Edit Master Ad"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDeleteAdMaster(ad.id)}
                  className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800"
                  title="Delete Master Ad"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Dialog for Add/Edit Ad */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-5 shadow-2xl flex flex-col gap-4">
            <h3 className="font-extrabold text-slate-100 text-base border-b border-slate-800 pb-2">
              {editingAd ? 'EDIT MASTER AD' : 'CREATE NEW MASTER AD'}
            </h3>

            {/* Duplicate Protection Alert Banner */}
            {duplicateWarning && (
              <div className="bg-amber-950/80 border border-amber-600 rounded-lg p-3 text-xs text-amber-200 flex flex-col gap-2">
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <ShieldAlert className="w-4 h-4" />
                  POSSIBLE DUPLICATE MASTER DETECTED!
                </div>
                <p>
                  A commercial titled <strong>"{duplicateWarning.adName}"</strong> for brand <strong>"{duplicateWarning.brand}"</strong> already exists in the master library.
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setDuplicateWarning(null);
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-1.5 rounded"
                  >
                    Use Existing Master Record
                  </button>
                  <button
                    type="button"
                    onClick={() => saveAdRecord(true)}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded"
                  >
                    Create New Version Anyway
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">BRAND / ADVERTISER *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pepsi, Samsung"
                    value={brand}
                    onChange={e => setBrand(e.target.value)}
                    className="w-full bg-slate-950 text-slate-100 border border-slate-800 rounded p-2 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">AD TITLE *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Summer Blast 2026"
                    value={adName}
                    onChange={e => setAdName(e.target.value)}
                    className="w-full bg-slate-950 text-slate-100 border border-slate-800 rounded p-2 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">CATEGORY</label>
                  <input
                    type="text"
                    placeholder="Beverages, Telecom, Auto"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-slate-950 text-slate-100 border border-slate-800 rounded p-2 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">CAMPAIGN NAME</label>
                  <input
                    type="text"
                    placeholder="e.g. Summer Fest 2026"
                    value={campaignName}
                    onChange={e => setCampaignName(e.target.value)}
                    className="w-full bg-slate-950 text-slate-100 border border-slate-800 rounded p-2 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">TARGET DURATION (SEC)</label>
                  <input
                    type="number"
                    value={targetDurationSec}
                    onChange={e => setTargetDurationSec(Number(e.target.value))}
                    className="w-full bg-slate-950 text-slate-100 border border-slate-800 rounded p-2 text-xs focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">VERSION CODE</label>
                  <input
                    type="text"
                    value={version}
                    onChange={e => setVersion(e.target.value)}
                    className="w-full bg-slate-950 text-slate-100 border border-slate-800 rounded p-2 text-xs focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">THUMBNAIL IMAGE URL</label>
                <input
                  type="url"
                  value={thumbnail}
                  onChange={e => setThumbnail(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 border border-slate-800 rounded p-2 text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded text-xs"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs"
                >
                  SAVE MASTER RECORD
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
