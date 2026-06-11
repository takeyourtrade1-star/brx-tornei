import type { Config } from 'tailwindcss';
import ebartexPreset from './design-system/tailwind-preset';

const config: Config = {
  presets: [ebartexPreset as Config],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    // catalog.ts contiene classi gradiente (bg-gradient-card*) usate dalle card
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
};

export default config;
