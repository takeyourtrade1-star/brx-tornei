'use client';

import { useState, type FormEvent } from 'react';
import { ArrowRight, Gift, ShieldCheck, Trophy } from 'lucide-react';
import {
  AUTH_SPLIT_INPUT_CLASS,
  AUTH_SPLIT_LABEL_CLASS,
} from '@/components/layout/auth-split-styles';
import type { MembershipInput } from '@/lib/membership/membership';
import { cn } from '@/lib/utils';

interface MembershipOnboardingFormProps {
  defaultEmail?: string;
  defaultName?: string | null;
  onComplete: (input: MembershipInput) => void;
  onSkip: () => void;
}

const CLUBS = [
  'Ebartex Digital',
  'Ebartex Milano Centro',
  'Ebartex Roma Tuscolana',
  'Ebartex Torino Lingotto',
  'Ebartex Napoli Vomero',
  'Ebartex Bologna Fiera',
  'Online / Nessun circolo',
];

const PERKS = [
  { icon: Trophy, label: 'Accesso ai tornei con premi' },
  { icon: Gift, label: 'Punti e ricompense esclusive' },
  { icon: ShieldCheck, label: 'Profilo verificato del circolo' },
];

/** Splits "Mario Rossi" → ["Mario", "Rossi"] per precompilare il form. */
function splitName(name?: string | null): { first: string; last: string } {
  if (!name) return { first: '', last: '' };
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

export function MembershipOnboardingForm({
  defaultEmail = '',
  defaultName,
  onComplete,
  onSkip,
}: MembershipOnboardingFormProps) {
  const seeded = splitName(defaultName);
  const [firstName, setFirstName] = useState(seeded.first);
  const [lastName, setLastName] = useState(seeded.last);
  const [birthDate, setBirthDate] = useState('');
  const [email, setEmail] = useState(defaultEmail);
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [club, setClub] = useState(CLUBS[0]);
  const [consent, setConsent] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !birthDate) {
      setError('Compila nome, cognome e data di nascita.');
      return;
    }
    if (!consent) {
      setError('Accetta il regolamento per emettere la tessera.');
      return;
    }
    setError(null);
    onComplete({
      firstName,
      lastName,
      birthDate,
      email,
      phone,
      city,
      club,
    });
  }

  return (
    <div className="flex flex-1 flex-col justify-center py-6 sm:py-8">
      <header className="mb-5">
        <h1 className="text-[26px] font-bold leading-tight tracking-tight text-[#1d1d1f] sm:text-[30px]">
          Entra nella community
        </h1>
        <p className="mt-1.5 text-[15px] leading-relaxed text-[#86868b]">
          Diventa membro e ottieni la tua tessera digitale per partecipare ai tornei con premi
          esclusivi.
        </p>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {PERKS.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-1.5 text-[12px] font-medium text-[#515154]">
              <Icon className="h-3.5 w-3.5 text-global-bg-start" />
              {label}
            </li>
          ))}
        </ul>
      </header>

      <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className={AUTH_SPLIT_LABEL_CLASS}>
              Nome
            </label>
            <input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
              required
              className={AUTH_SPLIT_INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="lastName" className={AUTH_SPLIT_LABEL_CLASS}>
              Cognome
            </label>
            <input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
              required
              className={AUTH_SPLIT_INPUT_CLASS}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div>
            <label htmlFor="birthDate" className={AUTH_SPLIT_LABEL_CLASS}>
              Data di nascita
            </label>
            <input
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              required
              className={AUTH_SPLIT_INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="phone" className={AUTH_SPLIT_LABEL_CLASS}>
              Telefono <span className="font-normal text-[#86868b]">(opzionale)</span>
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              className={AUTH_SPLIT_INPUT_CLASS}
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className={AUTH_SPLIT_LABEL_CLASS}>
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className={AUTH_SPLIT_INPUT_CLASS}
          />
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div>
            <label htmlFor="city" className={AUTH_SPLIT_LABEL_CLASS}>
              Città <span className="font-normal text-[#86868b]">(opzionale)</span>
            </label>
            <input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              autoComplete="address-level2"
              className={AUTH_SPLIT_INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="club" className={AUTH_SPLIT_LABEL_CLASS}>
              Circolo di riferimento
            </label>
            <select
              id="club"
              value={club}
              onChange={(e) => setClub(e.target.value)}
              className={cn(AUTH_SPLIT_INPUT_CLASS, 'appearance-none bg-black/5')}
            >
              {CLUBS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className="flex items-start gap-2.5 pt-1 text-[13px] leading-relaxed text-[#515154]">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-black/20 text-global-bg-start focus:ring-global-bg-start/30"
          />
          <span>
            Accetto il regolamento del circolo e il trattamento dei dati per l&apos;emissione della
            tessera associativa.
          </span>
        </label>

        {error ? <p className="text-[13px] text-red-500">{error}</p> : null}

        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-global py-3 text-[15px] font-semibold text-white shadow-[0_3px_12px_rgba(61,101,198,0.3)] transition-transform hover:scale-[1.01] active:scale-[0.99]"
        >
          Crea la mia tessera
          <ArrowRight className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onSkip}
          className="w-full rounded-full py-2.5 text-[14px] font-medium text-[#86868b] transition-colors hover:text-[#1d1d1f]"
        >
          Salta — voglio solo guardare o giocare 1v1 tra amici
        </button>
      </form>
    </div>
  );
}
