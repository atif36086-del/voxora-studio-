import fs from 'fs';
import path from 'path';

/**
 * Retrieves all configured Google API keys from .env.local and process.env.
 * Supports:
 * - Comma/newline separated: GOOGLE_API_KEY=key1,key2
 * - Plural variable: GOOGLE_API_KEYS=key1,key2
 * - Numbered variables: GOOGLE_API_KEY_1=key1, GOOGLE_API_KEY_2=key2
 * Dynamically re-reads .env.local so users don't have to restart the dev server.
 */
export function getGoogleApiKeys(): string[] {
  const keys: string[] = [];

  // 1. Read live from .env.local if available
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('#')) return;
        if (
          trimmed.startsWith('GOOGLE_API_KEY=') ||
          trimmed.startsWith('GOOGLE_API_KEYS=') ||
          /^GOOGLE_API_KEY_\d+=/.test(trimmed)
        ) {
          const val = trimmed.slice(trimmed.indexOf('=') + 1).trim();
          if (val) {
            val.split(/[,;\s]+/).forEach((k) => {
              const clean = k.trim().replace(/^["']|["']$/g, '');
              if (clean && !keys.includes(clean) && clean !== 'your_google_api_key_here') {
                keys.push(clean);
              }
            });
          }
        }
      });
    }
  } catch {
    // Fall back to process.env
  }

  // 2. Read from process.env
  if (process.env.GOOGLE_API_KEYS) {
    process.env.GOOGLE_API_KEYS.split(/[,;\s]+/).forEach((k) => {
      const clean = k.trim().replace(/^["']|["']$/g, '');
      if (clean && !keys.includes(clean) && clean !== 'your_google_api_key_here') {
        keys.push(clean);
      }
    });
  }

  if (process.env.GOOGLE_API_KEY) {
    process.env.GOOGLE_API_KEY.split(/[,;\s]+/).forEach((k) => {
      const clean = k.trim().replace(/^["']|["']$/g, '');
      if (clean && !keys.includes(clean) && clean !== 'your_google_api_key_here') {
        keys.push(clean);
      }
    });
  }

  for (let i = 1; i <= 50; i++) {
    const k = process.env[`GOOGLE_API_KEY_${i}`]?.trim().replace(/^["']|["']$/g, '');
    if (k && !keys.includes(k) && k !== 'your_google_api_key_here') {
      keys.push(k);
    }
  }

  return keys;
}

/**
 * Retrieves all configured Sarvam AI API keys from .env.local and process.env.
 * Supports:
 * - Comma/newline separated: SARVAM_API_KEY=key1,key2
 * - Plural variable: SARVAM_API_KEYS=key1,key2
 * - Numbered variables: SARVAM_API_KEY_1=key1, SARVAM_API_KEY_2=key2
 */
export function getSarvamApiKeys(): string[] {
  const keys: string[] = [];

  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('#')) return;
        if (
          trimmed.startsWith('SARVAM_API_KEY=') ||
          trimmed.startsWith('SARVAM_API_KEYS=') ||
          /^SARVAM_API_KEY_\d+=/.test(trimmed)
        ) {
          const val = trimmed.slice(trimmed.indexOf('=') + 1).trim();
          if (val) {
            val.split(/[,;\s]+/).forEach((k) => {
              const clean = k.trim().replace(/^["']|["']$/g, '');
              if (clean && !keys.includes(clean) && clean !== 'your_sarvam_api_key_here') {
                keys.push(clean);
              }
            });
          }
        }
      });
    }
  } catch {
    // Fall back to process.env
  }

  if (process.env.SARVAM_API_KEYS) {
    process.env.SARVAM_API_KEYS.split(/[,;\s]+/).forEach((k) => {
      const clean = k.trim().replace(/^["']|["']$/g, '');
      if (clean && !keys.includes(clean) && clean !== 'your_sarvam_api_key_here') {
        keys.push(clean);
      }
    });
  }

  if (process.env.SARVAM_API_KEY) {
    process.env.SARVAM_API_KEY.split(/[,;\s]+/).forEach((k) => {
      const clean = k.trim().replace(/^["']|["']$/g, '');
      if (clean && !keys.includes(clean) && clean !== 'your_sarvam_api_key_here') {
        keys.push(clean);
      }
    });
  }

  for (let i = 1; i <= 50; i++) {
    const k = process.env[`SARVAM_API_KEY_${i}`]?.trim().replace(/^["']|["']$/g, '');
    if (k && !keys.includes(k) && k !== 'your_sarvam_api_key_here') {
      keys.push(k);
    }
  }

  return keys;
}
