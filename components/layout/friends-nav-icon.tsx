interface FriendsNavIconProps {
  className?: string;
}

/** Due busti affiancati: l’angolo in basso a destra resta libero per il pip online. */
export function FriendsNavIcon({ className }: FriendsNavIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <circle cx="8.2" cy="7.1" r="3.15" fill="currentColor" />
      <path
        d="M2.6 18.4c.2-3.35 2.7-5.55 5.6-5.55 2.9 0 5.4 2.2 5.6 5.55.04.55-.4 1-1 1H3.6c-.6 0-1.04-.45-1-1Z"
        fill="currentColor"
      />
      <circle cx="16.35" cy="7.55" r="2.55" fill="currentColor" opacity="0.92" />
      <path
        d="M13.15 16.35c.45-2.15 2.15-3.55 4.15-3.55 1.35 0 2.55.65 3.3 1.7-.85.55-1.85.9-2.95.9h-4.05c-.28 0-.5-.26-.45-.5Z"
        fill="currentColor"
        opacity="0.92"
      />
    </svg>
  );
}
