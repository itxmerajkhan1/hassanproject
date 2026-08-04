/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { HeroBanner } from '../types';
import { 
  subscribeHeroBanners, 
  addHeroBanner, 
  updateHeroBanner, 
  deleteHeroBanner, 
  duplicateHeroBanner, 
  reorderHeroBanners, 
  uploadHeroBannerMedia 
} from '../services/dbService';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Copy, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  Check, 
  X, 
  Upload, 
  Image as ImageIcon, 
  Video, 
  Sliders, 
  Sparkles, 
  Calendar, 
  Search, 
  Monitor, 
  Smartphone, 
  Tablet, 
  Globe, 
  Layers, 
  Type, 
  MousePointer, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { BrandedLoader } from './BrandedLoader';
import toast from 'react-hot-toast';

interface AdminHeroBannersProps {
  isDarkMode?: boolean;
}

const DEFAULT_BANNER: Omit<HeroBanner, 'id' | 'createdAt' | 'updatedAt'> = {
  heading: 'New Atelier Collection',
  subheading: 'Seasonal Luxury Edit',
  tagline: 'Hand-Crafted Couture',
  description: 'Discover floating silks, gold zari embroidery, and bespoke silhouettes.',
  button1Text: 'Explore Collection',
  button1Url: '/shop',
  button1Style: 'primary',
  button2Text: 'View Lookbook',
  button2Url: '/shop',
  button2Style: 'outline',
  bgImageDesktop: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1600&auto=format&fit=crop&q=80',
  bgImageTablet: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1000&auto=format&fit=crop&q=80',
  bgImageMobile: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80',
  videoUrl: '',
  overlayOpacity: 0.5,
  overlayColor: '#0a0a0a',
  textAlignment: 'left',
  textColor: 'white',
  isActive: true,
  order: 0,
  startDate: '',
  endDate: '',
  seoTitle: 'Atelier Luxury Hero Banner',
  seoAltText: 'Bespoke hand embroidered couture outfit',
  seoDescription: 'Discover the latest haute couture series from NAYAB FIT.'
};

