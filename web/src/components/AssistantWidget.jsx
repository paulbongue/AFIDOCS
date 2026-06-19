import React, { useState, useRef, useEffect } from 'react';
import client from '../api/client';

// Petite étincelle "IA" (SVG, hérite de la couleur courante).
function Spark({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l1.8 4.7L18.5 8.5 13.8 10.3 12 15l-1.8-4.7L5.5 8.5l4.7-1.8L12 2z" />
      <path d="M18.5 14l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9.9-2.3z" opacity=".7" />
    </svg>
  );
}
function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></svg>
  );
}

const GREETING = {
  role: 'assistant',
  content: "Bonjour 👋 Je suis l'assistant AFI-DOCS. Posez-moi une question sur la plateforme, vos cours ou les annonces — ou demandez « Quoi de neuf ? ».",
};

export default function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, open, busy]);

  async function send(e) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    const next = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setBusy(true);
    try {
      const payload = next
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role, content: m.content }));
      const { data } = await client.post('/assistant/chat', { messages: payload });
      setMessages([...next, { role: 'assistant', content: data.reply || '…' }]);
    } catch (_) {
      setMessages([...next, { role: 'assistant', content: "Désolé, je n'ai pas pu répondre. Vérifiez votre connexion." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {!open && (
        <button className="ai-fab" onClick={() => setOpen(true)} aria-label="Ouvrir l'assistant" title="Assistant AFI-DOCS">
          <Spark />
        </button>
      )}

      {open && (
        <div className="ai-panel" role="dialog" aria-label="Assistant AFI-DOCS">
          <div className="ai-head">
            <span className="ai-head-title"><Spark size={16} /> Assistant AFI-DOCS</span>
            <button className="ai-close" onClick={() => setOpen(false)} aria-label="Fermer">✕</button>
          </div>

          <div className="ai-body" ref={bodyRef}>
            {messages.map((m, i) => (
              <div key={i} className={'ai-msg ' + (m.role === 'user' ? 'me' : 'bot')}>{m.content}</div>
            ))}
            {busy && <div className="ai-msg bot ai-typing"><span></span><span></span><span></span></div>}
          </div>

          <form className="ai-input" onSubmit={send}>
            <input value={input} onChange={(e) => setInput(e.target.value)}
                   placeholder="Écrivez votre question…" disabled={busy} autoFocus />
            <button type="submit" disabled={busy || !input.trim()} aria-label="Envoyer"><SendIcon /></button>
          </form>
        </div>
      )}
    </>
  );
}
