import { publicConfig } from '@/lib/public-config';
import { BrxHeaderLogo } from '@/components/layout/brx-header-logo';
import { ArrowLeft, Swords } from 'lucide-react';

interface OnboardingHeaderProps {
  userEmail?: string | null;
}

/**
 * Header minimale e premium per la schermata di onboarding.
 */
export function OnboardingHeader({ userEmail }: OnboardingHeaderProps) {
  return (
    <header className="relative z-20 w-full border-b border-white/10 bg-[#0F172A]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <BrxHeaderLogo href="/" ariaLabel="Ebartex Tornei" />
          <div className="h-4 w-px bg-white/15" aria-hidden />
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary">
            <Swords className="h-2.5 w-2.5" aria-hidden />
            Arena Tornei
          </span>
        </div>

        <div className="flex items-center gap-3">
          {userEmail && (
            <span className="hidden text-xs text-white/50 md:inline">
              Account: <strong className="font-semibold text-white/80">{userEmail}</strong>
            </span>
          )}
          <a
            href={publicConfig.app.mainSiteUrl}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80 transition-colors hover:border-white/30 hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            <span className="hidden sm:inline">Torna su Ebartex</span>
            <span className="sm:hidden">Ebartex</span>
          </a>
        </div>
      </div>
    </header>
  );
}
