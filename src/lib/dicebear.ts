import { DiceBearAvatarStyle } from '../types';

export interface AvatarRosterItem {
  id: string;
  name: string;
  style: DiceBearAvatarStyle;
  seed: string;
  tag: string;
  options?: Record<string, any>;
}

export interface AvatarBgColorOption {
  id: string;
  label: string;
  hex: string;
}

// Background color options
export const AVATAR_BG_COLORS: AvatarBgColorOption[] = [
  { id: 'obsidian', label: 'Obsidian', hex: '#12141F' },
  { id: 'crimson', label: 'Blood Crimson', hex: '#7F1D1D' },
  { id: 'cobalt', label: 'Royal Cobalt', hex: '#1E3A8A' },
  { id: 'emerald', label: 'Matrix Mint', hex: '#064E3B' },
  { id: 'amber', label: 'Molten Gold', hex: '#78350F' },
  { id: 'violet', label: 'Cyber Violet', hex: '#581C87' },
  { id: 'slate', label: 'Titanium Slate', hex: '#334155' },
  { id: 'volt', label: 'Electric Volt', hex: '#3F4900' },
];

// Character avatar roster
export const AVATAR_ROSTER: AvatarRosterItem[] = [
  // Miniavs
  { id: 'miniavs-titan', name: 'Titan', style: 'miniavs', seed: 'Titan', tag: 'Heavy Lifter' },
  { id: 'miniavs-atlas', name: 'Atlas', style: 'miniavs', seed: 'Atlas', tag: 'Power Athlete' },
  { id: 'miniavs-valkyrie', name: 'Valkyrie', style: 'miniavs', seed: 'Valkyrie', tag: 'Cross Training' },
  { id: 'miniavs-apex', name: 'Apex', style: 'miniavs', seed: 'Apex', tag: 'High Intensity' },
  { id: 'miniavs-fury', name: 'Fury', style: 'miniavs', seed: 'Fury', tag: 'Brawler' },
  { id: 'miniavs-viper', name: 'Viper', style: 'miniavs', seed: 'Viper', tag: 'Speed & Agility' },
  { id: 'miniavs-blade', name: 'Blade', style: 'miniavs', seed: 'Blade', tag: 'Endurance' },
  { id: 'miniavs-shadow', name: 'Shadow', style: 'miniavs', seed: 'Shadow', tag: 'Stealth Focus' },

  // Dylan (Clean transparent backgrounds so app backdrop shines through)
  {
    id: 'dylan-felix',
    name: 'Felix',
    style: 'dylan',
    seed: 'Felix',
    tag: 'Peak Energy',
    options: {
      backgroundColor: [],
      hairColor: ['000000'],
      skinColor: ['ffd6c0'],
      hairVariant: ['wavy'],
      facialHairVariant: [],
      moodVariant: ['happy'],
    },
  },
  { id: 'dylan-rex', name: 'Rex', style: 'dylan', seed: 'Rex', tag: 'Hypertrophy' },
  { id: 'dylan-phoenix', name: 'Phoenix', style: 'dylan', seed: 'Phoenix', tag: 'Cardio Beast' },
  { id: 'dylan-cipher', name: 'Cipher', style: 'dylan', seed: 'Cipher', tag: 'Calisthenics' },
  { id: 'dylan-ghost', name: 'Ghost', style: 'dylan', seed: 'Ghost', tag: 'Night Runner' },
  { id: 'dylan-spike', name: 'Spike', style: 'dylan', seed: 'Spike', tag: 'Functional' },
  { id: 'dylan-nova', name: 'Nova', style: 'dylan', seed: 'Nova', tag: 'Olympic Lift' },
  { id: 'dylan-axel', name: 'Axel', style: 'dylan', seed: 'Axel', tag: 'Sprint Master' },
  { id: 'dylan-storm', name: 'Storm', style: 'dylan', seed: 'Storm', tag: 'Iron Grip' },

  // Big Smile
  {
    id: 'bigsmile-felix',
    name: 'Felix',
    style: 'big-smile',
    seed: 'Felix',
    tag: 'Grit & Grin',
    options: {
      eyesVariant: ['normal'],
      hairVariant: ['shortHair'],
      mouthVariant: ['teethSmile'],
      hairColor: ['220f00'],
    },
  },
  { id: 'bigsmile-cheerful', name: 'Cheerful', style: 'big-smile', seed: 'Cheerful', tag: 'Daily Active' },
  { id: 'bigsmile-spark', name: 'Spark', style: 'big-smile', seed: 'Spark', tag: 'HIIT Specialist' },
  { id: 'bigsmile-dash', name: 'Dash', style: 'big-smile', seed: 'Dash', tag: 'Distance Walker' },
  { id: 'bigsmile-sunny', name: 'Sunny', style: 'big-smile', seed: 'Sunny', tag: 'Outdoor Cardio' },
  { id: 'bigsmile-chuck', name: 'Chuck', style: 'big-smile', seed: 'Chuck', tag: 'Strength First' },
  { id: 'bigsmile-bop', name: 'Bop', style: 'big-smile', seed: 'Bop', tag: 'Rhythm Cardio' },
  { id: 'bigsmile-grin', name: 'Grin', style: 'big-smile', seed: 'Grin', tag: 'Heavy Squats' },
  { id: 'bigsmile-joy', name: 'Joy', style: 'big-smile', seed: 'Joy', tag: 'Wellness' },

  // Big Ears
  {
    id: 'bigears-teej',
    name: 'Teej',
    style: 'big-ears',
    seed: 'jjs66trp',
    tag: 'Signature Athlete',
    options: {
      hairVariant: ['short14'],
      frontHairVariant: ['variant12'],
      headVariant: ['variant02'],
      mouthVariant: ['variant0302'],
      noseVariant: ['variant04'],
      sideburnsVariant: ['variant04'],
      hairColor: ['2c1b18'],
      skinColor: ['f8b788'],
      eyesVariant: ['variant20'],
    },
  },
  { id: 'bigears-milo', name: 'Milo', style: 'big-ears', seed: 'Milo', tag: 'Agility Focus' },
  { id: 'bigears-leo', name: 'Leo', style: 'big-ears', seed: 'Leo', tag: 'Heavy Lifter' },
  { id: 'bigears-kai', name: 'Kai', style: 'big-ears', seed: 'Kai', tag: 'Calisthenics' },
  { id: 'bigears-finn', name: 'Finn', style: 'big-ears', seed: 'Finn', tag: 'Sprint Power' },
  { id: 'bigears-otis', name: 'Otis', style: 'big-ears', seed: 'Otis', tag: 'Cross Training' },
  { id: 'bigears-sam', name: 'Sam', style: 'big-ears', seed: 'Sam', tag: 'Endurance Beast' },
  { id: 'bigears-toby', name: 'Toby', style: 'big-ears', seed: 'Toby', tag: 'Zone 2 Cardio' },
  { id: 'bigears-rocky', name: 'Rocky', style: 'big-ears', seed: 'Rocky', tag: 'Power Brawler' },

  // Line Face
  { id: 'lineface-zen', name: 'Zen', style: 'line-face', seed: 'Zen', tag: 'Mindful Pace' },
  { id: 'lineface-sleek', name: 'Sleek', style: 'line-face', seed: 'Sleek', tag: 'Minimalist' },
  { id: 'lineface-mono', name: 'Mono', style: 'line-face', seed: 'Mono', tag: 'Precision Form' },
  { id: 'lineface-pulse', name: 'Pulse', style: 'line-face', seed: 'Pulse', tag: 'Zone 2 Cardio' },
  { id: 'lineface-razor', name: 'Razor', style: 'line-face', seed: 'Razor', tag: 'Sharp Technique' },
  { id: 'lineface-drift', name: 'Drift', style: 'line-face', seed: 'Drift', tag: 'Tempo Training' },
  { id: 'lineface-arc', name: 'Arc', style: 'line-face', seed: 'Arc', tag: 'Mobility' },
  { id: 'lineface-strike', name: 'Strike', style: 'line-face', seed: 'Strike', tag: 'Explosive Power' },
];

/**
 * Returns a DiceBear 10 compliant avatar URL.
 */
export function getDiceBearAvatarUrl(
  style: DiceBearAvatarStyle = 'miniavs',
  seed: string = 'Titan',
  format: 'png' | 'svg' = 'png',
  customOptions?: Record<string, any>
): string {
  const cleanSeed = encodeURIComponent(seed.trim() || 'Titan');
  let url = `https://api.dicebear.com/10.x/${style}/${format}?seed=${cleanSeed}`;

  const optionsToApply: Record<string, any> = { ...(customOptions || {}) };

  // Remove background for Dylan avatars so they render transparently on the app's colored circle
  if (style === 'dylan' && optionsToApply.backgroundColor === undefined) {
    optionsToApply.backgroundColor = [];
  }

  const params: string[] = [];
  for (const [key, value] of Object.entries(optionsToApply)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      if (value.length === 0) {
        params.push(`${encodeURIComponent(key)}=`);
      } else {
        params.push(`${encodeURIComponent(key)}=${encodeURIComponent(value.join(','))}`);
      }
    } else {
      params.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }

  if (params.length > 0) {
    url += `&${params.join('&')}`;
  }

  return url;
}
