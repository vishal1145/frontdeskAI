import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Check, Image as ImageIcon, Sparkles, AlertCircle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { ICON_OPTIONS, COLOR_OPTIONS, ProfileIcon, parseProfileIcon } from './ProfileIcon';

export default function ProfileIconModal({
  isOpen,
  onClose,
  currentIcon,
  isMedical = false,
  clinicName = 'Clinic',
  onApply
}) {
  const [activeTab, setActiveTab] = useState('preset'); // 'preset' | 'upload'
  const [selectedIconId, setSelectedIconId] = useState(isMedical ? 'pill' : 'building');
  const [selectedColorId, setSelectedColorId] = useState(isMedical ? 'emerald' : 'blue');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileInputRef = useRef(null);

  // Sync state whenever modal opens or currentIcon changes
  useEffect(() => {
    if (!isOpen) return;

    const parsed = parseProfileIcon(currentIcon, isMedical);
    if (parsed.type === 'custom') {
      setActiveTab('upload');
      setCustomImageUrl(parsed.url);
      setSelectedIconId(isMedical ? 'pill' : 'building');
      setSelectedColorId(isMedical ? 'emerald' : 'blue');
    } else {
      setActiveTab('preset');
      setCustomImageUrl('');
      setSelectedIconId(parsed.iconId);
      setSelectedColorId(parsed.colorId);
    }
  }, [isOpen, currentIcon, isMedical]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentPreviewString = activeTab === 'upload' && customImageUrl
    ? customImageUrl
    : `${selectedIconId}:${selectedColorId}`;

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WebP, SVG)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5 MB');
      return;
    }

    setIsProcessingImage(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          // Resize to max 180x180 canvas for ultra-compact storage
          const canvas = document.createElement('canvas');
          const maxSize = 180;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxSize) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = Math.round((width * maxSize) / height);
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const compressed = canvas.toDataURL('image/jpeg', 0.88);
          setCustomImageUrl(compressed);
          setActiveTab('upload');
          toast.success('Custom logo uploaded!');
        } catch (err) {
          console.error(err);
          // Fallback to raw data url if canvas fails
          setCustomImageUrl(event.target.result);
        } finally {
          setIsProcessingImage(false);
        }
      };
      img.onerror = () => {
        setIsProcessingImage(false);
        toast.error('Failed to load image');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    // Reset file input value
    e.target.value = '';
  };

  const handleApply = () => {
    onApply(currentPreviewString);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Update Profile Icon"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 via-white to-white">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Update Profile Icon & Logo
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Customize your clinic's brand symbol or upload a logo</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 grid place-items-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Live Preview Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3.5">
            <ProfileIcon
              icon={currentPreviewString}
              isMedical={isMedical}
              containerClassName="w-14 h-14 rounded-2xl shadow-sm shrink-0"
              iconClassName="w-7 h-7"
            />
            <div className="min-w-0 flex-1">
              <span className="text-10 font-bold uppercase tracking-wider text-slate-400 block">
                Preview in Profile
              </span>
              <h4 className="text-sm font-bold text-slate-900 truncate">
                {clinicName || (isMedical ? 'Pharmacy' : 'Clinic')}
              </h4>
              <p className="text-xs text-slate-500 truncate">
                {activeTab === 'upload' && customImageUrl
                  ? 'Custom Uploaded Logo'
                  : `${ICON_OPTIONS.find((i) => i.id === selectedIconId)?.label || 'Icon'} • ${COLOR_OPTIONS.find((c) => c.id === selectedColorId)?.name || 'Theme'}`}
              </p>
            </div>
            {activeTab === 'upload' && customImageUrl && (
              <button
                type="button"
                onClick={() => {
                  setCustomImageUrl('');
                  setActiveTab('preset');
                }}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                title="Remove custom logo"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            )}
          </div>

          {/* Mode Switch Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('preset')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'preset'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              Choose Icon Preset
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'upload'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Custom Logo
            </button>
          </div>

          {activeTab === 'preset' ? (
            <>
              {/* Preset Icon Grid */}
              <div>
                <label className="text-11 font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Select Symbol
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {ICON_OPTIONS.map((item) => {
                    const IconCmp = item.icon;
                    const isSelected = selectedIconId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedIconId(item.id)}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 text-blue-700 font-semibold shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg grid place-items-center mb-1.5 transition-colors ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <IconCmp className="w-4 h-4" />
                        </div>
                        <span className="text-11 leading-tight line-clamp-1">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Theme Selector */}
              <div>
                <label className="text-11 font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Theme Color
                </label>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {COLOR_OPTIONS.map((color) => {
                    const isSelected = selectedColorId === color.id;
                    return (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => setSelectedColorId(color.id)}
                        className={`w-9 h-9 rounded-xl ${color.bg} grid place-items-center transition-all cursor-pointer ${
                          isSelected
                            ? 'ring-2 ring-offset-2 ring-blue-600 scale-105 shadow-sm'
                            : 'hover:scale-105 opacity-90 hover:opacity-100'
                        }`}
                        title={color.name}
                        aria-label={color.name}
                      >
                        {isSelected && <Check className="w-4 h-4 text-white stroke-[2.5]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* Upload Custom Logo Tab */
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                onChange={handleImageFileChange}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/60 hover:bg-blue-50/20 group"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 grid place-items-center mb-3 group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <h5 className="text-sm font-bold text-slate-900 mb-1">
                  Click to choose an image file
                </h5>
                <p className="text-xs text-slate-500 max-w-xs">
                  PNG, JPG, WebP, or SVG up to 5 MB. Automatically formatted to square icon.
                </p>
                <button
                  type="button"
                  className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-xs group-hover:border-blue-300 group-hover:text-blue-700"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Browse Device
                </button>
              </div>

              {customImageUrl && (
                <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Custom image is ready to apply. Click "Apply Icon" below.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/60">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            Apply Icon
          </button>
        </div>
      </div>
    </div>
  );
}

