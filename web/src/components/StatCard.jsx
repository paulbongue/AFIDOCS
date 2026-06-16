import React from 'react';

// Carte statistique façon maquette v2026 : pastille d'icône pâle + valeur +
// libellé, avec une tendance optionnelle (ex. "+12%") à droite.
// `tone` choisit la teinte (navy par défaut), dans la charte AFI.
export default function StatCard({ icon: Icon, value, label, tone = 'navy', trend }) {
  return (
    <div className="stat">
      <div className={`stat-ico soft tone-${tone}`}>{Icon && <Icon size={20} />}</div>
      <div className="stat-body">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
      {trend != null && <span className="stat-trend">{trend}</span>}
    </div>
  );
}
