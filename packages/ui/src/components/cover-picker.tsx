'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Upload as UploadIcon,
  Search,
  Loader2,
  AlertCircle,
  X,
  Link as LinkIcon,
} from 'lucide-react';
import { cn } from '../lib/utils';
import {
  uploadImage,
  searchUnsplash,
  trackUnsplashDownload,
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  MediaResult,
} from '../lib/media-api';

export interface CoverPreset {
  id: string;
  name: string;
  value: string;
  isGradientOrColor?: boolean;
}

export const COLOR_AND_GRADIENT_PRESETS: CoverPreset[] = [
  { id: 'coral', name: 'Coral Red', value: '#e05d5d', isGradientOrColor: true },
  { id: 'gold', name: 'Warm Yellow', value: '#f5ba42', isGradientOrColor: true },
  { id: 'blue', name: 'Sky Blue', value: '#2698d6', isGradientOrColor: true },
  { id: 'cream', name: 'Warm Cream', value: '#fdf6ed', isGradientOrColor: true },
  {
    id: 'grad-teal-sand',
    name: 'Teal Sand',
    value: 'linear-gradient(135deg, #74ebd5 0%, #acb6e5 100%)',
    isGradientOrColor: true,
  },
  { id: 'pink', name: 'Hot Pink', value: '#ff2d75', isGradientOrColor: true },
  {
    id: 'grad-sunset',
    name: 'Soft Sunset',
    value: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)',
    isGradientOrColor: true,
  },
  {
    id: 'grad-dusk',
    name: 'Deep Dusk',
    value: 'linear-gradient(135deg, #2b5876 0%, #4e4376 50%, #e53e3e 100%)',
    isGradientOrColor: true,
  },
  {
    id: 'grad-emerald',
    name: 'Emerald Teal',
    value: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)',
    isGradientOrColor: true,
  },
  {
    id: 'grad-editorial',
    name: 'Monochrome Editorial',
    value: 'linear-gradient(to bottom right, #ebebe9, #dcdcd8, #c8c8c4)',
    isGradientOrColor: true,
  },
];

export const TEXTURELABS_PRESETS: CoverPreset[] = [
  {
    id: 'texture-sand-speckle',
    name: 'Speckled Concrete',
    value: 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?q=80&w=1200',
  },
  {
    id: 'texture-weathered-patina',
    name: 'Weathered Patina',
    value: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1200',
  },
  {
    id: 'texture-moss-wall',
    name: 'Moss Surface',
    value: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1200',
  },
  {
    id: 'texture-urban-asphalt',
    name: 'Urban Asphalt',
    value: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200',
  },
  {
    id: 'texture-iridescent-metal',
    name: 'Iridescent Metal',
    value: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1200',
  },
  {
    id: 'texture-bronze-rust',
    name: 'Bronze Rust',
    value: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200',
  },
  {
    id: 'texture-brushed-steel',
    name: 'Brushed Steel',
    value: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=1200',
  },
  {
    id: 'texture-slate-rock',
    name: 'Dark Slate',
    value: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?q=80&w=1200',
  },
];

export interface CoverPickerProps {
  currentCover?: string | null;
  onSelect: (cover: string | null) => void;
  onClose?: () => void;
  isDark?: boolean;
  token?: string | null;
}

