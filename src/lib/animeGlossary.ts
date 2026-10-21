/**
 * Anime & Manhwa Phonetic Glossary for Indian Anitubers.
 * Maps tricky English/Japanese/Korean anime terms to natural phonetic
 * representations that Indian TTS models (Sarvam Bulbul & Gemini) pronounce
 * with maximum punch, clarity, and zero robotic distortion.
 */

export interface GlossaryItem {
  id: string;
  category: 'Solo Leveling / Manhwa' | 'Jujutsu Kaisen' | 'Shonen Powers' | 'Anime Common';
  english: string;
  hindiPhonetic: string;
  description: string;
}

export const ANIME_GLOSSARY: GlossaryItem[] = [
  // Solo Leveling & Manhwa
  {
    id: 'sung-jinwoo',
    category: 'Solo Leveling / Manhwa',
    english: 'Sung Jin-woo',
    hindiPhonetic: 'सुंग जिन-वू',
    description: 'Shadow Monarch protagonist',
  },
  {
    id: 'shadow-monarch',
    category: 'Solo Leveling / Manhwa',
    english: 'Shadow Monarch',
    hindiPhonetic: 'शैडो मोनार्क',
    description: 'Supreme title of Sung Jin-woo',
  },
  {
    id: 'arise',
    category: 'Solo Leveling / Manhwa',
    english: 'Arise',
    hindiPhonetic: 'एराइज़',
    description: 'Shadow summon command',
  },
  {
    id: 'igris',
    category: 'Solo Leveling / Manhwa',
    english: 'Igris',
    hindiPhonetic: 'इग्रिस',
    description: 'Blood-red Commander Shadow',
  },
  {
    id: 'beru',
    category: 'Solo Leveling / Manhwa',
    english: 'Beru',
    hindiPhonetic: 'बेरू',
    description: 'Ant King Marshal Shadow',
  },

  // Jujutsu Kaisen
  {
    id: 'satoru-gojo',
    category: 'Jujutsu Kaisen',
    english: 'Satoru Gojo',
    hindiPhonetic: 'सातोरो गोझो',
    description: 'The Honored One',
  },
  {
    id: 'ryomen-sukuna',
    category: 'Jujutsu Kaisen',
    english: 'Ryomen Sukuna',
    hindiPhonetic: 'र्योमेन सुकुना',
    description: 'King of Curses',
  },
  {
    id: 'domain-expansion',
    category: 'Jujutsu Kaisen',
    english: 'Domain Expansion',
    hindiPhonetic: 'डोमेन एक्सपेंशन',
    description: 'Pinnacle Jujutsu barrier technique',
  },
  {
    id: 'hollow-purple',
    category: 'Jujutsu Kaisen',
    english: 'Hollow Purple',
    hindiPhonetic: 'हॉलो पर्पल',
    description: 'Secret imaginary technique',
  },
  {
    id: 'infinity',
    category: 'Jujutsu Kaisen',
    english: 'Infinity',
    hindiPhonetic: 'इनफिनिटी',
    description: 'Limitless barrier',
  },

  // Shonen Powers & Attacks
  {
    id: 'bankai',
    category: 'Shonen Powers',
    english: 'Bankai',
    hindiPhonetic: 'बंकाई',
    description: 'Bleach Zanpakuto release',
  },
  {
    id: 'getsuga-tensho',
    category: 'Shonen Powers',
    english: 'Getsuga Tensho',
    hindiPhonetic: 'गेत्सुगा तेन्शो',
    description: 'Ichigo energy slash',
  },
  {
    id: 'rasengan',
    category: 'Shonen Powers',
    english: 'Rasengan',
    hindiPhonetic: 'रासेनगान',
    description: 'Naruto spinning chakra sphere',
  },
  {
    id: 'sharingan',
    category: 'Shonen Powers',
    english: 'Sharingan',
    hindiPhonetic: 'शारिंगान',
    description: 'Uchiha dojutsu eye',
  },
  {
    id: 'gear-5',
    category: 'Shonen Powers',
    english: 'Gear 5',
    hindiPhonetic: 'गियर 5',
    description: 'Luffy Sun God Nika awakening',
  },
  {
    id: 'haki',
    category: 'Shonen Powers',
    english: 'Haki',
    hindiPhonetic: 'हाकी',
    description: 'Conquerors / Armament spirit willpower',
  },

  // Anime Common
  {
    id: 'isekai',
    category: 'Anime Common',
    english: 'Isekai',
    hindiPhonetic: 'इसेकाई',
    description: 'Reincarnation in another world genre',
  },
  {
    id: 'reincarnate',
    category: 'Anime Common',
    english: 'Reincarnate',
    hindiPhonetic: 'रीइन्कारनेट',
    description: 'Rebirth trope in fantasy / isekai',
  },
  {
    id: 'reincarnated',
    category: 'Anime Common',
    english: 'Reincarnated',
    hindiPhonetic: 'रीइन्कारनेटेड',
    description: 'Reincarnated in another world',
  },
  {
    id: 'reincarnation',
    category: 'Anime Common',
    english: 'Reincarnation',
    hindiPhonetic: 'रीइन्कारनेशन',
    description: 'Rebirth trope across anime and manhwa',
  },
  {
    id: 'manhwa',
    category: 'Anime Common',
    english: 'Manhwa',
    hindiPhonetic: 'मानह्वा',
    description: 'Korean webtoon comic',
  },
  {
    id: 'shonen',
    category: 'Anime Common',
    english: 'Shonen',
    hindiPhonetic: 'शोनेन',
    description: 'Action hype anime genre',
  },
];

/**
 * Optimizes anime script phonetics for Hindi/Hinglish TTS.
 * Scans text and replaces awkward English transliterations with crisp phonetic Hindi.
 */
export function optimizeAnimeScript(script: string): {
  optimizedScript: string;
  replacementsCount: number;
  replacedTerms: string[];
} {
  let result = script;
  let count = 0;
  const terms: string[] = [];

  for (const item of ANIME_GLOSSARY) {
    // Escape special regex chars
    const escaped = item.english.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');

    if (regex.test(result)) {
      result = result.replace(regex, item.hindiPhonetic);
      count++;
      terms.push(`${item.english} → ${item.hindiPhonetic}`);
    }
  }

  return {
    optimizedScript: result,
    replacementsCount: count,
    replacedTerms: terms,
  };
}
