/** La mascotte illustrata usa gli stessi accenti del club ad alta qualità. */
export function AssoDiorama(): React.JSX.Element {
  return (
    <svg className="asso-diorama absolute inset-0 h-full w-full" viewBox="0 0 48 64" fill="none" aria-hidden="true">
      <ellipse cx="24" cy="60" rx="15" ry="3" fill="currentColor" opacity=".15" />
      <rect x="8" y="6" width="34" height="49" rx="7" fill="#78452f" />
      <rect x="5" y="4" width="34" height="49" rx="7" fill="#d79957" stroke="#f3d398" strokeWidth="1.5" />
      <rect x="9" y="9" width="26" height="38" rx="4" fill="#fff4db" />
      <path d="m22 12 2.5 4-2.5 4-2.5-4 2.5-4Z" fill="#bc7647" />
      <ellipse cx="17" cy="27" rx="2.6" ry="3.3" fill="#244552" />
      <ellipse cx="27" cy="27" rx="2.6" ry="3.3" fill="#244552" />
      <circle cx="17.6" cy="26" r=".85" fill="white" />
      <circle cx="27.6" cy="26" r=".85" fill="white" />
      <path d="M17 35q5 6 10 0" stroke="#a36348" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="12" cy="33" rx="2.5" ry="1.5" fill="#dfa582" opacity=".6" />
      <ellipse cx="32" cy="33" rx="2.5" ry="1.5" fill="#dfa582" opacity=".6" />
      <path d="M10 7h20" stroke="#ffe4af" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
