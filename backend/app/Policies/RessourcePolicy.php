<?php

namespace App\Policies;

use App\Models\Matiere;
use App\Models\Ressource;
use App\Models\User;

/**
 * Policy filiere : verification SERVEUR, independante de l'interface.
 * Garantit qu'aucun Delegue ne peut publier hors de sa filiere, meme en
 * manipulant directement les requetes API. Retrace la chaine :
 *   matiere -> niveau -> filiere  et compare au filiere_id de l'utilisateur.
 */
class RessourcePolicy
{
    /**
     * Publier dans une matiere donnee.
     * - Admin : interdit de publier (gestion uniquement).
     * - Delegue : autorise SI la matiere appartient a SA CLASSE (son niveau).
     * - Etudiant : interdit.
     *
     * Un delegue est propre a une classe (un niveau precis d'une filiere) :
     * il ne peut donc publier que dans les matieres de ce niveau.
     */
    public function publishInMatiere(User $user, Matiere $matiere): bool
    {
        if (! $user->isDelegue()) {
            return false;
        }

        return $user->niveau_id !== null
            && (int) $matiere->niveau_id === (int) $user->niveau_id;
    }

    /**
     * Supprimer une ressource.
     * - Admin : moderation a posteriori (toute ressource).
     * - Delegue : uniquement ses propres ressources.
     */
    public function delete(User $user, Ressource $ressource): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $user->isDelegue() && (int) $ressource->user_id === (int) $user->id;
    }

    /**
     * Mettre a jour une ressource (auteur delegue ou admin).
     */
    public function update(User $user, Ressource $ressource): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $user->isDelegue() && (int) $ressource->user_id === (int) $user->id;
    }
}
