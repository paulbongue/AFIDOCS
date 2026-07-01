<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Double authentification par e-mail (OTP).
 * On stocke uniquement le HASH du code (jamais le code en clair), sa date
 * d'expiration, le nombre d'essais et la date du dernier envoi (anti-spam).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('otp_code_hash')->nullable()->after('password');
            $table->timestamp('otp_expires_at')->nullable()->after('otp_code_hash');
            $table->unsignedTinyInteger('otp_attempts')->default(0)->after('otp_expires_at');
            $table->timestamp('otp_last_sent_at')->nullable()->after('otp_attempts');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['otp_code_hash', 'otp_expires_at', 'otp_attempts', 'otp_last_sent_at']);
        });
    }
};
