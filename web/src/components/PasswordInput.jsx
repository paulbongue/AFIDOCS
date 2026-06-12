import React, { useState } from 'react';

// Champ mot de passe avec bouton œil pour afficher / masquer la saisie.
export default function PasswordInput({ value, onChange, placeholder, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="pwd-wrap">
      <input
        className="input"
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        className="pwd-toggle"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        tabIndex={-1}
      >
        {show ? '🙈' : '👁'}
      </button>
    </div>
  );
}
