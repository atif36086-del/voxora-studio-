export interface CharacterVoice {
  id: string;
  name: string;
  category: 'All' | 'Anime' | 'Narration' | 'Expressive' | 'Young';
  gender: 'Female' | 'Male';
  tags: string[];
  avatar: string;
  geminiVoice: string; // Underlying Gemini TTS voice
  sampleText: string;
}

export const CHARACTER_VOICES: CharacterVoice[] = [
  {
    id: 'aoi',
    name: 'Aoi',
    category: 'Anime',
    gender: 'Female',
    tags: ['Anime', 'Female', 'Young'],
    avatar: '/assets/avatars/avatar-aoi.jpg',
    geminiVoice: 'Kore',
    sampleText: 'Kono sekai mein har mod par ek naya raaz chhipa hai... hum ruk nahi sakte!',
  },
  {
    id: 'ren',
    name: 'Ren',
    category: 'Anime',
    gender: 'Male',
    tags: ['Anime', 'Male', 'Young'],
    avatar: '/assets/avatars/avatar-ren.jpg',
    geminiVoice: 'Puck',
    sampleText: 'Main haar nahi maan sakta! Chahe kitni bhi mushkilen aayein, main aage badhunga.',
  },
  {
    id: 'sora',
    name: 'Sora',
    category: 'Narration',
    gender: 'Male',
    tags: ['Narration', 'Male', 'Calm'],
    avatar: '/assets/avatars/avatar-sora.jpg',
    geminiVoice: 'Charon',
    sampleText: 'Sadiyon pehle, jab is dharati par jaadu aur taaqat ka aalam tha, ek kahani shuru hui.',
  },
  {
    id: 'mika',
    name: 'Mika',
    category: 'Expressive',
    gender: 'Female',
    tags: ['Anime', 'Female', 'Expressive'],
    avatar: '/assets/avatars/avatar-mika.jpg',
    geminiVoice: 'Zephyr',
    sampleText: 'Dekho na! Kitna khoobsurat aasmaan hai! Hum sab milkar jeetenge!',
  },
  {
    id: 'takeshi',
    name: 'Takeshi',
    category: 'Narration',
    gender: 'Male',
    tags: ['Narration', 'Male', 'Deep'],
    avatar: '/assets/avatars/avatar-takeshi.jpg',
    geminiVoice: 'Fenrir',
    sampleText: 'Yudh shuru ho chuka hai. Apni talwaar uthao aur ladne ke liye taiyaar ho jao.',
  },
];
