import { AlertCircle } from 'lucide-react';

interface SocialErrorNoticeProps {
  message: string;
}

export function SocialErrorNotice({ message }: SocialErrorNoticeProps) {
  return (
    <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-xs font-bold text-red-300">
      <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
      <span>{message}</span>
    </div>
  );
}
