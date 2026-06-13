import React, { useEffect, useState } from 'react';
import client from '../api/client';

const SERIES = [
  { key: 'download', label: 'Téléchargements', color: '#14213D' },
  { key: 'view', label: 'Consultations', color: '#C0392B' },
  { key: 'comment', label: 'Commentaires', color: '#E07B39' },
];

// Date du jour au format YYYY-MM-DD (fuseau local).
function isoToday(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export default function ActivityPanel() {
  const [days, setDays] = useState(14);
  const [data, setData] = useState(null);

  // Plage du rapport téléchargeable.
  const [from, setFrom] = useState(isoToday(-29));
  const [to, setTo] = useState(isoToday(0));
  const [downloading, setDownloading] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    client.get('/admin/activity', { params: { days } }).then(({ data }) => setData(data));
  }, [days]);

  async function downloadReport() {
    setErr(null);
    setDownloading(true);
    try {
      const res = await client.get('/admin/activity/report', {
        params: { from, to }, responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-activite-afidocs_${from}_${to}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErr('Échec du téléchargement du rapport.');
    } finally {
      setDownloading(false);
    }
  }

  const dd = data?.days || [];
  const maxVal = Math.max(1, ...dd.flatMap((d) => [d.download, d.view, d.comment]));

  return (
    <div id="rapport-activite">
      <div className="spread mt" style={{ marginTop: 28, flexWrap: 'wrap', gap: 10 }}>
        <h3 style={{ margin: 0 }}>Activité des étudiants par jour</h3>
        <div className="view-toggle">
          {[7, 14, 30].map((n) => (
            <button key={n} className={days === n ? 'active' : ''} onClick={() => setDays(n)}>{n} j</button>
          ))}
        </div>
      </div>

      <div className="card mt">
        <div className="row" style={{ gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
          {SERIES.map((s) => (
            <span key={s.key} className="row" style={{ gap: 6, alignItems: 'center' }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: s.color, display: 'inline-block' }} />
              <span className="muted" style={{ fontSize: 13 }}>{s.label}</span>
            </span>
          ))}
        </div>

        {!data ? <div className="empty">Chargement…</div>
          : (data.totaux.download + data.totaux.view + data.totaux.comment) === 0 ? (
            <div className="empty">Aucune activité enregistrée sur la période.</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 180, overflowX: 'auto', paddingTop: 8 }}>
              {dd.map((d) => (
                <div key={d.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 30, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 150 }} title={`${d.date}\n${SERIES.map((s) => `${s.label}: ${d[s.key]}`).join('\n')}`}>
                    {SERIES.map((s) => (
                      <div key={s.key} style={{
                        width: 7, borderRadius: '3px 3px 0 0', background: s.color,
                        height: `${(d[s.key] / maxVal) * 150}px`, minHeight: d[s.key] > 0 ? 3 : 0,
                      }} />
                    ))}
                  </div>
                  <div className="muted" style={{ fontSize: 10, marginTop: 4, whiteSpace: 'nowrap' }}>
                    {d.date.slice(5)}
                  </div>
                </div>
              ))}
            </div>
          )}

        {data && (
          <div className="row mt" style={{ gap: 18, flexWrap: 'wrap', fontSize: 13 }}>
            <span className="muted">En ligne (web) : <b>{data.par_plateforme.web.download + data.par_plateforme.web.view + data.par_plateforme.web.comment}</b></span>
            <span className="muted">Mobile : <b>{data.par_plateforme.mobile.download + data.par_plateforme.mobile.view + data.par_plateforme.mobile.comment}</b></span>
          </div>
        )}
      </div>

      {/* Rapport complet téléchargeable (web/mobile séparés) sur une durée choisie */}
      <div className="card mt">
        <h3 style={{ marginTop: 0 }}>Rapport complet d'activité</h3>
        <div className="muted" style={{ marginBottom: 12 }}>
          Rapport structuré (CSV) séparant l'activité en ligne (web) et l'activité mobile,
          sur la période de votre choix.
        </div>
        <div className="row" style={{ gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label className="field">Du</label>
            <input className="input" type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="field">Au</label>
            <input className="input" type="date" value={to} min={from} max={isoToday(0)} onChange={(e) => setTo(e.target.value)} />
          </div>
          <button className="btn btn-red" onClick={downloadReport} disabled={downloading}>
            {downloading ? 'Génération…' : '⬇ Télécharger le rapport'}
          </button>
        </div>
        {err && <div style={{ color: 'var(--red)', marginTop: 10 }}>{err}</div>}
      </div>
    </div>
  );
}
