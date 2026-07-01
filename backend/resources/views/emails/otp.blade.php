<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code de connexion AFI-DOCS</title>
</head>
<body style="margin:0; padding:0; background:#F1F5F9; font-family:Arial,Helvetica,sans-serif; color:#0F1932;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9; padding:32px 0;">
        <tr>
            <td align="center">
                <table role="presentation" width="440" cellpadding="0" cellspacing="0"
                       style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 6px 24px rgba(15,25,50,0.08);">
                    <tr>
                        <td style="background:#0F1932; padding:22px 28px;">
                            <span style="color:#ffffff; font-size:20px; font-weight:800; letter-spacing:0.5px;">AFI-DOCS</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:30px 28px 8px;">
                            <p style="margin:0 0 8px; font-size:15px;">Bonjour {{ $userName }},</p>
                            <p style="margin:0 0 20px; font-size:15px; line-height:22px; color:#475569;">
                                Voici votre code de connexion à usage unique. Saisissez-le pour finaliser votre connexion :
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding:0 28px 8px;">
                            <div style="display:inline-block; background:#FAEFED; border:1px solid #F0D6D3; border-radius:12px;
                                        padding:16px 28px; font-size:34px; font-weight:800; letter-spacing:10px; color:#C9302D;">
                                {{ $code }}
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:16px 28px 28px;">
                            <p style="margin:0 0 6px; font-size:13px; color:#64748B;">
                                Ce code expire dans <strong>{{ $ttlMinutes }} minutes</strong>.
                            </p>
                            <p style="margin:0; font-size:13px; color:#64748B;">
                                Si vous n'êtes pas à l'origine de cette connexion, ignorez cet e-mail et changez votre mot de passe.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background:#F8FAFC; padding:16px 28px; border-top:1px solid #E2E8F0;">
                            <p style="margin:0; font-size:12px; color:#94A3B8;">
                                AFI-DOCS — L'Université de l'Entreprise · E-mail automatique, merci de ne pas répondre.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
