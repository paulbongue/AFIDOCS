<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background:#F1F5F9; font-family:Arial,Helvetica,sans-serif; color:#0F1932;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9; padding:32px 0;">
    <tr><td align="center">
      <table role="presentation" width="460" cellpadding="0" cellspacing="0"
             style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 6px 24px rgba(15,25,50,0.08);">
        <tr><td style="background:#0F1932; padding:22px 28px;">
          <span style="color:#ffffff; font-size:20px; font-weight:800; letter-spacing:0.5px;">AFI-DOCS</span>
        </td></tr>
        <tr><td style="padding:30px 28px 8px;">
          <p style="margin:0 0 8px; font-size:15px;">Bonjour {{ $userName }},</p>
          <p style="margin:0 0 18px; font-size:15px; line-height:22px; color:#475569;">
            Votre compte sur la plateforme AFI-DOCS a été créé. Voici vos accès :
          </p>
        </td></tr>
        <tr><td style="padding:0 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                 style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px;">
            <tr><td style="padding:14px 16px; font-size:14px;">
              @if(!empty($filiereNom))
                <div style="margin-bottom:8px;"><strong>Filière :</strong> {{ $filiereNom }}@if(!empty($niveauNom)) — {{ $niveauNom }}@endif</div>
              @endif
              <div style="margin-bottom:8px;"><strong>Identifiant :</strong> {{ $identifiant }}</div>
              <div><strong>Mot de passe :</strong> {{ $motDePasse }}</div>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:18px 28px 4px; font-size:14px; line-height:22px; color:#475569;">
          <p style="margin:0 0 12px;">
            Connectez-vous sur <a href="https://afidocs.duckdns.org" style="color:#C9302D;">afidocs.duckdns.org</a>,
            puis rendez-vous dans <strong>Profil → E-mail de sécurité</strong> pour
            <strong>confirmer cette adresse en un clic</strong> et sécuriser votre compte.
          </p>
          <p style="margin:0;">Pensez à modifier votre mot de passe à la première connexion.</p>
        </td></tr>
        <tr><td style="background:#F8FAFC; padding:16px 28px; border-top:1px solid #E2E8F0;">
          <p style="margin:0; font-size:12px; color:#94A3B8;">
            AFI-DOCS — L'Université de l'Entreprise · E-mail automatique, merci de ne pas répondre.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
