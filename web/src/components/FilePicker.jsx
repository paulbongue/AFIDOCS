import React, { useRef, useState } from 'react';
import { IconUpload } from './Icons';
import { formatSize } from '../theme';

// Sélecteur de fichier moderne : zone cliquable + glisser-déposer + aperçu du nom.
export default function FilePicker({ file, onChange, accept, hint }) {
  const ref = useRef(null);
  const [drag, setDrag] = useState(false);

  function onDrop(e) {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onChange(f);
  }

  return (
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
             onChange={(e) => onChange(e.target.files?.[0] || null)} />
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
                onClick={(e) => { e.stopPropagation(); onChange(null); }}>✕</button>
      )}
    </div>
  );
}
