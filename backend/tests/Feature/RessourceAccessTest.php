<?php

namespace Tests\Feature;

use App\Models\Ressource;
use App\Models\User;
use App\Notifications\RessourcePubliee;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RessourceAccessTest extends TestCase
{
    use RefreshDatabase;

    private $filiere;
    private $m1;      // classe M1
    private $m2;      // classe M2
    private $matM1a;  // matiere de M1
    private $matM1b;  // 2e matiere de M1 (cours commun)
    private $matM2;   // matiere de M2
    private $delegueM1;
    private $etudiant;
    private $admin;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
        Http::fake();   // neutralise les push Expo

        $this->filiere = $this->makeFiliere('SRT');
        $this->m1 = $this->makeClasse($this->filiere, 'M1');
        $this->m2 = $this->makeClasse($this->filiere, 'M2');
        $this->matM1a = $this->makeMatiere($this->m1, 'IA');
        $this->matM1b = $this->makeMatiere($this->m1, 'Reseaux');
        $this->matM2 = $this->makeMatiere($this->m2, 'Securite');

        $this->delegueM1 = $this->makeUser('delegue', ['filiere_id' => $this->filiere->id, 'niveau_id' => $this->m1->id]);
        $this->etudiant = $this->makeUser('etudiant', ['filiere_id' => $this->filiere->id, 'niveau_id' => $this->m1->id]);
        $this->admin = $this->makeUser('admin');
    }

    private function file(): UploadedFile
    {
        return UploadedFile::fake()->create('cours.pdf', 120, 'application/pdf');
    }

    public function test_etudiant_cannot_publish(): void
    {
        Sanctum::actingAs($this->etudiant);
        $this->postJson('/api/ressources', ['titre' => 'X', 'matiere_id' => $this->matM1a->id, 'fichier' => $this->file()])
            ->assertStatus(403);
    }

    public function test_delegue_can_publish_in_own_class(): void
    {
        Sanctum::actingAs($this->delegueM1);
        $this->postJson('/api/ressources', ['titre' => 'Cours IA', 'matiere_id' => $this->matM1a->id, 'fichier' => $this->file()])
            ->assertStatus(201);
        $this->assertDatabaseHas('ressources', ['titre' => 'Cours IA', 'matiere_id' => $this->matM1a->id]);
    }

    public function test_delegue_cannot_publish_in_another_class(): void
    {
        Sanctum::actingAs($this->delegueM1);
        $this->postJson('/api/ressources', ['titre' => 'Hors classe', 'matiere_id' => $this->matM2->id, 'fichier' => $this->file()])
            ->assertStatus(403);
    }

    public function test_admin_can_publish_anywhere(): void
    {
        Sanctum::actingAs($this->admin);
        $this->postJson('/api/admin/ressources', ['titre' => 'Par admin', 'matiere_id' => $this->matM2->id, 'fichier' => $this->file()])
            ->assertStatus(201);
    }

    public function test_only_students_of_the_exact_class_are_notified(): void
    {
        Notification::fake();
        // Un etudiant de M2 (meme filiere) ne doit PAS etre notifie d'un cours M1.
        $etudiantM2 = $this->makeUser('etudiant', ['filiere_id' => $this->filiere->id, 'niveau_id' => $this->m2->id]);

        Sanctum::actingAs($this->delegueM1);
        $this->postJson('/api/ressources', ['titre' => 'Cours M1', 'matiere_id' => $this->matM1a->id, 'fichier' => $this->file()])
            ->assertStatus(201);

        Notification::assertSentTo($this->etudiant, RessourcePubliee::class);   // M1 : notifie
        Notification::assertNotSentTo($etudiantM2, RessourcePubliee::class);    // M2 : pas notifie
    }

    public function test_multi_publish_same_niveau_creates_one_per_matiere(): void
    {
        Sanctum::actingAs($this->admin);
        $this->postJson('/api/admin/ressources', [
            'titre' => 'Cours commun',
            'matiere_ids' => [$this->matM1a->id, $this->matM1b->id],
            'fichier' => $this->file(),
        ])->assertStatus(201)->assertJsonPath('count', 2);

        $this->assertEquals(2, Ressource::where('titre', 'Cours commun')->count());
    }

    public function test_multi_publish_mixed_niveau_is_rejected(): void
    {
        Sanctum::actingAs($this->admin);
        $this->postJson('/api/admin/ressources', [
            'titre' => 'Niveaux melanges',
            'matiere_ids' => [$this->matM1a->id, $this->matM2->id],
            'fichier' => $this->file(),
        ])->assertStatus(422);
    }

    public function test_delegue_can_update_and_delete_only_his_own(): void
    {
        $autre = $this->makeUser('delegue', ['filiere_id' => $this->filiere->id, 'niveau_id' => $this->m1->id]);
        $sienne = $this->makeRessource($this->delegueM1);
        $autreRes = $this->makeRessource($autre);

        Sanctum::actingAs($this->delegueM1);
        // Sa propre ressource : OK
        $this->putJson('/api/ressources/'.$sienne->id, ['titre' => 'Titre modifie'])->assertOk();
        $this->assertDatabaseHas('ressources', ['id' => $sienne->id, 'titre' => 'Titre modifie']);
        // Celle d'un autre : interdit
        $this->putJson('/api/ressources/'.$autreRes->id, ['titre' => 'Pirate'])->assertStatus(403);
        $this->deleteJson('/api/ressources/'.$autreRes->id)->assertStatus(403);
    }

    public function test_admin_can_update_and_delete_any_ressource(): void
    {
        $res = $this->makeRessource($this->delegueM1);

        Sanctum::actingAs($this->admin);
        $this->putJson('/api/admin/ressources/'.$res->id, ['titre' => 'Corrige par admin'])->assertOk();
        $this->assertDatabaseHas('ressources', ['id' => $res->id, 'titre' => 'Corrige par admin']);
        $this->deleteJson('/api/admin/ressources/'.$res->id)->assertOk();
        $this->assertDatabaseMissing('ressources', ['id' => $res->id]);
    }

    private function makeRessource(User $auteur): Ressource
    {
        return Ressource::create([
            'titre' => 'Ressource '.uniqid(),
            'description' => null,
            'type_fichier' => 'pdf',
            'chemin_fichier' => 'ressources/test.pdf',
            'taille_fichier' => 1000,
            'matiere_id' => $this->matM1a->id,
            'user_id' => $auteur->id,
        ]);
    }
}
