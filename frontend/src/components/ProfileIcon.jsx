import React from 'react';
import {
  Building2,
  Stethoscope,
  HeartPulse,
  Pill,
  Cross,
  Activity,
  Smile,
  Eye,
  ShieldCheck,
  UserCheck,
  Sparkles,
  Baby,
  BriefcaseMedical
} from 'lucide-react';

export const ICON_OPTIONS = [
  { id: 'building', label: 'Hospital / Clinic', icon: Building2 },
  { id: 'stethoscope', label: 'Stethoscope / Doctor', icon: Stethoscope },
  { id: 'heart-pulse', label: 'Heart & Cardiology', icon: HeartPulse },
  { id: 'pill', label: 'Pharmacy & Medicine', icon: Pill },
  { id: 'cross', label: 'Medical Cross', icon: Cross },
  { id: 'activity', label: 'Health & Vitals', icon: Activity },
  { id: 'briefcase', label: 'Medical Kit', icon: BriefcaseMedical },
  { id: 'smile', label: 'Dental & Smile', icon: Smile },
  { id: 'eye', label: 'Eye Care / Vision', icon: Eye },
  { id: 'shield-check', label: 'Verified Care', icon: ShieldCheck },
  { id: 'user-check', label: 'Doctor Specialist', icon: UserCheck },
  { id: 'sparkles', label: 'Modern & Aesthetics', icon: Sparkles },
  { id: 'baby', label: 'Pediatrics / Care', icon: Baby },
];

export const COLOR_OPTIONS = [
  { id: 'blue', name: 'Blue', bg: 'bg-blue-600', ring: 'ring-blue-500', text: 'text-white' },
  { id: 'indigo', name: 'Indigo', bg: 'bg-indigo-600', ring: 'ring-indigo-500', text: 'text-white' },
  { id: 'emerald', name: 'Emerald', bg: 'bg-emerald-600', ring: 'ring-emerald-500', text: 'text-white' },
  { id: 'teal', name: 'Teal', bg: 'bg-teal-600', ring: 'ring-teal-500', text: 'text-white' },
  { id: 'purple', name: 'Purple', bg: 'bg-purple-600', ring: 'ring-purple-500', text: 'text-white' },
  { id: 'rose', name: 'Rose', bg: 'bg-rose-600', ring: 'ring-rose-500', text: 'text-white' },
  { id: 'amber', name: 'Amber', bg: 'bg-amber-600', ring: 'ring-amber-500', text: 'text-white' },
  { id: 'slate', name: 'Slate', bg: 'bg-slate-800', ring: 'ring-slate-700', text: 'text-white' },
];

export function ProfileIcon({
  icon = '',
  isMedical = false,
  containerClassName = 'w-10 h-10 rounded-xl',
  iconClassName = 'w-5 h-5',
  alt = 'Profile Icon'
}) {
  const iconStr = icon || (isMedical ? 'pill:blue' : 'building:blue');

  // Custom image (Data URL or HTTP URL)
  if (iconStr.startsWith('data:image') || iconStr.startsWith('http://') || iconStr.startsWith('https://')) {
    return (
      <div className={`overflow-hidden grid place-items-center bg-slate-100 border border-slate-200 shadow-xs ${containerClassName}`}>
        <img src={iconStr} alt={alt} className="w-full h-full object-cover" />
      </div>
    );
  }

  const [iconId, colorId = 'blue'] = iconStr.split(':');
  const matchedColor = COLOR_OPTIONS.find((c) => c.id === colorId) || COLOR_OPTIONS[0];
  const matchedIcon = ICON_OPTIONS.find((i) => i.id === iconId);
  const IconComponent = matchedIcon?.icon || (isMedical ? Pill : Building2);

  return (
    <div className={`grid place-items-center ${matchedColor.bg} ${matchedColor.text} shadow-xs ${containerClassName}`}>
      <IconComponent className={iconClassName} />
    </div>
  );
}

export function parseProfileIcon(iconStr, isMedical = false) {
  if (!iconStr) {
    return {
      type: 'preset',
      iconId: isMedical ? 'pill' : 'building',
      colorId: 'blue'
    };
  }
  if (iconStr.startsWith('data:image') || iconStr.startsWith('http://') || iconStr.startsWith('https://')) {
    return {
      type: 'custom',
      url: iconStr
    };
  }
  const [iconId = isMedical ? 'pill' : 'building', colorId = 'blue'] = iconStr.split(':');
  return {
    type: 'preset',
    iconId,
    colorId
  };
}

