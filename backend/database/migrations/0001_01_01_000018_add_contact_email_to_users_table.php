<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adresse e-mail de SÉCURITÉ (réelle), distincte de l'identifiant de connexion
 * (nom@afi.sn). C'est vers cette adresse que part le code OTP. Elle doit être
 * confirmée (via un code envoyé à l'adresse saisie) avant d'être active :
 *   - contact_email        : adresse confirmée, utilisée pour l'OTP
 *   - contact_email_pending : adresse en attente de confirmation
 *   - contact_email_code_* : code de confirmation (haché) + expiration
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('contact_email')->nullable()->after('email');
            $table->string('contact_email_pending')->nullable()->after('contact_email');
            $table->string('contact_email_code_hash')->nullable()->after('contact_email_pending');
            $table->timestamp('contact_email_code_expires_at')->nullable()->after('contact_email_code_hash');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'contact_email',
                'contact_email_pending',
                'contact_email_code_hash',
                'contact_email_code_expires_at',
            ]);
        });
    }
};