export function CoverPicker({
  currentCover,
  onSelect,
  onClose,
  isDark = true,
  token,
}: CoverPickerProps) {
  const [activeTab, setActiveTab] = useState<'gallery' | 'upload' | 'link' | 'unsplash'>('gallery');
  const [linkValue, setLinkValue] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);

  // Upload tab state
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Unsplash tab state
  const [unsplashQuery, setUnsplashQuery] = useState('');
  const [unsplashResults, setUnsplashResults] = useState<MediaResult[]>([]);
  const [unsplashLoading, setUnsplashLoading] = useState(false);
  const [unsplashError, setUnsplashError] = useState<string | null>(null);

  // Live Unsplash API fetch (queries Unsplash API directly, no dummy fallbacks)
  useEffect(() => {
    if (activeTab !== 'unsplash') return;

    const controller = new AbortController();
    const query = unsplashQuery.trim();

    setUnsplashLoading(true);
    setUnsplashError(null);

    const timer = setTimeout(async () => {
      try {
        const results = await searchUnsplash(query, controller.signal);
        if (results && Array.isArray(results)) {
          setUnsplashResults(results);
        } else {
          setUnsplashResults([]);
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        setUnsplashResults([]);
        setUnsplashError(err?.message || 'Could not fetch images.');
      } finally {
        if (!controller.signal.aborted) setUnsplashLoading(false);
      }
    }, query ? 350 : 0);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [unsplashQuery, activeTab]);

  // Handle file upload with local Base64 fallback
  const handleFileUpload = async (file?: File | null) => {
    if (!file) return;
    setUploadError(null);
    setUploadBusy(true);

    try {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        throw new Error('Please select a PNG, JPEG, GIF or WebP file.');
      }
      if (file.size > MAX_IMAGE_BYTES) {
        throw new Error(`File is too large. Max size is ${MAX_IMAGE_BYTES / 1024 / 1024} MB.`);
      }

      try {
        const url = await uploadImage(file, token);
        onSelect(url);
        onClose?.();
        return;
      } catch (cloudErr) {
        // Fallback to local Data URL
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string;
          if (dataUrl) {
            onSelect(dataUrl);
            onClose?.();
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      setUploadError(err?.message || 'Upload failed.');
    } finally {
      setUploadBusy(false);
    }
  };

  // Handle link submit
  const handleLinkSubmit = () => {
    const val = linkValue.trim();
    if (!val) return;
    try {
      const parsed = new URL(val);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error();
      }
      onSelect(val);
      onClose?.();
    } catch {
      setLinkError('Please enter a valid URL starting with http:// or https://');
    }
  };

  return (
    <div
      className={cn(
        'w-[460px] sm:w-[500px] max-w-[94vw] rounded-xl shadow-2xl border flex flex-col overflow-hidden select-none animate-in fade-in zoom-in-95 duration-150',
        isDark
          ? 'bg-[#202020] text-[#e0e0e0] border-white/10'
          : 'bg-[#ffffff] text-[#1a1a1a] border-black/10'
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Header Tabs */}
      <div
        className={cn(
          'flex items-center justify-between border-b px-3 pt-2 pb-0',
          isDark ? 'border-white/10' : 'border-black/10'
        )}
      >
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('gallery')}
            className={cn(
              'pb-2 text-xs font-medium cursor-pointer transition-colors relative',
              activeTab === 'gallery'
                ? isDark
                  ? 'text-white border-b-2 border-white'
                  : 'text-black border-b-2 border-black'
                : 'text-gray-400 hover:text-gray-200 border-b-2 border-transparent'
            )}
          >
            Gallery
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={cn(
              'pb-2 text-xs font-medium cursor-pointer transition-colors relative',
              activeTab === 'upload'
                ? isDark
                  ? 'text-white border-b-2 border-white'
                  : 'text-black border-b-2 border-black'
                : 'text-gray-400 hover:text-gray-200 border-b-2 border-transparent'
            )}
          >
            Upload
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('link')}
            className={cn(
              'pb-2 text-xs font-medium cursor-pointer transition-colors relative',
              activeTab === 'link'
                ? isDark
                  ? 'text-white border-b-2 border-white'
                  : 'text-black border-b-2 border-black'
                : 'text-gray-400 hover:text-gray-200 border-b-2 border-transparent'
            )}
          >
            Link
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('unsplash')}
            className={cn(
              'pb-2 text-xs font-medium cursor-pointer transition-colors relative flex items-center gap-1.5',
              activeTab === 'unsplash'
                ? isDark
                  ? 'text-white border-b-2 border-white'
                  : 'text-black border-b-2 border-black'
                : 'text-gray-400 hover:text-gray-200 border-b-2 border-transparent'
            )}
          >
            {/* Unsplash icon */}
            <svg viewBox="0 0 24 24" className="size-3 fill-current">
              <path d="M7.5 6.75V0h9v6.75h-9zm9 3.75H24V24H0V10.5h7.5v6.75h9V10.5z" />
            </svg>
            <span>Unsplash</span>
          </button>
        </div>

        {/* Remove button */}
        <button
          type="button"
          onClick={() => {
            onSelect(null);
            onClose?.();
          }}
          className={cn(
            'text-xs pb-2 cursor-pointer transition-colors font-medium',
            isDark ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-600'
          )}
        >
          Remove
        </button>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'gallery' && (
        <div className="p-4 space-y-4 max-h-[380px] overflow-y-auto [scrollbar-width:thin]">
          {/* Section 1: Color & Gradient */}
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-gray-400 tracking-wide uppercase px-0.5">
              Color &amp; Gradient
            </div>
            <div className="grid grid-cols-4 gap-2">
              {COLOR_AND_GRADIENT_PRESETS.map((preset) => {
                const isSelected = currentCover === preset.value;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      onSelect(preset.value);
                      onClose?.();
                    }}
                    title={preset.name}
                    className={cn(
                      'h-14 rounded-lg overflow-hidden border transition-all cursor-pointer hover:scale-103 shadow-xs relative group',
                      isSelected
                        ? isDark
                          ? 'border-white ring-2 ring-white/50'
                          : 'border-black ring-2 ring-black/40'
                        : isDark
                          ? 'border-white/10 hover:border-white/30'
                          : 'border-black/10 hover:border-black/30'
                    )}
                    style={{ background: preset.value }}
                  />
                );
              })}
            </div>
          </div>

          {/* Section 2: Texturelabs */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <div className="text-[11px] font-semibold text-gray-400 tracking-wide uppercase px-0.5">
              Texturelabs
            </div>
            <div className="grid grid-cols-4 gap-2">
              {TEXTURELABS_PRESETS.map((preset) => {
                const isSelected = currentCover === preset.value;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      onSelect(preset.value);
                      onClose?.();
                    }}
                    title={preset.name}
                    className={cn(
                      'h-16 rounded-lg overflow-hidden border transition-all cursor-pointer hover:scale-103 shadow-xs relative group bg-black/40',
                      isSelected
                        ? isDark
                          ? 'border-white ring-2 ring-white/50'
                          : 'border-black ring-2 ring-black/40'
                        : isDark
                          ? 'border-white/10 hover:border-white/30'
                          : 'border-black/10 hover:border-black/30'
                    )}
                  >
                    <img
                      src={preset.value}
                      alt={preset.name}
                      loading="lazy"
                      className="size-full object-cover transition-transform group-hover:scale-110"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div className="p-4 space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(',')}
            className="hidden"
            onChange={(e) => {
              handleFileUpload(e.target.files?.[0]);
              e.target.value = '';
            }}
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-center',
              isDark
                ? 'border-white/15 hover:border-white/30 hover:bg-white/[0.04]'
                : 'border-black/15 hover:border-black/30 hover:bg-black/[0.03]'
            )}
          >
            {uploadBusy ? (
              <Loader2 className="size-8 animate-spin text-blue-400" />
            ) : (
              <UploadIcon className="size-8 text-gray-400" />
            )}
            <div className="text-xs font-medium">
              {uploadBusy ? 'Uploading cover...' : 'Upload an image'}
            </div>
            <div className="text-[11px] text-gray-500">
              The recommended dimension is 1500 &times; 600. Max size: 5 MB.
            </div>
          </div>

          {uploadError && (
            <div className="flex items-center gap-1.5 text-xs text-red-400">
              <AlertCircle className="size-3.5 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      )}

      {/* Link Tab */}
      {activeTab === 'link' && (
        <div className="p-4 space-y-3">
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg border text-xs',
              isDark
                ? 'bg-black/30 border-white/15 text-white focus-within:border-white/40'
                : 'bg-black/5 border-black/15 text-black focus-within:border-black/40'
            )}
          >
            <LinkIcon className="size-3.5 shrink-0 text-gray-400" />
            <input
              type="text"
              value={linkValue}
              onChange={(e) => {
                setLinkValue(e.target.value);
                setLinkError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleLinkSubmit();
              }}
              placeholder="Paste an image link..."
              className="w-full bg-transparent outline-none placeholder:text-gray-500 text-xs"
              autoFocus
            />
          </div>

          <button
            type="button"
            onClick={handleLinkSubmit}
            disabled={!linkValue.trim()}
            className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit
          </button>

          <p className="text-center text-[11px] text-gray-400">
            Works with any direct image URL.
          </p>

          {linkError && (
            <div className="flex items-center gap-1.5 text-xs text-red-400">
              <AlertCircle className="size-3.5 shrink-0" />
              <span>{linkError}</span>
            </div>
          )}
        </div>
      )}

      {/* Unsplash Tab */}
      {activeTab === 'unsplash' && (
        <div className="p-3 space-y-3">
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg border text-xs',
              isDark
                ? 'bg-black/30 border-white/15 text-white focus-within:border-white/40'
                : 'bg-black/5 border-black/15 text-black focus-within:border-black/40'
            )}
          >
            <Search className="size-3.5 shrink-0 text-gray-400" />
            <input
              type="text"
              value={unsplashQuery}
              onChange={(e) => setUnsplashQuery(e.target.value)}
              placeholder="Search for an image..."
              className="w-full bg-transparent outline-none placeholder:text-gray-500 text-xs"
              autoFocus
            />
            {unsplashQuery && (
              <button
                type="button"
                onClick={() => setUnsplashQuery('')}
                className="p-0.5 rounded hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          <div className="h-[280px] overflow-y-auto pr-1 [scrollbar-width:thin]">
            {unsplashLoading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="size-6 animate-spin text-gray-400" />
              </div>
            ) : unsplashError ? (
              <div className="p-4 text-center text-xs text-red-400">{unsplashError}</div>
            ) : unsplashResults.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400">No images found</div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {unsplashResults.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      trackUnsplashDownload(item.downloadLocation);
                      onSelect(item.url);
                      onClose?.();
                    }}
                    title={item.authorName ? `${item.alt} by ${item.authorName}` : item.alt}
                    className="group relative aspect-[16/10] rounded-lg overflow-hidden border border-white/10 bg-black/40 cursor-pointer"
                  >
                    <img
                      src={item.thumbUrl}
                      alt={item.alt}
                      loading="lazy"
                      className="size-full object-cover transition-transform group-hover:scale-105"
                    />
                    {item.authorName && (
                      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 py-1 text-left text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity truncate">
                        {item.authorName}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="text-[10px] text-center text-gray-500">Photos by Unsplash</div>
        </div>
      )}
    </div>
  );
}
