"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "onboarding_seen_v1";

export function OnboardingModal({ projektnamn }: { projektnamn: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setOpen(true);
      }
    } catch {
      // localStorage otillgängligt (privat läge e.dyl.) — visa inte modalen
    }
  }, []);

  function close() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // kan inte sparas — modalen visas då igen nästa besök, inte kritiskt
    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Välkommen till {projektnamn || "produktionen"}</h3>
        <p>
          Den här filmen görs med delat ägande. Du och resten av teamet
          skjuter upp en del av ert arvode under produktionen.
        </p>
        <p>
          Det uppskjutna arvodet betalas tillbaka ur filmens intäkter när
          filmen säljs eller distribueras — innan någon vinst räknas.
        </p>
        <p>
          Utöver återbetalningen får du en andel av vinsten. Nedan ser du
          exakt hur stor din andel är och vad den kan bli värd i olika
          scenarier.
        </p>
        <div className="modal-actions">
          <button className="pill primary" onClick={close}>
            Förstått — visa min sida
          </button>
        </div>
      </div>
    </div>
  );
}