export const AdminHeroBanners: React.FC<AdminHeroBannersProps> = ({ isDarkMode = true }) => {
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Omit<HeroBanner, 'id' | 'createdAt' | 'updatedAt'>>(DEFAULT_BANNER);
  
  // Form Tabs State
  const [activeTab, setActiveTab] = useState<'content' | 'media' | 'styling' | 'scheduling' | 'seo'>('content');
  
  // Live Preview Device View Mode
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  
  // Upload States
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingTablet, setUploadingTablet] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [saving, setSaving] = useState(false);

  // Real-time Firestore Subscription
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeHeroBanners(
      (updatedBanners) => {
        setBanners(updatedBanners);
        setLoading(false);
      },
      (err) => {
        console.error("Hero banners subscription error:", err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Open Form to Add New Banner
  const handleAddNew = () => {
    const nextOrder = banners.length > 0 ? Math.max(...banners.map(b => b.order)) + 1 : 0;
    setFormData({
      ...DEFAULT_BANNER,
      order: nextOrder
    });
    setEditingBanner(null);
    setIsCreating(true);
  };

  // Open Form to Edit Existing Banner
  const handleEdit = (banner: HeroBanner) => {
    setEditingBanner(banner);
    setFormData({
      heading: banner.heading || '',
      subheading: banner.subheading || '',
      tagline: banner.tagline || '',
      description: banner.description || '',
      button1Text: banner.button1Text || '',
      button1Url: banner.button1Url || '',
      button1Style: banner.button1Style || 'primary',
      button2Text: banner.button2Text || '',
      button2Url: banner.button2Url || '',
      button2Style: banner.button2Style || 'outline',
      bgImageDesktop: banner.bgImageDesktop || '',
      bgImageTablet: banner.bgImageTablet || '',
      bgImageMobile: banner.bgImageMobile || '',
      videoUrl: banner.videoUrl || '',
      overlayOpacity: banner.overlayOpacity ?? 0.5,
      overlayColor: banner.overlayColor || '#0a0a0a',
      textAlignment: banner.textAlignment || 'left',
      textColor: banner.textColor || 'white',
      isActive: banner.isActive ?? true,
      order: banner.order ?? 0,
      startDate: banner.startDate || '',
      endDate: banner.endDate || '',
      seoTitle: banner.seoTitle || '',
      seoAltText: banner.seoAltText || '',
      seoDescription: banner.seoDescription || ''
    });
    setIsCreating(false);
  };

  // Handle Input Changes
  const handleInputChange = (field: keyof Omit<HeroBanner, 'id' | 'createdAt' | 'updatedAt'>, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // File Upload Helper
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'bgImageDesktop' | 'bgImageTablet' | 'bgImageMobile' | 'videoUrl',
    setLoadingState: (val: boolean) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoadingState(true);
      const toastId = toast.loading(`Uploading media to Firebase Storage...`);
      const url = await uploadHeroBannerMedia(file);
      handleInputChange(field, url);
      toast.success("Media uploaded successfully!", { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to upload media. Please try again.");
    } finally {
      setLoadingState(false);
    }
  };

  // Submit Save or Add Banner
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.heading.trim() || !formData.bgImageDesktop.trim()) {
      toast.error("Main Heading and Desktop Background Image are required!");
      return;
    }

    try {
      setSaving(true);
      if (editingBanner) {
        await updateHeroBanner(editingBanner.id, formData);
        toast.success("Hero Banner updated in Firestore!");
      } else {
        await addHeroBanner(formData);
        toast.success("New Hero Banner created successfully!");
      }
      setEditingBanner(null);
      setIsCreating(false);
    } catch (err: any) {
      console.error("Save banner error:", err);
      toast.error("Could not save banner. Check connection.");
    } finally {
      setSaving(false);
    }
  };

  // Toggle Active Status Directly
  const handleToggleActive = async (banner: HeroBanner) => {
    try {
      await updateHeroBanner(banner.id, { isActive: !banner.isActive });
      toast.success(`Banner is now ${!banner.isActive ? 'ACTIVE' : 'INACTIVE'}`);
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  // Delete Banner
  const handleDelete = async (id: string, heading: string) => {
    if (!window.confirm(`Are you sure you want to delete "${heading}"?`)) return;
    try {
      await deleteHeroBanner(id);
      toast.success("Hero Banner deleted!");
      if (editingBanner?.id === id) {
        setEditingBanner(null);
        setIsCreating(false);
      }
    } catch (err) {
      toast.error("Failed to delete banner");
    }
  };

  // Duplicate Banner
  const handleDuplicate = async (banner: HeroBanner) => {
    try {
      await duplicateHeroBanner(banner);
      toast.success("Banner duplicated!");
    } catch (err) {
      toast.error("Failed to duplicate banner");
    }
  };

  // Move Order Up or Down
  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === banners.length - 1)
    ) return;

    const newBanners = [...banners];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newBanners[index];
    newBanners[index] = newBanners[targetIndex];
    newBanners[targetIndex] = temp;

    // Update local state instantly and commit reorder to Firestore
    setBanners(newBanners);
    try {
      await reorderHeroBanners(newBanners);
      toast.success("Banner order updated!");
    } catch (err) {
      toast.error("Failed to update banner order");
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <BrandedLoader variant="inline" size="lg" />
      </div>
    );
  }

  const isFormOpen = isCreating || editingBanner !== null;

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      
      {/* Header Banner Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-black text-white dark:bg-white dark:text-black">
              <Sliders className="w-4 h-4" />
            </span>
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white font-display">
              Dynamic Hero Banner Management
            </h2>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-sans">
            Manage, schedule, and live-preview homepage luxury sliders in real-time connected to Firebase.
          </p>
        </div>

        {!isFormOpen && (
          <button
            onClick={handleAddNew}
            className="inline-flex items-center justify-center bg-black text-white dark:bg-white dark:text-black hover:opacity-90 font-mono font-bold px-5 py-2.5 rounded-2xl text-xs tracking-wider uppercase shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5 text-yellow-500" />
            Add Hero Banner
          </button>
        )}
      </div>

      {/* MODAL / PANEL: FORM EDITOR & LIVE PREVIEW */}
      {isFormOpen ? (
        <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-8">
          
          {/* Top Form Action Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-base font-bold text-neutral-900 dark:text-white font-mono uppercase tracking-wide">
                {editingBanner ? `Edit Banner: ${editingBanner.heading}` : 'Create New Dynamic Hero Banner'}
              </h3>
            </div>
            <button
              onClick={() => { setEditingBanner(null); setIsCreating(false); }}
              className="p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-full hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: FORM TABS & INPUTS (7 COLS) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Form Navigation Tabs */}
              <div className="flex flex-wrap gap-1.5 p-1.5 bg-neutral-100 dark:bg-zinc-800/80 rounded-2xl text-xs font-mono font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('content')}
                  className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'content'
                      ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Type className="w-3.5 h-3.5" />
                  <span>Content</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('media')}
                  className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'media'
                      ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Media</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('styling')}
                  className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'styling'
                      ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Style</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('scheduling')}
                  className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'scheduling'
                      ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Schedule</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('seo')}
                  className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'seo'
                      ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>SEO</span>
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                
                {/* TAB 1: TEXT CONTENT */}
                {activeTab === 'content' && (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <label className="block text-xs font-mono font-bold uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                        Main Heading *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.heading}
                        onChange={(e) => handleInputChange('heading', e.target.value)}
                        placeholder="e.g. Sartorial Needlework"
                        className="w-full bg-neutral-50 dark:bg-zinc-800/60 border border-neutral-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-mono font-bold uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                          Sub Heading
                        </label>
                        <input
                          type="text"
                          value={formData.subheading}
                          onChange={(e) => handleInputChange('subheading', e.target.value)}
                          placeholder="e.g. Unstitched Chiffon Edit"
                          className="w-full bg-neutral-50 dark:bg-zinc-800/60 border border-neutral-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono font-bold uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                          Small Tagline / Eyebrow
                        </label>
                        <input
                          type="text"
                          value={formData.tagline}
                          onChange={(e) => handleInputChange('tagline', e.target.value)}
                          placeholder="e.g. Bespoke Atelier Collection"
                          className="w-full bg-neutral-50 dark:bg-zinc-800/60 border border-neutral-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-bold uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                        Description
                      </label>
                      <textarea
                        rows={3}
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Meticulously woven zari and delicate gold embroidery on sheer floating silks..."
                        className="w-full bg-neutral-50 dark:bg-zinc-800/60 border border-neutral-200 dark:border-zinc-700 rounded-xl p-3 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                      />
                    </div>

                    {/* Button 1 Configuration */}
                    <div className="pt-2 border-t border-neutral-100 dark:border-zinc-800 space-y-3">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-yellow-600 dark:text-yellow-400 block">
                        Button 1 Configuration
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-1">
                          <label className="block text-[10px] font-mono text-neutral-500 mb-1">Button 1 Text</label>
                          <input
                            type="text"
                            value={formData.button1Text}
                            onChange={(e) => handleInputChange('button1Text', e.target.value)}
                            placeholder="Shop Unstitched"
                            className="w-full bg-neutral-50 dark:bg-zinc-800/60 border border-neutral-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white"
                          />
                        </div>
                        <div className="sm:col-span-1">
                          <label className="block text-[10px] font-mono text-neutral-500 mb-1">Button 1 URL</label>
                          <input
                            type="text"
                            value={formData.button1Url}
                            onChange={(e) => handleInputChange('button1Url', e.target.value)}
                            placeholder="/shop?category=Unstitched"
                            className="w-full bg-neutral-50 dark:bg-zinc-800/60 border border-neutral-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white"
                          />
                        </div>
                        <div className="sm:col-span-1">
                          <label className="block text-[10px] font-mono text-neutral-500 mb-1">Button 1 Style</label>
                          <select
                            value={formData.button1Style}
                            onChange={(e) => handleInputChange('button1Style', e.target.value)}
                            className="w-full bg-neutral-50 dark:bg-zinc-800/60 border border-neutral-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white"
                          >
                            <option value="primary">Solid White</option>
                            <option value="gold">Gold Accent</option>
                            <option value="outline">Glass Outline</option>
                            <option value="secondary">Solid Dark</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Button 2 Configuration */}
                    <div className="pt-2 border-t border-neutral-100 dark:border-zinc-800 space-y-3">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500 block">
                        Button 2 Configuration (Optional)
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-1">
                          <label className="block text-[10px] font-mono text-neutral-500 mb-1">Button 2 Text</label>
                          <input
                            type="text"
                            value={formData.button2Text}
                            onChange={(e) => handleInputChange('button2Text', e.target.value)}
                            placeholder="Atelier Catalog"
                            className="w-full bg-neutral-50 dark:bg-zinc-800/60 border border-neutral-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white"
                          />
                        </div>
                        <div className="sm:col-span-1">
                          <label className="block text-[10px] font-mono text-neutral-500 mb-1">Button 2 URL</label>
                          <input
                            type="text"
                            value={formData.button2Url}
                            onChange={(e) => handleInputChange('button2Url', e.target.value)}
                            placeholder="/shop"
                            className="w-full bg-neutral-50 dark:bg-zinc-800/60 border border-neutral-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white"
                          />
                        </div>
                        <div className="sm:col-span-1">
                          <label className="block text-[10px] font-mono text-neutral-500 mb-1">Button 2 Style</label>
                          <select
                            value={formData.button2Style}
                            onChange={(e) => handleInputChange('button2Style', e.target.value)}
                            className="w-full bg-neutral-50 dark:bg-zinc-800/60 border border-neutral-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white"
                          >
                            <option value="outline">Glass Outline</option>
                            <option value="primary">Solid White</option>
                            <option value="gold">Gold Accent</option>
                            <option value="secondary">Solid Dark</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: MEDIA & BACKGROUND IMAGES */}
                {activeTab === 'media' && (
                  <div className="space-y-5 animate-fade-in">
                    
                    {/* Desktop Image */}
                    <div className="p-4 bg-neutral-50 dark:bg-zinc-800/40 rounded-2xl border border-neutral-200 dark:border-zinc-700/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-mono font-bold uppercase text-neutral-900 dark:text-white flex items-center gap-1.5">
                          <Monitor className="w-3.5 h-3.5 text-blue-500" /> Desktop Background Image *
                        </label>
                        <span className="text-[10px] text-neutral-400 font-mono">Min 1600x900px</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={formData.bgImageDesktop}
                          onChange={(e) => handleInputChange('bgImageDesktop', e.target.value)}
                          placeholder="https://images.unsplash.com/... or upload file"
                          className="flex-1 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white"
                        />
                        <label className="cursor-pointer bg-black text-white dark:bg-white dark:text-black font-mono font-bold text-[10px] uppercase px-3 py-2 rounded-xl flex items-center gap-1 hover:opacity-90 transition-opacity shrink-0">
                          <Upload className="w-3 h-3" />
                          <span>{uploadingDesktop ? 'Uploading...' : 'Upload Storage'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingDesktop}
                            onChange={(e) => handleFileUpload(e, 'bgImageDesktop', setUploadingDesktop)}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Tablet Image */}
                    <div className="p-4 bg-neutral-50 dark:bg-zinc-800/40 rounded-2xl border border-neutral-200 dark:border-zinc-700/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-mono font-bold uppercase text-neutral-900 dark:text-white flex items-center gap-1.5">
                          <Tablet className="w-3.5 h-3.5 text-purple-500" /> Tablet Background Image (Optional)
                        </label>
                        <span className="text-[10px] text-neutral-400 font-mono">Min 1000x750px</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.bgImageTablet}
                          onChange={(e) => handleInputChange('bgImageTablet', e.target.value)}
                          placeholder="Defaults to desktop image if empty"
                          className="flex-1 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white"
                        />
                        <label className="cursor-pointer bg-black text-white dark:bg-white dark:text-black font-mono font-bold text-[10px] uppercase px-3 py-2 rounded-xl flex items-center gap-1 hover:opacity-90 transition-opacity shrink-0">
                          <Upload className="w-3 h-3" />
                          <span>{uploadingTablet ? 'Uploading...' : 'Upload Storage'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingTablet}
                            onChange={(e) => handleFileUpload(e, 'bgImageTablet', setUploadingTablet)}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Mobile Image */}
                    <div className="p-4 bg-neutral-50 dark:bg-zinc-800/40 rounded-2xl border border-neutral-200 dark:border-zinc-700/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-mono font-bold uppercase text-neutral-900 dark:text-white flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5 text-emerald-500" /> Mobile Background Image (Optional)
                        </label>
                        <span className="text-[10px] text-neutral-400 font-mono">Min 800x1000px</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.bgImageMobile}
                          onChange={(e) => handleInputChange('bgImageMobile', e.target.value)}
                          placeholder="Defaults to desktop image if empty"
                          className="flex-1 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white"
                        />
                        <label className="cursor-pointer bg-black text-white dark:bg-white dark:text-black font-mono font-bold text-[10px] uppercase px-3 py-2 rounded-xl flex items-center gap-1 hover:opacity-90 transition-opacity shrink-0">
                          <Upload className="w-3 h-3" />
                          <span>{uploadingMobile ? 'Uploading...' : 'Upload Storage'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingMobile}
                            onChange={(e) => handleFileUpload(e, 'bgImageMobile', setUploadingMobile)}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Video Background */}
                    <div className="p-4 bg-neutral-50 dark:bg-zinc-800/40 rounded-2xl border border-neutral-200 dark:border-zinc-700/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-mono font-bold uppercase text-neutral-900 dark:text-white flex items-center gap-1.5">
                          <Video className="w-3.5 h-3.5 text-amber-500" /> Background Video URL (Optional MP4/WebM)
                        </label>
                        <span className="text-[10px] text-neutral-400 font-mono">Looping autoplay</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.videoUrl}
                          onChange={(e) => handleInputChange('videoUrl', e.target.value)}
                          placeholder="https://... video.mp4"
                          className="flex-1 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white"
                        />
                        <label className="cursor-pointer bg-black text-white dark:bg-white dark:text-black font-mono font-bold text-[10px] uppercase px-3 py-2 rounded-xl flex items-center gap-1 hover:opacity-90 transition-opacity shrink-0">
                          <Upload className="w-3 h-3" />
                          <span>{uploadingVideo ? 'Uploading...' : 'Upload Storage'}</span>
                          <input
                            type="file"
                            accept="video/*"
                            className="hidden"
                            disabled={uploadingVideo}
                            onChange={(e) => handleFileUpload(e, 'videoUrl', setUploadingVideo)}
                          />
                        </label>
                      </div>
                    </div>

                  </div>
                )}

                {/* TAB 3: STYLING & COLORS */}
                {activeTab === 'styling' && (
                  <div className="space-y-6 animate-fade-in">
                    
                    {/* Overlay Opacity Slider */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-mono font-bold uppercase text-neutral-700 dark:text-neutral-300">
                          Overlay Opacity: {Math.round(formData.overlayOpacity * 100)}%
                        </label>
                        <span className="text-[10px] text-neutral-400 font-mono">Darkness vignette</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={formData.overlayOpacity}
                        onChange={(e) => handleInputChange('overlayOpacity', parseFloat(e.target.value))}
                        className="w-full accent-black dark:accent-white cursor-pointer"
                      />
                    </div>

                    {/* Overlay Color Picker & Swatches */}
                    <div className="space-y-2">
                      <label className="block text-xs font-mono font-bold uppercase text-neutral-700 dark:text-neutral-300">
                        Overlay Tint Color
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={formData.overlayColor}
                          onChange={(e) => handleInputChange('overlayColor', e.target.value)}
                          className="w-10 h-10 rounded-xl border-none cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={formData.overlayColor}
                          onChange={(e) => handleInputChange('overlayColor', e.target.value)}
                          className="w-32 bg-neutral-50 dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white font-mono"
                        />
                        <div className="flex gap-1.5">
                          {['#0a0a0a', '#1a0407', '#050a14', '#111827', '#2e1065'].map(color => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => handleInputChange('overlayColor', color)}
                              style={{ backgroundColor: color }}
                              className={`w-6 h-6 rounded-full border border-white/20 transition-transform ${
                                formData.overlayColor === color ? 'scale-125 ring-2 ring-yellow-500' : ''
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Text Alignment */}
                    <div className="space-y-2">
                      <label className="block text-xs font-mono font-bold uppercase text-neutral-700 dark:text-neutral-300">
                        Text Alignment
                      </label>
                      <div className="flex gap-2">
                        {(['left', 'center', 'right'] as const).map((align) => (
                          <button
                            key={align}
                            type="button"
                            onClick={() => handleInputChange('textAlignment', align)}
                            className={`flex-1 py-2.5 rounded-xl border text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                              formData.textAlignment === align
                                ? 'bg-black text-white dark:bg-white dark:text-black border-transparent shadow-sm'
                                : 'border-neutral-200 dark:border-zinc-700 text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                            }`}
                          >
                            {align}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Text Color */}
                    <div className="space-y-2">
                      <label className="block text-xs font-mono font-bold uppercase text-neutral-700 dark:text-neutral-300">
                        Text Color
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleInputChange('textColor', 'white')}
                          className={`flex-1 py-2.5 rounded-xl border text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                            formData.textColor === 'white'
                              ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                              : 'border-neutral-200 dark:border-zinc-700 text-neutral-500'
                          }`}
                        >
                          Light / White
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInputChange('textColor', 'dark')}
                          className={`flex-1 py-2.5 rounded-xl border text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                            formData.textColor === 'dark'
                              ? 'bg-white text-black border-neutral-300 shadow-sm'
                              : 'border-neutral-200 dark:border-zinc-700 text-neutral-500'
                          }`}
                        >
                          Dark Obsidian
                        </button>
                      </div>
                    </div>

                  </div>
                )}

                {/* TAB 4: VISIBILITY & SCHEDULING */}
                {activeTab === 'scheduling' && (
                  <div className="space-y-5 animate-fade-in">
                    
                    {/* Active Status Switch */}
                    <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-zinc-800/40 rounded-2xl border border-neutral-200 dark:border-zinc-700/60">
                      <div>
                        <h4 className="text-xs font-mono font-bold uppercase text-neutral-900 dark:text-white">
                          Banner Active Status
                        </h4>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          Only active banners appear on the live website hero slider.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleInputChange('isActive', !formData.isActive)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                          formData.isActive ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-zinc-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            formData.isActive ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Schedule Dates */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-mono font-bold uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                          Start Date (Optional)
                        </label>
                        <input
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => handleInputChange('startDate', e.target.value)}
                          className="w-full bg-neutral-50 dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono font-bold uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                          End Date (Optional)
                        </label>
                        <input
                          type="date"
                          value={formData.endDate}
                          onChange={(e) => handleInputChange('endDate', e.target.value)}
                          className="w-full bg-neutral-50 dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 5: SEO METADATA */}
                {activeTab === 'seo' && (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <label className="block text-xs font-mono font-bold uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                        SEO Banner Title
                      </label>
                      <input
                        type="text"
                        value={formData.seoTitle}
                        onChange={(e) => handleInputChange('seoTitle', e.target.value)}
                        placeholder="e.g. Sartorial Needlework Unstitched Chiffon Edit"
                        className="w-full bg-neutral-50 dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono font-bold uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                        Image Alt Text (Accessibility & Search Engine Index)
                      </label>
                      <input
                        type="text"
                        value={formData.seoAltText}
                        onChange={(e) => handleInputChange('seoAltText', e.target.value)}
                        placeholder="e.g. Fine gold zari embroidery on sheer floating chiffon silk fabric"
                        className="w-full bg-neutral-50 dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono font-bold uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                        SEO Description
                      </label>
                      <textarea
                        rows={2}
                        value={formData.seoDescription}
                        onChange={(e) => handleInputChange('seoDescription', e.target.value)}
                        placeholder="Meta description for search engines..."
                        className="w-full bg-neutral-50 dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 rounded-xl p-3 text-xs text-neutral-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}

                {/* Bottom Submit Buttons */}
                <div className="pt-4 border-t border-neutral-200 dark:border-zinc-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => { setEditingBanner(null); setIsCreating(false); }}
                    className="px-5 py-2.5 rounded-xl border border-neutral-200 dark:border-zinc-700 text-xs font-mono font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-black text-white dark:bg-white dark:text-black hover:opacity-90 font-mono font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {saving ? (
                      <BrandedLoader variant="button" />
                    ) : (
                      <>
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span>{editingBanner ? 'Save Changes' : 'Create Banner'}</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>

            {/* RIGHT COLUMN: LIVE INTERACTIVE BANNER PREVIEW (5 COLS) */}
            <div className="lg:col-span-5 sticky top-6 space-y-4">
              
              {/* Preview Bar Controls */}
              <div className="flex items-center justify-between bg-neutral-100 dark:bg-zinc-800/80 p-2 rounded-2xl border border-neutral-200 dark:border-zinc-700">
                <span className="text-[10px] font-mono font-bold uppercase text-neutral-500 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-emerald-500 animate-pulse" /> Live Preview
                </span>

                {/* Device Switcher */}
                <div className="flex gap-1 bg-white dark:bg-zinc-900 p-1 rounded-xl border border-neutral-200 dark:border-zinc-700">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      previewDevice === 'desktop' ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-neutral-400'
                    }`}
                    title="Desktop Preview"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('tablet')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      previewDevice === 'tablet' ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-neutral-400'
                    }`}
                    title="Tablet Preview"
                  >
                    <Tablet className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      previewDevice === 'mobile' ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-neutral-400'
                    }`}
                    title="Mobile Preview"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Dynamic Aspect Ratio Preview Box */}
              <div
                className={`mx-auto transition-all duration-300 relative rounded-3xl overflow-hidden shadow-2xl border border-neutral-800 bg-black flex items-center ${
                  previewDevice === 'desktop'
                    ? 'w-full aspect-[16/9]'
                    : previewDevice === 'tablet'
                    ? 'w-full max-w-sm aspect-[4/3]'
                    : 'w-full max-w-[280px] aspect-[9/16]'
                }`}
              >
                {/* Background Image / Video */}
                {formData.videoUrl ? (
                  <video
                    src={formData.videoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={
                      previewDevice === 'mobile' && formData.bgImageMobile
                        ? formData.bgImageMobile
                        : previewDevice === 'tablet' && formData.bgImageTablet
                        ? formData.bgImageTablet
                        : formData.bgImageDesktop || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1600&auto=format&fit=crop&q=80'
                    }
                    alt={formData.seoAltText || formData.heading}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}

                {/* Customizable Overlay Tint */}
                <div
                  className="absolute inset-0 transition-all"
                  style={{
                    backgroundColor: formData.overlayColor || '#000000',
                    opacity: formData.overlayOpacity ?? 0.5
                  }}
                />

                {/* Banner Content Preview */}
                <div
                  className={`relative z-10 p-5 sm:p-6 w-full space-y-3 ${
                    formData.textColor === 'dark' ? 'text-black' : 'text-white'
                  } ${
                    formData.textAlignment === 'center'
                      ? 'text-center'
                      : formData.textAlignment === 'right'
                      ? 'text-right'
                      : 'text-left'
                  }`}
                >
                  {formData.tagline && (
                    <div className="flex items-center gap-1 text-[8px] sm:text-[10px] font-bold uppercase tracking-widest font-mono text-yellow-400">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>{formData.tagline}</span>
                    </div>
                  )}

                  {formData.heading && (
                    <h1 className="text-lg sm:text-2xl font-light tracking-tight font-display leading-tight">
                      {formData.heading}
                    </h1>
                  )}

                  {formData.subheading && (
                    <p className="text-[10px] sm:text-xs font-semibold opacity-90 font-sans">
                      {formData.subheading}
                    </p>
                  )}

                  {formData.description && previewDevice !== 'mobile' && (
                    <p className="text-[9px] sm:text-[11px] opacity-75 leading-relaxed font-light line-clamp-2">
                      {formData.description}
                    </p>
                  )}

                  {/* Buttons Preview */}
                  <div
                    className={`flex flex-wrap gap-2 pt-2 ${
                      formData.textAlignment === 'center'
                        ? 'justify-center'
                        : formData.textAlignment === 'right'
                        ? 'justify-end'
                        : 'justify-start'
                    }`}
                  >
                    {formData.button1Text && (
                      <span
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-bold tracking-wider uppercase font-mono shadow-sm ${
                          formData.button1Style === 'gold'
                            ? 'bg-yellow-400 text-black'
                            : formData.button1Style === 'outline'
                            ? 'bg-white/10 text-white border border-white/30 backdrop-blur-sm'
                            : formData.button1Style === 'secondary'
                            ? 'bg-black text-white'
                            : 'bg-white text-black'
                        }`}
                      >
                        {formData.button1Text}
                      </span>
                    )}

                    {formData.button2Text && previewDevice !== 'mobile' && (
                      <span
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-bold tracking-wider uppercase font-mono ${
                          formData.button2Style === 'gold'
                            ? 'bg-yellow-400 text-black'
                            : formData.button2Style === 'primary'
                            ? 'bg-white text-black'
                            : formData.button2Style === 'secondary'
                            ? 'bg-black text-white'
                            : 'bg-white/10 text-white border border-white/30 backdrop-blur-sm'
                        }`}
                      >
                        {formData.button2Text}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-[10px] font-mono text-center text-neutral-400">
                Live Preview updates instantly as you edit content & media.
              </p>
            </div>

          </div>
        </div>
      ) : null}

      {/* BANNER LIST TABLE / CARDS VIEW */}
      <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
        
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase text-neutral-500">
              Active Hero Banners Registry ({banners.length})
            </span>
          </div>
          <p className="text-[10px] font-mono text-neutral-400">
            Use arrows to reorder slider sequence on live site
          </p>
        </div>

        {banners.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Sliders className="w-10 h-10 text-neutral-300 dark:text-zinc-700 mx-auto" />
            <p className="text-xs text-neutral-500 font-mono">No hero banners configured yet.</p>
            <button
              onClick={handleAddNew}
              className="inline-flex items-center gap-1.5 bg-black text-white dark:bg-white dark:text-black font-mono text-xs font-bold px-4 py-2 rounded-xl"
            >
              <Plus className="w-3.5 h-3.5" />
              Create First Banner
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {banners.map((banner, index) => (
              <div
                key={banner.id}
                className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl border transition-all gap-4 ${
                  banner.isActive
                    ? 'bg-neutral-50/50 dark:bg-zinc-800/40 border-neutral-200 dark:border-zinc-700/60'
                    : 'bg-neutral-100/40 dark:bg-zinc-900/40 border-neutral-200/50 dark:border-zinc-800/50 opacity-60'
                }`}
              >
                {/* Banner Thumbnail & Title Info */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  
                  {/* Order controls */}
                  <div className="flex flex-col items-center justify-center gap-1 pr-2 border-r border-neutral-200 dark:border-zinc-700">
                    <button
                      onClick={() => handleMoveOrder(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-neutral-400 hover:text-black dark:hover:text-white disabled:opacity-20 cursor-pointer"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-mono font-bold text-neutral-500">
                      #{index + 1}
                    </span>
                    <button
                      onClick={() => handleMoveOrder(index, 'down')}
                      disabled={index === banners.length - 1}
                      className="p-1 text-neutral-400 hover:text-black dark:hover:text-white disabled:opacity-20 cursor-pointer"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Thumbnail Image */}
                  <div className="w-20 h-14 rounded-xl overflow-hidden bg-black shrink-0 relative border border-neutral-200 dark:border-zinc-700">
                    <img
                      src={banner.bgImageDesktop}
                      alt={banner.heading}
                      className="w-full h-full object-cover"
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundColor: banner.overlayColor || '#000',
                        opacity: banner.overlayOpacity ?? 0.5
                      }}
                    />
                  </div>

                  {/* Heading & Metadata */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate font-sans">
                        {banner.heading}
                      </h4>
                      {banner.isActive ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-neutral-200 text-neutral-600 dark:bg-zinc-800 dark:text-neutral-400">
                          DISABLED
                        </span>
                      )}
                      {(banner.startDate || banner.endDate) && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          <span>{banner.startDate || 'Now'} → {banner.endDate || 'Endless'}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                      {banner.subheading ? `${banner.subheading} — ` : ''}{banner.description || 'No description'}
                    </p>
                  </div>
                </div>

                {/* Banner Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  
                  {/* Toggle Active Switch */}
                  <button
                    onClick={() => handleToggleActive(banner)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                      banner.isActive
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                        : 'bg-neutral-200 text-neutral-600 dark:bg-zinc-800 dark:text-neutral-400'
                    }`}
                  >
                    {banner.isActive ? 'Enabled' : 'Disabled'}
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => handleEdit(banner)}
                    className="p-2 rounded-xl bg-neutral-100 dark:bg-zinc-800 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors cursor-pointer"
                    title="Edit Banner"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  {/* Duplicate */}
                  <button
                    onClick={() => handleDuplicate(banner)}
                    className="p-2 rounded-xl bg-neutral-100 dark:bg-zinc-800 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors cursor-pointer"
                    title="Duplicate Banner"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(banner.id, banner.heading)}
                    className="p-2 rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                    title="Delete Banner"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
};
