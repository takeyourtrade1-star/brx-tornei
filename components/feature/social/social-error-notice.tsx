import { AlertCircle } from 'lucide-react';

interface SocialErrorNoticeProps {
  message: string;
}

export function SocialErrorNotice({ message }: SocialErrorNoticeProps) {
  return (
    <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
      <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
      <span>{message}</span>
    </div>
  );
}
