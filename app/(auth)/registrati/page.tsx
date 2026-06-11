import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { config } from '@/lib/config';

export const metadata: Metadata = { title: 'Registrati' };

/**
 * MVP: la registrazione (multi-step, verifica email) resta sul sito principale.
 * Grazie all'SSO cross-subdomain, dopo la registrazione l'utente torna qui già loggato.
 * In M2+ si potrà replicare il flusso registrati/* di Ebartex.
 */
export default function RegistratiPage() {
  return (
    <Card className="brx-glass animate-auth-enter rounded-3xl border-2 border-white text-center">
      <CardHeader>
        <CardTitle className="text-white">Crea il tuo account Ebartex</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <p className="text-sm text-white/75">
          La registrazione avviene sul sito principale. Al termine torna sui Tornei: sarai
          riconosciuto automaticamente.
        </p>
        <Button asChild size="lg">
          <a href={`${config.app.mainSiteUrl}/registrati`}>Registrati su Ebartex</a>
        </Button>
      </CardContent>
    </Card>
  );
}
