import React, { useRef, useState } from 'react';
import { IconUpload } from './Icons';
import { formatSize } from '../theme';

// Sélecteur de fichier moderne : zone cliquable + glisser-déposer + aperçu du nom.
export default function FilePicker({ file, onChange, accept, hint, maxSizeMB = 250, onError }) {
  const ref = useRef(null);
  const [drag, setDrag] = useState(false);
  const [err, setErr] = useState('');

  // Contrôle de taille côté client : message clair AVANT tout envoi.
  function pick(f) {
    if (f && f.size > maxSizeMB * 1024 * 1024) {
      const msg = `Le fichier dépasse la taille maximale autorisée (${maxSizeMB} Mo).`;
      setErr(msg);
      onError?.(msg);
      return;
    }
    setErr('');
    onChange(f);
  }

  function onDrop(e) {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) pick(f);
  }

  return (
    <>
    <div
      className={'filepicker' + (drag ? ' drag' : '') + (file ? ' has-file' : '')}
      onClick={() => ref.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
      role="button"
      tabIndex={0}
    >
      <input ref={ref} type="file" accept={accept} hidden
             onChange={(e) => pick(e.target.files?.[0] || null)} />
      <div className="filepicker-icon"><IconUpload size={20} /></div>
      <div className="filepicker-body">
        {file ? (
          <>
            <div className="filepicker-name">{file.name}</div>
            <div className="filepicker-sub">{formatSize(file.size)} · cliquez pour changer</div>
          </>
        ) : (
          <>
            <div className="filepicker-name">Choisir un fichier</div>
            <div className="filepicker-sub">{hint || 'ou glissez-le ici'}</div>
          </>
        )}
      </div>
      {file && (
        <button type="button" className="filepicker-clear" title="Retirer"
                onClick={(e) => { e.stopPropagation(); setErr(''); onChange(null); }}>✕</button>
      )}
    </div>
    {err && <div className="filepicker-err">{err}</div>}
    </>
  );
}
