"use client";

import { useState } from "react";
import { useDashboardStore } from "@/store/use-dashboard-store";

export default function GoogleConnectCard() {
  const google = useDashboardStore((s) => s.google);
  const connectGoogle = useDashboardStore((s) => s.connectGoogle);
  const disconnectGoogle = useDashboardStore((s) => s.disconnectGoogle);
  const processFromGoogle = useDashboardStore((s) => s.processFromGoogle);
  const [propertyId, setPropertyId] = useState("");
  const [siteUrl, setSiteUrl] = useState("");

  return (
    <div id="googleConnectCard">
      <div className="cardtitle mb-2.5 flex items-center gap-1.5 text-[13px] font-black text-text">
        Conectar con Google Analytics y Search Console (beta)
      </div>
      <div className="cardsub -mt-1 mb-3 text-[11px] text-muted-2">
        Alternativa a subir CSV manualmente: trae los datos directamente desde tu cuenta de Google. Requiere que este archivo
        este servido desde un origen web (no funciona abriendolo con doble clic) y que el Client ID de Google Cloud este
        configurado (variable NEXT_PUBLIC_GOOGLE_CLIENT_ID). La audiencia (modulo &quot;Audiencias&quot;) no esta disponible
        aun por esta via; usa un CSV para ese modulo si lo necesitas.
      </div>
      <div className="selectionbar mt-2.5 flex flex-wrap items-center gap-2">
        {!google.connected ? (
          <button
            id="googleConnectBtn"
            type="button"
            onClick={() => connectGoogle()}
            className="btn rounded-[10px] border border-orange bg-orange px-3 py-2 text-xs font-extrabold text-white transition hover:bg-[#e86c00]"
          >
            Conectar con Google
          </button>
        ) : (
          <button
            id="googleDisconnectBtn"
            type="button"
            onClick={() => disconnectGoogle()}
            className="btn rounded-[10px] border border-border-2 bg-transparent px-3 py-2 text-xs font-extrabold text-muted transition hover:bg-surface-2 hover:text-text"
          >
            Desconectar
          </button>
        )}
      </div>
      <div id="googleStatus" className="export-status mt-2.5 text-xs text-muted">
        {google.status}
      </div>
      {google.connected && (
        <div id="googlePickers" className="settings mt-3 grid grid-cols-5 gap-2.5 max-[1180px]:grid-cols-2 max-[900px]:grid-cols-1">
          <div className="field">
            <label className="mb-[5px] block text-[10px] font-black uppercase tracking-[.06em] text-muted-2">Propiedad de GA4</label>
            <select
              id="ga4PropertySelect"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="w-full rounded-[10px] border border-border-2 bg-surface-2 px-2.5 py-[9px] text-text outline-none [color-scheme:dark] focus:border-orange focus:shadow-[0_0_0_3px_rgba(255,121,0,.15)]"
            >
              <option value="">Sin propiedad seleccionada</option>
              {google.ga4Properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="mb-[5px] block text-[10px] font-black uppercase tracking-[.06em] text-muted-2">Sitio de Search Console</label>
            <select
              id="gscSiteSelect"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              className="w-full rounded-[10px] border border-border-2 bg-surface-2 px-2.5 py-[9px] text-text outline-none [color-scheme:dark] focus:border-orange focus:shadow-[0_0_0_3px_rgba(255,121,0,.15)]"
            >
              <option value="">Sin sitio seleccionado</option>
              {google.gscSites.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="mb-[5px] block text-[10px] font-black uppercase tracking-[.06em] text-muted-2">&nbsp;</label>
            <button
              type="button"
              onClick={() => processFromGoogle(propertyId, siteUrl)}
              className="btn w-full rounded-[10px] border border-orange bg-orange px-3 py-2 text-xs font-extrabold text-white transition hover:bg-[#e86c00]"
            >
              Traer datos de Google
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
