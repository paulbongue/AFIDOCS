<?php

namespace Database\Seeders;

use App\Models\Commentaire;
use App\Models\Filiere;
use App\Models\Matiere;
use App\Models\Niveau;
use App\Models\Ressource;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class DatabaseSeeder extends Seeder
{
    /**
     * Donnees de demonstration : 12 filieres AFI, hierarchie pedagogique,
     * comptes (admin / delegues / etudiants) et ressources d'exemple.
     *
     * Mot de passe commun a tous les comptes de demo : "password"
     */
    public function run(): void
    {
        // --- 12 filieres AFI-L'UE avec code couleur (badge visuel app) -------
        $filieres = [
            ['code' => 'MAI',  'nom' => 'Management des Affaires Internationales',          'couleur' => '#4F46E5'],
            ['code' => 'BAF',  'nom' => 'Banque Assurance Finance',                         'couleur' => '#7C3AED'],
            ['code' => 'GSE',  'nom' => 'Gestion et Strategie des Entreprises',             'couleur' => '#16A34A'],
            ['code' => 'TL',   'nom' => 'Transport Logistique',                             'couleur' => '#0D9488'],
            ['code' => 'MMC',  'nom' => 'Marketing Management et Communication Digitale',   'couleur' => '#DB2777'],
            ['code' => 'QHSE', 'nom' => 'Qualite Hygiene Securite et Environnement',        'couleur' => '#CA8A04'],
            ['code' => 'GRH',  'nom' => 'Gestion des Ressources Humaines',                  'couleur' => '#2563EB'],
            ['code' => 'DWMD', 'nom' => 'Developpement Web et Marketing Digital',           'couleur' => '#0EA5E9'],
            ['code' => 'GL',   'nom' => 'Genie Logiciel',                                   'couleur' => '#0891B2'],
            ['code' => 'SRT',  'nom' => 'Systeme Reseau Telecom',                           'couleur' => '#EA580C'],
            ['code' => 'MJF',  'nom' => 'Management Juridique et Fiscal',                   'couleur' => '#DC2626'],
            ['code' => 'LEA',  'nom' => 'Langues Etrangeres Appliquees a la Gestion',       'couleur' => '#65A30D'],
        ];

        // Matieres types par filiere (modifiables ensuite par l'Admin).
        $matieresParFiliere = [
            'MAI'  => ['Commerce international', 'Negociation interculturelle', 'Logistique internationale'],
            'BAF'  => ['Comptabilite generale', 'Analyse financiere', 'Droit bancaire'],
            'GSE'  => ['Management des organisations', 'Controle de gestion', 'Strategie d\'entreprise'],
            'TL'   => ['Gestion des transports', 'Chaine logistique', 'Douane et reglementation'],
            'MMC'  => ['Marketing digital', 'Communication d\'entreprise', 'Etudes de marche'],
            'QHSE' => ['Management de la qualite', 'Securite au travail', 'Droit de l\'environnement'],
            'GRH'  => ['Droit du travail', 'Gestion de la paie', 'Recrutement'],
            'DWMD' => ['Developpement web', 'Marketing digital', 'UX/UI design'],
            'GL'   => ['Programmation orientee objet', 'Genie logiciel', 'Bases de donnees'],
            'SRT'  => ['Administration reseaux', 'Telecoms et telephonie', 'Securite des systemes'],
            'MJF'  => ['Droit fiscal', 'Droit des societes', 'Fiscalite des entreprises'],
            'LEA'  => ['Anglais des affaires', 'Espagnol commercial', 'Traduction professionnelle'],
        ];

        $niveaux = ['L3', 'M1', 'M2'];
        $filiereModels = [];
        $niveauM1 = []; // classe de reference pour le delegue de chaque filiere
        $allNiveaux = []; // toutes les classes (niveau + filiere) pour peupler les eleves

        foreach ($filieres as $f) {
            $filiere = Filiere::create($f);
            $filiereModels[$f['code']] = $filiere;

            foreach ($niveaux as $nomNiveau) {
                $niveau = Niveau::create([
                    'nom' => $nomNiveau,
                    'filiere_id' => $filiere->id,
                ]);

                if ($nomNiveau === 'M1') {
                    $niveauM1[$f['code']] = $niveau->id;
                }

                $allNiveaux[] = ['niveau' => $niveau, 'filiere' => $filiere, 'code' => $f['code']];

                foreach ($matieresParFiliere[$f['code']] as $nomMatiere) {
                    Matiere::create([
                        'nom' => $nomMatiere,
                        'niveau_id' => $niveau->id,
                    ]);
                }
            }
        }

        // --- Noms fictifs realistes -----------------------------------------
        $prenoms = ['Awa', 'Fatou', 'Aminata', 'Mariama', 'Aissatou', 'Khady', 'Ndeye', 'Astou',
            'Coumba', 'Bineta', 'Rama', 'Sokhna', 'Mame', 'Adja', 'Oumou', 'Dieynaba',
            'Moussa', 'Ibrahima', 'Cheikh', 'Modou', 'Ousmane', 'Abdoulaye', 'Mamadou', 'Babacar',
            'Pape', 'Alioune', 'Serigne', 'Lamine', 'Souleymane', 'Idrissa', 'Assane', 'Daouda',
            'Malick', 'Saliou', 'Boubacar', 'Demba', 'Samba', 'Thierno', 'Khadim', 'Ismaila'];
        $noms = ['Diop', 'Ndiaye', 'Fall', 'Sow', 'Ba', 'Diallo', 'Gueye', 'Sarr', 'Faye', 'Sy',
            'Mbaye', 'Cisse', 'Diouf', 'Sene', 'Kane', 'Camara', 'Toure', 'Dieng', 'Niang', 'Thiam',
            'Wade', 'Seck', 'Gaye', 'Lo', 'Diagne', 'Mendy', 'Coly', 'Badji', 'Sane', 'Goudiaby',
            'Ndour', 'Samb', 'Fofana', 'Drame', 'Konate', 'Tine', 'Boye', 'Mbengue', 'Dione', 'Top'];
        $np = count($prenoms);
        $nn = count($noms);
        $nameIdx = 0;
        // Genere des noms varies : prenom parcourt la liste, le nom avance par
        // pas de 13 (=> 10 noms distincts par classe) avec un decalage par bloc
        // pour que deux classes n'aient pas le meme effectif.
        $nextName = function () use (&$nameIdx, $prenoms, $noms, $np, $nn) {
            $prenom = $prenoms[$nameIdx % $np];
            $nom = $noms[($nameIdx * 13 + intdiv($nameIdx, $np)) % $nn];
            $nameIdx++;
            return $prenom.' '.$nom;
        };

        // --- Comptes utilisateurs -------------------------------------------
        $admin = User::create([
            'name' => 'Ousmane Faye',
            'email' => 'admin@afi.sn',
            'password' => Hash::make('password'),
            'role' => User::ROLE_ADMIN,
            'filiere_id' => null,
        ]);

        // Un delegue par filiere (rattache a sa filiere).
        $delegues = [];
        foreach ($filiereModels as $code => $filiere) {
            $delegues[$code] = User::create([
                'name' => $nextName(),
                'email' => 'delegue.'.strtolower($code).'@afi.sn',
                'password' => Hash::make('password'),
                'role' => User::ROLE_DELEGUE,
                'filiere_id' => $filiere->id,
                'niveau_id' => $niveauM1[$code], // delegue de la classe M1
            ]);
        }

        // 10 eleves par classe (= par niveau d'une filiere), pour pouvoir
        // designer un delegue parmi eux dans le centre de controle.
        // Mot de passe identique pour tous : on le hash UNE fois (perf).
        $pwd = Hash::make('password');
        $etudiants = [];

        foreach ($allNiveaux as $classe) {
            /** @var \App\Models\Niveau $niveau */
            $niveau = $classe['niveau'];
            $filiere = $classe['filiere'];
            $code = $classe['code'];
            $slug = strtolower($code).'.'.strtolower($niveau->nom);

            for ($i = 1; $i <= 10; $i++) {
                // Emails de demo reconnaissables pour la classe M1 de SRT/GL/BAF.
                $email = "etudiant.{$slug}.{$i}@afi.sn";
                if ($i === 1 && $niveau->nom === 'M1' && in_array($code, ['SRT', 'GL', 'BAF'], true)) {
                    $email = 'etudiant.'.strtolower($code).'@afi.sn';
                }

                $eleve = User::create([
                    'name' => $nextName(),
                    'email' => $email,
                    'password' => $pwd,
                    'role' => User::ROLE_ETUDIANT,
                    'filiere_id' => $filiere->id,
                    'niveau_id' => $niveau->id, // l'eleve appartient a sa classe
                ]);

                if ($i === 1) {
                    $etudiants[] = $eleve; // un eleve de reference par classe (commentaires)
                }
            }
        }

        // --- Ressources de demonstration ------------------------------------
        // On genere un petit fichier placeholder reel pour chaque ressource,
        // afin que le telechargement fonctionne immediatement.
        Storage::disk('public')->makeDirectory('ressources');

        $demoRessources = [
            ['BAF', 'Cours - Comptabilite generale (chap. 1-3)', 'Support de cours introductif a la comptabilite.'],
            ['SRT', 'TP - Configuration d\'un routeur Cisco',     'Travaux pratiques pas a pas sur la configuration reseau.'],
            ['GL',  'Cours - Programmation orientee objet en Java', 'Concepts POO : classes, heritage, polymorphisme.'],
            ['GL',  'Sujet d\'examen - Bases de donnees 2024',     'Annale corrigee de l\'examen de bases de donnees.'],
            ['GRH', 'Fiche - Le contrat de travail',               'Synthese sur les types de contrats et le droit du travail.'],
            ['MMC', 'Slides - Introduction au marketing digital',  'Presentation sur les fondamentaux du marketing en ligne.'],
            ['MJF', 'Cours - Droit fiscal des entreprises',        'Notions de base de la fiscalite des societes.'],
            ['MAI', 'Etude de cas - Commerce international',        'Cas pratique d\'import-export.'],
        ];

        foreach ($demoRessources as $i => [$code, $titre, $description]) {
            $filiere = $filiereModels[$code];
            // premiere matiere du niveau M1 de la filiere
            $matiere = Matiere::whereHas('niveau', fn ($q) => $q->where('filiere_id', $filiere->id)->where('nom', 'M1'))
                ->first();

            $nomFichier = 'ressources/demo_'.($i + 1).'_'.strtolower($code).'.txt';
            Storage::disk('public')->put(
                $nomFichier,
                "RESSOURCE DE DEMONSTRATION\n\nFiliere : {$filiere->nom} ({$code})\nTitre : {$titre}\n\n".
                "Ceci est un fichier placeholder genere par le seeder.\n".
                "Remplacez-le par un vrai document (PDF, DOCX, PPTX...) en republiant via l'app.\n"
            );

            $ressource = Ressource::create([
                'titre' => $titre,
                'description' => $description,
                'type_fichier' => 'autre',
                'chemin_fichier' => $nomFichier,
                'taille_fichier' => Storage::disk('public')->size($nomFichier),
                'matiere_id' => $matiere->id,
                'user_id' => $delegues[$code]->id,
            ]);

            // Quelques commentaires inter-filieres.
            if ($i % 2 === 0) {
                Commentaire::create([
                    'contenu' => 'Merci pour le partage, tres utile !',
                    'ressource_id' => $ressource->id,
                    'user_id' => $etudiants[0]->id,
                ]);
            }
        }
    }
}
