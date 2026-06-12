# Checklist de tests — AFI-DOCS

À dérouler avant la mise en ligne. Cocher chaque scénario. Les tests automatisés (backend) couvrent déjà les règles d'autorisation ; cette liste couvre le parcours réel web + mobile.

## Tests automatisés (backend)

```bash
cd backend
php artisan test
```

Tout doit être au vert. Ces tests vérifient : connexion + anti-brute-force, droits de publication par rôle, verrou de niveau (multi-classes), édition/suppression réservée au propriétaire (ou admin), gestion des utilisateurs par l'admin.

---

## 1. Authentification (web + mobile)

- [ ] Connexion admin, délégué, étudiant avec un bon mot de passe → accès à l'espace.
- [ ] Mauvais mot de passe → message d'erreur clair, pas d'accès.
- [ ] Après connexion, on arrive bien sur **la liste des ressources** (pas une ressource isolée).
- [ ] Déconnexion → retour à l'écran de connexion ; impossible de revenir en arrière sans se reconnecter.
- [ ] Les identifiants de démo n'apparaissent plus sur les écrans de connexion.

## 2. Ressources — consultation

- [ ] Étudiant : voit d'abord les ressources de **sa classe**, puis « Rechercher d'autres ressources » donne accès à toutes.
- [ ] Admin : voit **toutes** les ressources.
- [ ] Recherche et filtre par filière fonctionnent.
- [ ] Ouvrir une ressource → aperçu in-app (PDF/image) ; bouton retour fonctionne.

## 3. Publication

- [ ] Délégué : publie dans sa classe → la ressource apparaît, les étudiants de la filière reçoivent une notification.
- [ ] Délégué : ne peut PAS publier dans une autre classe.
- [ ] Admin : publie dans n'importe quelle filière.
- [ ] **Multi-classes** : sélectionner plusieurs matières du **même niveau** → une ressource créée par classe.
- [ ] Multi-classes : les classes d'un **autre niveau** sont grisées/non sélectionnables ; un envoi mixte est refusé.
- [ ] Publier différents types de fichiers (pptx, docx, pdf, xlsx) → tous acceptés.
- [ ] Fichier volumineux (proche de 50 Mo) → accepté ; au-delà → refusé proprement.

## 4. Édition / suppression

- [ ] Délégué : modifie le titre/description/fichier d'une de SES ressources.
- [ ] Délégué : ne voit pas « Modifier » sur la ressource d'un autre.
- [ ] Admin : modifie n'importe quelle ressource (titre, description, remplacement de fichier).
- [ ] Suppression : délégué (les siennes) et admin (toutes) → la ressource disparaît.

## 5. Commentaires

- [ ] Ajouter un commentaire → le délégué auteur et les admins sont notifiés.
- [ ] Supprimer son propre commentaire ; l'admin peut supprimer n'importe lequel.

## 6. Notifications

- [ ] La cloche se met à jour (compteur non lus).
- [ ] Cliquer une notification ouvre la ressource concernée, avec retour possible.
- [ ] « Tout marquer comme lu » fonctionne.

## 7. Centre de contrôle (admin)

- [ ] Désigner un délégué dans une classe → l'ancien délégué redevient automatiquement étudiant.
- [ ] Révoquer un délégué → il redevient étudiant, rattaché à sa classe.
- [ ] Créer un compte (étudiant/délégué/admin) ; un délégué exige une classe.
- [ ] **Modifier** un compte existant (nom, email, rôle, filière, classe ; mot de passe vide = inchangé).
- [ ] Supprimer un compte.
- [ ] Filtre des comptes par filière et recherche.

## 8. Mobile — spécifique hors-ligne

- [ ] Première synchro en ligne → les ressources se chargent.
- [ ] Télécharger une ressource → marquée « hors-ligne ».
- [ ] Couper le réseau (mode avion) → la ressource téléchargée reste consultable ; les autres affichent un message clair.
- [ ] Téléchargements liés au **bon compte** (un autre compte ne voit pas les téléchargements du premier).
- [ ] Changer son mot de passe depuis l'app.
- [ ] Onglet « Hors-ligne » présent pour tous les rôles, admin compris.

## 9. Sécurité (rapide)

- [ ] En production : une erreur n'affiche aucun détail technique (`APP_DEBUG=false`).
- [ ] Le site répond bien en **HTTPS** (cadenas), HTTP redirige vers HTTPS.
- [ ] Enchaîner > 6 connexions échouées rapidement → blocage temporaire (429).
- [ ] Un étudiant ne peut atteindre aucune page/API d'admin (403).

## 10. Après déploiement

- [ ] L'APK mobile se connecte au serveur en ligne et synchronise.
- [ ] Lancer une sauvegarde manuelle (`sauvegarde.sh`) puis **tester une restauration** sur une base vide.
