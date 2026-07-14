// SDK 54 : l'ancienne API FileSystem (downloadAsync, documentDirectory, …)
// est désormais sous /legacy. On l'utilise pour conserver le mode hors-ligne.
import * as FileSystem from 'expo-file-system/legacy';
import client from '../api/client';
import { API_URL } from '../config';

// Origine de l'API (ex : http://192.168.1.10:8000) déduite de API_URL.
const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

// Le serveur génère les URLs de fichiers à partir de APP_URL (souvent
// "localhost") — injoignable depuis le téléphone. On réécrit donc l'hôte
// vers l'origine de l'API pour que le téléchargement aboutisse.
function toReachableUrl(url) {
  if (!url) return url;
  const path = url.replace(/^https?:\/\/[^/]+/, ''); // garde le chemin après l'hôte
  return API_ORIGIN + (path.startsWith('/') ? path : '/' + path);
}

// URL d'un fichier joignable depuis le téléphone (ouverture / aperçu en ligne).
export function reachableFileUrl(url) {
  return toReachableUrl(url);
}
import * as dbApi from '../db/database';

// ---------------------------------------------------------------------------
// Synchronisation : telecharge les metadonnees du serveur vers SQLite, et
// gere le telechargement physique des fichiers pour la consultation offline.
// ---------------------------------------------------------------------------

const LAST_SYNC_KEY = 'last_sync_ressources';
const DOWNLOAD_DIR = FileSystem.documentDirectory + 'ressources/';

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(DOWNLOAD_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(DOWNLOAD_DIR, { intermediates: true });
  }
}

// Catalogue filieres -> niveaux -> matieres (pour les filtres).
export async function syncCatalogue() {
  const { data } = await client.get('/filieres');
  await dbApi.saveCatalogue(data.data || []);
}

// Ressources : synchronisation COMPLETE (remplace le cache local).
// On récupère toute la liste et on remplace, ce qui évite les ressources
// obsolètes/fantômes (ex. après un re-seed qui change les IDs de filière).
// Si `userId` est fourni, on nettoie aussi les fichiers hors-ligne devenus
// orphelins (ressource supprimée ou sortie du périmètre filière/niveau).
export async function syncRessources(userId = null) {
  const { data } = await client.get('/ressources');
  await dbApi.replaceRessources(data.data || []);

  if (userId) {
    try {
      const orphans = await dbApi.getOrphanDownloads(userId);
      for (const o of orphans) {
        if (o.local_uri) {
          try { await FileSystem.deleteAsync(o.local_uri, { idempotent: true }); } catch (_) { /* ignore */ }
        }
      }
      await dbApi.deleteOrphanDownloads(userId);
    } catch (_) { /* le nettoyage ne doit jamais bloquer la synchro */ }
  }

  if (data.server_time) {
    await dbApi.setMeta(LAST_SYNC_KEY, data.server_time);
  }
  return (data.data || []).length;
}

// Synchronisation complete (a l'ouverture de l'app quand on est en ligne).
export async function fullSync(userId = null) {
  await syncCatalogue();
  const count = await syncRessources(userId);
  await dbApi.setMeta('last_sync_at', new Date().toISOString());
  return count;
}

// Telecharge le fichier d'une ressource pour le rendre disponible hors-ligne
// POUR L'UTILISATEUR COURANT (fichier et etat propres a chaque compte).
export async function downloadRessource(userId, ressource) {
  if (!ressource.url_fichier) {
    throw new Error("Cette ressource n'a pas de fichier telechargeable.");
  }
  await ensureDir();

  // Nom de fichier local : utilisateur + ressource + extension d'origine.
  const sourceUrl = toReachableUrl(ressource.url_fichier);
  const extMatch = sourceUrl.split('?')[0].match(/\.([a-zA-Z0-9]+)$/);
  const ext = extMatch ? extMatch[1] : 'bin';
  const dest = `${DOWNLOAD_DIR}u${userId}_r${ressource.id}.${ext}`;

  const result = await FileSystem.downloadAsync(sourceUrl, dest);
  if (result.status !== 200) {
    throw new Error('Echec du telechargement (HTTP ' + result.status + ').');
  }

  await dbApi.setLocalUri(userId, ressource.id, result.uri);
  return result.uri;
}

// Supprime le fichier local de CET utilisateur (libere de l'espace).
export async function removeDownload(userId, ressource) {
  if (ressource.local_uri) {
    try {
      await FileSystem.deleteAsync(ressource.local_uri, { idempotent: true });
    } catch (_) { /* ignore */ }
  }
  await dbApi.setLocalUri(userId, ressource.id, null);
}

export async function getLastSyncAt() {
  return dbApi.getMeta('last_sync_at');
}
