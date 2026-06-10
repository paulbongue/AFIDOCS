import * as FileSystem from 'expo-file-system';
import client from '../api/client';
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

// Ressources : synchronisation INCREMENTALE via le parametre `since`.
export async function syncRessources() {
  const since = await dbApi.getMeta(LAST_SYNC_KEY);
  const params = since ? { since } : {};
  const { data } = await client.get('/ressources', { params });

  await dbApi.upsertRessources(data.data || []);
  if (data.server_time) {
    await dbApi.setMeta(LAST_SYNC_KEY, data.server_time);
  }
  return (data.data || []).length;
}

// Synchronisation complete (a l'ouverture de l'app quand on est en ligne).
export async function fullSync() {
  await syncCatalogue();
  const count = await syncRessources();
  await dbApi.setMeta('last_sync_at', new Date().toISOString());
  return count;
}

// Telecharge le fichier d'une ressource pour le rendre disponible hors-ligne.
export async function downloadRessource(ressource) {
  if (!ressource.url_fichier) {
    throw new Error("Cette ressource n'a pas de fichier telechargeable.");
  }
  await ensureDir();

  // Nom de fichier local : id + extension d'origine.
  const extMatch = ressource.url_fichier.split('?')[0].match(/\.([a-zA-Z0-9]+)$/);
  const ext = extMatch ? extMatch[1] : 'bin';
  const dest = `${DOWNLOAD_DIR}ressource_${ressource.id}.${ext}`;

  const result = await FileSystem.downloadAsync(ressource.url_fichier, dest);
  if (result.status !== 200) {
    throw new Error('Echec du telechargement (HTTP ' + result.status + ').');
  }

  await dbApi.setLocalUri(ressource.id, result.uri);
  return result.uri;
}

// Supprime le fichier local (libere de l'espace) sans perdre la metadonnee.
export async function removeDownload(ressource) {
  if (ressource.local_uri) {
    try {
      await FileSystem.deleteAsync(ressource.local_uri, { idempotent: true });
    } catch (_) { /* ignore */ }
  }
  await dbApi.setLocalUri(ressource.id, null);
}

export async function getLastSyncAt() {
  return dbApi.getMeta('last_sync_at');
}
