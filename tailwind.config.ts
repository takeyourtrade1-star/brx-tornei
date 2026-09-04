import type { Config } from 'tailwindcss';
import ebartexPreset from './design-system/tailwind-preset';

const config: Config = {
  presets: [ebartexPreset as Config],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    // HUD, guardaroba e chat del minigioco condividono i token Ebartex.
    './minigioco-test/**/*.{js,ts,jsx,tsx}',
    // catalog.ts contiene classi gradiente (bg-gradient-card*) usate dalle card
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
};

export default config;
