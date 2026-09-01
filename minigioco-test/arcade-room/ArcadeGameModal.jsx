import React, { Suspense } from "react";
import { SHELL_CSS } from "./game-kit";
import { REGISTRY } from "./arcade-registry";
import { getCspNonce } from "../csp-nonce";

/* ============================================================================
   ArcadeGameModal — wrapper che monta un minigioco della Sala Arcade dentro
   la modale di IsoRoomGame. Inietta il CSS del telaio (.ag-*), passa onExit e
   username. I giochi gestiscono autonomamente ESC, back button e game-over.
   ========================================================================== */

class ArcadeLoadBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="ag-root">
          <div className="ag-over">
            <p>Non riesco a caricare il gioco.</p>
            <button type="button" className="ag-btn" onClick={this.props.onExit}>Torna alla sala</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ArcadeGameModal({ gameId, onExit, username = "", integrationMode = "prototype", quality = "high" }) {
  const Game = REGISTRY[gameId];
  if (!Game) return null;
  return (
    <>
      <style nonce={getCspNonce()}>{SHELL_CSS}</style>
      <ArcadeLoadBoundary key={gameId} onExit={onExit}>
        <Suspense fallback={<div className="ag-root"><div className="ag-over"><p>Caricamento gioco…</p></div></div>}>
          <Game onExit={onExit} username={username} integrationMode={integrationMode} quality={quality} />
        </Suspense>
      </ArcadeLoadBoundary>
    </>
  );
}
