import React, { useEffect, useState } from 'react';

// Hook de pagination : découpe une liste en pages de `perPage` éléments.
export function usePagination(items, perPage = 10) {
  const [page, setPage] = useState(1);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  useEffect(() => { if (page > totalPages) setPage(1); }, [totalPages, page]);
  const start = (page - 1) * perPage;
  const pageItems = items.slice(start, start + perPage);
  return { pageItems, page, setPage, totalPages, total, perPage };
}

// Liste compacte des pages : 1 … (page-1) page (page+1) … N
function pageList(page, total) {
  const out = [];
  for (let p = 1; p <= total; p++) {
    if (p === 1 || p === total || (p >= page - 1 && p <= page + 1)) {
      out.push(p);
    } else if (out[out.length - 1] !== '…') {
      out.push('…');
    }
  }
  return out;
}

// Barre de pagination : précédent · pastilles numérotées · suivant.
export default function Pagination({ page, setPage, totalPages, total, perPage }) {
  if (totalPages <= 1) return null;
  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);
  return (
    <div className="pager">
      <span className="pager-info">{from}–{to} sur {total}</span>
      <div className="pager-bt