<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_succeeds_and_returns_token(): void
    {
        $this->makeUser('etudiant', ['email' => 'el@afi.sn', 'password' => Hash::make('password')]);

        $res = $this->postJson('/api/login', ['email' => 'el@afi.sn', 'password' => 'password']);

        $res->assertOk()->assertJsonStructure(['token', 'user' => ['id', 'role']]);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        $this->makeUser('etudiant', ['email' => 'el@afi.sn', 'password' => Hash::make('password')]);

        $this->postJson('/api/login', ['email' => 'el@afi.sn', 'password' => 'mauvais'])
            ->assertStatus(422);
    }

    public function test_login_is_rate_limited_after_six_attempts(): void
    {
        $payload = ['email' => 'inconnu@afi.sn', 'password' => 'x'];

        // 6 tentatives autorisees...
        for ($i = 0; $i < 6; $i++) {
            $this->postJson('/api/login', $payload);
        }
        // ...la 7e est bloquee (anti-brute-force).
        $this->postJson('/api/login', $payload)->assertStatus(429);
    }
}
