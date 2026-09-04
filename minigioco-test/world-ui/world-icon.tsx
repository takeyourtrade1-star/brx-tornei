import type { WorldIconName } from './types';

export interface WorldIconProps {
  readonly name: WorldIconName;
  readonly size?: number;
  readonly className?: string;
}

export function WorldIcon({ name, size = 18, className }: WorldIconProps): React.JSX.Element {
  const common = {
    className,
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false,
  };

  switch (name) {
    case 'arcade':
      return <svg {...common}><path d="M5 4h14v16H5z" /><path d="M8 8h8M8 13h8M10 17h.01M14 17h.01" /><path d="M12 13v4" /></svg>;
    case 'arrow-right':
      return <svg {...common}><path d="M4 12h15M13 6l6 6-6 6" /></svg>;
    case 'board':
      return <svg {...common}><path d="M4 5h16v14H4z" /><path d="M7 9h10M7 13h6M16 16h.01" /></svg>;
    case 'cards':
      return <svg {...common}><rect x="6" y="4" width="11" height="15" rx="1.5" /><path d="M9 7h5M9 11h5" /><path d="M9 19h7a2 2 0 0 0 2-2V8" /></svg>;
    case 'chevron-right':
      return <svg {...common}><path d="m9 5 7 7-7 7" /></svg>;
    case 'close':
      return <svg {...common}><path d="m6 6 12 12M18 6 6 18" /></svg>;
    case 'music':
      return <svg {...common}><path d="M9 18V6l10-2v12" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="16.5" cy="16" r="2.5" /></svg>;
    case 'photo':
      return <svg {...common}><path d="M4 7h4l1.5-2h5L16 7h4v12H4z" /><circle cx="12" cy="13" r="3.5" /></svg>;
    case 'play':
      return <svg {...common}><path d="m9 6 9 6-9 6z" fill="currentColor" stroke="none" /></svg>;
    case 'settings':
      return <svg {...common}><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" /><circle cx="12" cy="12" r="4" /></svg>;
    case 'shirt':
      return <svg {...common}><path d="m8 5 4 2 4-2 4 3-2 4-2-1v9H8v-9l-2 1-2-4z" /><path d="M10 6c.3 1.5 1 2.2 2 2.2S13.7 7.5 14 6" /></svg>;
    case 'spark':
      return <svg {...common}><path d="m12 3 1.6 6.4L20 11l-6.4 1.6L12 19l-1.6-6.4L4 11l6.4-1.6z" /></svg>;
    case 'trophy':
      return <svg {...common}><path d="M8 4h8v4a4 4 0 0 1-8 0zM12 12v5M8 20h8M9 17h6" /><path d="M8 6H5v2a3 3 0 0 0 3 3M16 6h3v2a3 3 0 0 1-3 3" /></svg>;
    case 'users':
      return <svg {...common}><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0M15 14.5a4.5 4.5 0 0 1 5.5 4.5" /></svg>;
  }
}
