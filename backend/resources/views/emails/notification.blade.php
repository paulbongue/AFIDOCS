<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#14213D;">
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <div style="background:#C0392B;color:#fff;padding:16px 20px;border-radius:12px 12px 0 0;">
      <div style="font-size:18px;font-weight:800;">AFI-DOCS</div>
    </div>
    <div style="background:#ffffff;padding:24px 20px;border:1px solid #e6e8ec;border-top:none;border-radius:0 0 12px 12px;">
      <h1 style="font-size:18px;margin:0 0 12px;color:#14213D;">{{ $titre }}</h1>
      <p style="font-size:15px;line-height:1.55;margin:0 0 18px;white-space:pre-line;">{{ $corps }}</p>

      @if(!empty($url))
        <p style="margin:0 0 8px;">
          <a href="{{ $url }}" style="display:inline-block;background:#C0392B;color:#fff;text-decoration:none;
             padding:11px 20px;border-radius:8px;font-weight:700;font-size:14px;">Ouvrir la plateforme</a>
        </p>
      @endif

      <p style="font-size:12px;color:#8a8f98;margin-top:22px;line-height:1.5;">
        Vous recevez cet e-mail car vous êtes inscrit sur AFI-DOCS. Retrouvez toutes vos notifications
        dans l'application mobile ou sur la plateforme web.
      </p>
    </div>
  </div>
</body>
</html>
