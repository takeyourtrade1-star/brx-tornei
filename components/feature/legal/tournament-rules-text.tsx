/**
 * Testo unico del regolamento + informativa sintetica dei Tornei Ebartex.
 * Presentazionale puro (nessuna logica client): lo condividono la prima
 * attivazione del gamertag e il drawer profilo, così resta coerente ovunque.
 */

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <section className="space-y-1.5">
      <h3 className="text-sm font-black tracking-tight text-header-bg">{title}</h3>
      <div className="space-y-1.5 text-xs leading-relaxed text-slate-600">{children}</div>
    </section>
  );
}

export function TournamentRulesText() {
  return (
    <div className="space-y-5">
      <Section title="1. Accettazione del regolamento">
        <p>
          Registrandoti ai tornei con un gamertag entri a far parte della community competitiva di
          Ebartex e accetti integralmente, senza riserve, il presente regolamento e l&apos;informativa
          privacy che lo accompagna. Se non intendi accettare queste condizioni, non puoi
          partecipare ai tornei.
        </p>
      </Section>

      <Section title="2. Condotta e fair play">
        <p>
          Ti impegni a rispettare gli altri giocatori, a giocare secondo le regole del gioco e in
          piena buona fede. È vietato manomettere, alterare o tentare di influenzare
          indebitamente l&apos;esito delle partite, interferire con il funzionamento del sito, dei
          servizi o delle partite altrui, o arrecare danni di qualsiasi natura alla piattaforma e
          ai suoi utenti.
        </p>
        <p>
          Ogni violazione può comportare la squalifica dal torneo in corso, la sospensione
          temporanea o definitiva dell&apos;accesso ai tornei e, nei casi più gravi, la segnalazione
          alle autorità competenti.
        </p>
      </Section>

      <Section title="3. Gamertag e contenuti vietati">
        <p>
          Il gamertag e qualsiasi contenuto condiviso sulla piattaforma non devono essere
          offensivi, volgari, discriminatori, diffamatori, né incitare all&apos;odio, alla violenza o
          a condotte illegali. Ebartex si riserva il diritto di rifiutare, modificare o rimuovere
          gamertag e contenuti che violino queste regole, anche senza preavviso.
        </p>
      </Section>

      <Section title="4. Modalità «Sfida i tuoi amici»: connessione P2P e indirizzo IP">
        <p>
          Nella modalità «Sfida i tuoi amici» la connessione audio/video avviene in tecnologia
          peer-to-peer (P2P): i dati fluiscono direttamente tra il tuo dispositivo e quello
          dell&apos;avversario. Per ragioni tecniche intrinseche a questa tecnologia, il tuo
          indirizzo IP è necessariamente visibile all&apos;avversario (e viceversa). Partecipando a
          questa modalità dichiari di esserne consapevole e di accettare tale inevitabile
          esposizione.
        </p>
      </Section>

      <Section title="5. Registrazione locale a tutela del gioco (anti-cheat)">
        <p>
          Durante le partite, un componente software registra in modo continuo e{' '}
          <strong>esclusivamente in locale sul tuo dispositivo</strong> il tavolo di gioco, allo
          scopo di tutelare la regolarità degli incontri. La registrazione non viene trasmessa né
          conservata sui nostri server e viene automaticamente sovrascritta a partita conclusa.
        </p>
        <p>
          Unica eccezione: in caso di disconnessione hai a disposizione 90 secondi per
          riconnetterti. Per risolvere eventuali dispute nate in quell&apos;intervallo, il segmento
          di registrazione relativo al solo periodo di disconnessione può essere conservato e
          mostrato all&apos;avversario come prova che non hai manomesso mazzi o carte mentre eri
          disconnesso. Lo stesso diritto — e lo stesso obbligo di trasparenza — vale in modo
          speculare per il tuo avversario nei tuoi confronti.
        </p>
      </Section>

      <Section title="6. Trattamento dei dati personali">
        <p>
          La presente è un&apos;informativa sintetica relativa alle sole funzionalità dei tornei.
          L&apos;informativa completa sul trattamento dei dati personali, i tuoi diritti e le
          modalità per esercitarli sono disponibili sul sito{' '}
          <a
            href="https://www.ebartex.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary underline underline-offset-2"
          >
            www.ebartex.com
          </a>{' '}
          (sezione Privacy e Termini di servizio), che ti invitiamo a leggere con attenzione.
        </p>
      </Section>
    </div>
  );
}
