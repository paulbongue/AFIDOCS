import React from 'react';
import { colorForFiliere } from '../theme';

// Badge coloré de filière.
export default function Badge({ code, couleur }) {
  return (
    <span className="badge" style={{ background: couleur || colorForFiliere(code) }}>
      {code}
    </span>
  );
}
