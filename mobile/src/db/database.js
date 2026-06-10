import * as SQLite from 'expo-sqlite';

// ---------------------------------------------------------------------------
// Base SQLite locale : cache des metadonnees pour la consultation HORS-LIGNE.
// Les fichiers eux-memes sont stockes par expo-file-system (cf. sync.js) et
// references ici par la colonne `local_uri`.
// ---------------------------------------------------------------------------

let db;

export async function initDatabase() {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('afi.db');

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS filieres (
      id INTEGER PRIMARY KEY,
      code TEXT,
      nom TEXT,
      couleur TEXT
    );

    CREATE TABLE IF NOT EXISTS niveaux (
      id INTEGER PRIMARY KEY,
      nom TEXT,
      filiere_id INTEGER
    );

    CREATE TABLE IF NOT EXISTS matieres (
      id INTEGER PRIMARY KEY,
      nom TEXT,
      niveau_id INTEGER
    );

    CREATE TABLE IF NOT EXISTS ressources (
      id INTEGER PRIMARY KEY,
      titre TEXT,
      description TEXT,
      type_fichier TEXT,
      url_fichier TEXT,
      taille_fichier INTEGER,
      matiere_id INTEGER,
      matiere_nom TEXT,
      niveau_id INTEGER,
      niveau_nom TEXT,
      filiere_id INTEGER,
      filiere_code TEXT,
      filiere_couleur TEXT,
      auteur_nom TEXT,
      commentaires_count INTEGER DEFAULT 0,
      updated_at TEXT,
      local_uri TEXT          -- chemin du fichier telecharge (NULL si non dispo hors-ligne)
    );

    CREATE TABLE IF NOT EXISTS commentaires (
      id INTEGER PRIMARY KEY,
      ressource_id INTEGER,
      contenu TEXT,
      auteur_nom TEXT,
      user_id INTEGER,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS meta (
      cle TEXT PRIMARY KEY,
      valeur TEXT
    );

    -- Téléchargements PAR UTILISATEUR : l'état hors-ligne est propre à chaque compte.
    CREATE TABLE IF NOT EXISTS downloads (
      user_id INTEGER,
      ressource_id INTEGER,
      local_uri TEXT,
      PRIMARY KEY (user_id, ressource_id)
    );
  `);

  // Migration douce : ajoute user_id aux installations existantes (ignore si déjà présent).
  try { await db.execAsync('ALTER TABLE commentaires ADD COLUMN user_id INTEGER;'); } catch (_) { /* déjà là */ }

  return db;
}

// --- Catalogue (filieres / niveaux / matieres) -----------------------------

export async function saveCatalogue(filieres) {
  await db.withTransactionAsync(async () => {
    await db.execAsync('DELETE FROM filieres; DELETE FROM niveaux; DELETE FROM matieres;');
    for (const f of filieres) {
      await db.runAsync(
        'INSERT INTO filieres (id, code, nom, couleur) VALUES (?, ?, ?, ?)',
        [f.id, f.code, f.nom, f.couleur]
      );
      for (const n of f.niveaux || []) {
        await db.runAsync(
          'INSERT INTO niveaux (id, nom, filiere_id) VALUES (?, ?, ?)',
          [n.id, n.nom, f.id]
        );
        for (const m of n.matieres || []) {
          await db.runAsync(
            'INSERT INTO matieres (id, nom, niveau_id) VALUES (?, ?, ?)',
            [m.id, m.nom, n.id]
          );
        }
      }
    }
  });
}

export function getFilieres() {
  return db.getAllAsync('SELECT * FROM filieres ORDER BY code');
}

export function getNiveaux(filiereId) {
  return db.getAllAsync('SELECT * FROM niveaux WHERE filiere_id = ? ORDER BY nom', [filiereId]);
}

export function getMatieres(niveauId) {
  return db.getAllAsync('SELECT * FROM matieres WHERE niveau_id = ? ORDER BY nom', [niveauId]);
}

// --- Ressources ------------------------------------------------------------

// Transforme un objet API (relations imbriquees) en ligne plate locale.
function flatten(r) {
  const niveau = r.matiere?.niveau;
  const filiere = niveau?.filiere;
  return {
    id: r.id,
    titre: r.titre,
    description: r.description ?? '',
    type_fichier: r.type_fichier,
    url_fichier: r.url_fichier ?? '',
    taille_fichier: r.taille_fichier ?? 0,
    matiere_id: r.matiere_id,
    matiere_nom: r.matiere?.nom ?? '',
    niveau_id: niveau?.id ?? null,
    niveau_nom: niveau?.nom ?? '',
    filiere_id: filiere?.id ?? null,
    filiere_code: filiere?.code ?? '',
    filiere_couleur: filiere?.couleur ?? '',
    auteur_nom: r.auteur?.name ?? '',
    commentaires_count: r.commentaires_count ?? 0,
    updated_at: r.updated_at ?? '',
  };
}

// Upsert sans ecraser local_uri (un fichier deja telecharge le reste).
export async function upsertRessources(list) {
  await db.withTransactionAsync(async () => {
    for (const raw of list) {
      const r = flatten(raw);
      await db.runAsync(
        `INSERT INTO ressources
          (id, titre, description, type_fichier, url_fichier, taille_fichier,
           matiere_id, matiere_nom, niveau_id, niveau_nom, filiere_id,
           filiere_code, filiere_couleur, auteur_nom, commentaires_count, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
         ON CONFLICT(id) DO UPDATE SET
           titre=excluded.titre,
           description=excluded.description,
           type_fichier=excluded.type_fichier,
           url_fichier=excluded.url_fichier,
           taille_fichier=excluded.taille_fichier,
           matiere_id=excluded.matiere_id,
           matiere_nom=excluded.matiere_nom,
           niveau_id=excluded.niveau_id,
           niveau_nom=excluded.niveau_nom,
           filiere_id=excluded.filiere_id,
           filiere_code=excluded.filiere_code,
           filiere_couleur=excluded.filiere_couleur,
           auteur_nom=excluded.auteur_nom,
           commentaires_count=excluded.commentaires_count,
           updated_at=excluded.updated_at`,
        [
          r.id, r.titre, r.description, r.type_fichier, r.url_fichier, r.taille_fichier,
          r.matiere_id, r.matiere_nom, r.niveau_id, r.niveau_nom, r.filiere_id,
          r.filiere_code, r.filiere_couleur, r.auteur_nom, r.commentaires_count, r.updated_at,
        ]
      );
    }
  });
}

// local_uri provient désormais de la table downloads PROPRE A l'utilisateur courant.
// Remplace TOUT le cache ressources par la liste fournie (évite les
// enregistrements fantômes/obsolètes après un re-seed côté serveur).
export async function replaceRessources(list) {
  await db.runAsync('DELETE FROM ressources');
  await upsertRessources(list);
}

export function getRessources(filters = {}, userId = null) {
  const where = [];
  const params = [userId];   // pour le LEFT JOIN downloads

  if (filters.search) {
    where.push('(r.titre LIKE ? OR r.description LIKE ?)');
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }
  if (filters.filiere_id) { where.push('r.filiere_id = ?'); params.push(filters.filiere_id); }
  if (filters.niveau_id) { where.push('r.niveau_id = ?'); params.push(filters.niveau_id); }
  if (filters.matiere_id) { where.push('r.matiere_id = ?'); params.push(filters.matiere_id); }
  if (filters.type_fichier) { where.push('r.type_fichier = ?'); params.push(filters.type_fichier); }
  if (filters.offlineOnly) { where.push('d.local_uri IS NOT NULL'); }

  const sql =
    'SELECT r.*, d.local_uri AS local_uri FROM ressources r ' +
    'LEFT JOIN downloads d ON d.ressource_id = r.id AND d.user_id = ?' +
    (where.length ? ' WHERE ' + where.join(' AND ') : '') +
    ' ORDER BY datetime(r.updated_at) DESC';

  return db.getAllAsync(sql, params);
}

export function getRessource(id, userId = null) {
  return db.getFirstAsync(
    'SELECT r.*, d.local_uri AS local_uri FROM ressources r ' +
    'LEFT JOIN downloads d ON d.ressource_id = r.id AND d.user_id = ? WHERE r.id = ?',
    [userId, id]
  );
}

export async function setLocalUri(userId, id, uri) {
  if (uri) {
    await db.runAsync(
      'INSERT INTO downloads (user_id, ressource_id, local_uri) VALUES (?,?,?) ' +
      'ON CONFLICT(user_id, ressource_id) DO UPDATE SET local_uri = excluded.local_uri',
      [userId, id, uri]
    );
  } else {
    await db.runAsync('DELETE FROM downloads WHERE user_id = ? AND ressource_id = ?', [userId, id]);
  }
}

export function getDownloaded(userId) {
  return db.getAllAsync(
    'SELECT r.*, d.local_uri AS local_uri FROM downloads d ' +
    'JOIN ressources r ON r.id = d.ressource_id WHERE d.user_id = ? ORDER BY r.titre',
    [userId]
  );
}

export function countDownloaded(userId) {
  return db.getFirstAsync('SELECT COUNT(*) AS n FROM downloads WHERE user_id = ?', [userId]);
}

// --- Commentaires ----------------------------------------------------------

export async function saveComments(ressourceId, list) {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM commentaires WHERE ressource_id = ?', [ressourceId]);
    for (const c of list) {
      await db.runAsync(
        'INSERT INTO commentaires (id, ressource_id, contenu, auteur_nom, user_id, created_at) VALUES (?,?,?,?,?,?)',
        [c.id, ressourceId, c.contenu, c.auteur?.name ?? '', c.user_id ?? null, c.created_at ?? '']
      );
    }
  });
}

export function getComments(ressourceId) {
  return db.getAllAsync(
    'SELECT * FROM commentaires WHERE ressource_id = ? ORDER BY datetime(created_at) DESC',
    [ressourceId]
  );
}

// --- Meta (cle/valeur : date de derniere synchro, etc.) --------------------

export async function setMeta(cle, valeur) {
  await db.runAsync(
    'INSERT INTO meta (cle, valeur) VALUES (?, ?) ON CONFLICT(cle) DO UPDATE SET valeur = excluded.valeur',
    [cle, String(valeur)]
  );
}

export async function getMeta(cle) {
  const row = await db.getFirstAsync('SELECT valeur FROM meta WHERE cle = ?', [cle]);
  return row?.valeur ?? null;
}

export async function clearAll() {
  await db.execAsync(`
    DELETE FROM filieres; DELETE FROM niveaux; DELETE FROM matieres;
    DELETE FROM ressources; DELETE FROM commentaires; DELETE FROM meta;
  `);
}
