import React from 'react';

// Carte statistique façon maquette : pastille d'icône colorée + valeur + libellé.
// `tone` choisit la couleur de la pastille (navy par défaut), dans la charte AFI.
export default function StatCard({ icon: Icon, value, label, tone = 'navy' }) {
  return (
    <div className="stat">
      <div className={`stat-ico tone-${tone}`}>{Icon && <Icon size={20} />}</div>
      <div className="stat-body">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}
