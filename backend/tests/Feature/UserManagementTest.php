<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_a_user(): void
    {
        Sanctum::actingAs($this->makeUser('admin'));

        $this->postJson('/api/admin/users', [
            'name' => 'Nouvel Etudiant',
            'email' => 'nouveau@afi.sn',
            'password' => 'password',
            'role' => 'etudiant',
        ])->assertStatus(201);

        $this->assertDatabaseHas('users', ['email' => 'nouveau@afi.sn', 'role' => 'etudiant']);
    }

    public function test_admin_can_update_a_user(): void
    {
        Sanctum::actingAs($this->makeUser('admin'));
        $cible = $this->makeUser('etudiant', ['email' => 'cible@afi.sn']);

        $this->putJson('/api/admin/users/'.$cible->id, ['name' => 'Nom Corrige'])
            ->assertOk();

        $this->assertDatabaseHas('users', ['id' => $cible->id, 'name' => 'Nom Corrige']);
    }

    public function test_admin_can_delete_a_user(): void
    {
        Sanctum::actingAs($this->makeUser('admin'));
        $cible = $this->makeUser('etudiant');

        $this->deleteJson('/api/admin/users/'.$cible->id)->assertOk();
        $this->assertDatabaseMissing('users', ['id' => $cible->id]);
    }

    public function test_delegue_requires_a_class(): void
    {
        Sanctum::actingAs($this->makeUser('admin'));
        $filiere = $this->makeFiliere('GL');

        // Un delegue sans niveau_id doit etre refuse (regle metier).
        $this->postJson('/api/admin/users', [
            'name' => 'Delegue Sans Classe',
            'email' => 'dsc@afi.sn',
            'password' => 'password',
            'role' => 'delegue',
            'filiere_id' => $filiere->id,
        ])->assertStatus(422);
    }

    public function test_non_admin_cannot_access_user_management(): void
    {
        Sanctum::actingAs($this->makeUser('etudiant'));
        $this->getJson('/api/admin/users')->assertStatus(403);
    }
}
