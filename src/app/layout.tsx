import type { Metadata } from 'next';
import './globals.css';
import './voxora-screens.css';
import './mobile-responsive.css';

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: 'VOXORA - AI Voiceover & Narration Studio',
  description:
    'Turn your anime and manhwa scripts into natural Hindi and Hinglish narration audio with VOXORA.',
  keywords: [
    'VOXORA',
    'Voice AI',
    'Hindi TTS',
    'Anituber',
    'Google Gemini TTS',
    'Gemini 3.8 Flash Studio',
    'Hinglish Text to Speech',
    'Anime recap narration',
    'Manhwa Hindi recap',
  ],
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/voxora-icon.png', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png' }],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'VOXORA - AI Voiceover & Narration Studio',
    description:
      'Turn your anime and manhwa scripts into natural Hindi and Hinglish narration audio with VOXORA.',
    images: [{ url: '/voxora-logo.png', width: 1024, height: 350, alt: 'VOXORA Logo' }],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hi" data-theme="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
