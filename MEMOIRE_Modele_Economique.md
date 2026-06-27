# CHAPITRE — MODÈLE ÉCONOMIQUE ET STRATÉGIE DE VALORISATION

> *Chapitre additionnel rattaché à la Deuxième Partie (Cadre analytique), section « Recommandations et perspectives ». Conforme au canevas : il prolonge les implications managériales par une analyse de viabilité économique et de valorisation de la solution.*

## Introduction du chapitre

La pertinence d'une solution numérique ne se mesure pas uniquement à sa qualité technique ou à son adoption, mais aussi à sa **soutenabilité économique**. Ce chapitre examine la viabilité financière de la plateforme AFI au-delà du cadre académique : structure de coûts réelle, taille et dynamique du marché de l'EdTech africaine, modèles de revenus envisageables, projections financières et, enfin, stratégie de valorisation dans l'hypothèse d'une cession (revente) de la solution. L'objectif est de démontrer que le projet, conçu d'abord pour répondre à un besoin interne, possède un potentiel de **passage à l'échelle** et de **commercialisation** auprès d'autres établissements d'enseignement.

## Section 1 : Structure de coûts du projet

La solution a été conçue selon une logique de **maîtrise des coûts**, condition essentielle d'un déploiement dans le contexte d'un établissement privé africain. On distingue les coûts de développement (non récurrents) et les coûts d'exploitation (récurrents).

**Coûts de développement (CAPEX).** Le développement a été réalisé en interne, par un développeur unique, à l'aide d'un écosystème **entièrement open source et gratuit** : Laravel 11, React, MySQL, React Native/Expo. Le coût monétaire direct de développement est donc nul ; le coût réel correspond au temps-homme investi (environ six sprints hebdomadaires, soit ~240 à 300 heures).

**Coûts d'exploitation (OPEX).** Le tableau ci-dessous présente les coûts récurrents réels de la mise en production retenue (serveur privé virtuel OVH regroupant le backend, le frontend, la base de données et le stockage des fichiers).

| Poste | Solution retenue | Coût indicatif (FCFA/an) | Coût indicatif (€/an) |
|---|---|---|---|
| Serveur (VPS OVH, backend + web + MySQL + fichiers) | VPS mutualisé | ~ 45 000 – 90 000 | ~ 70 – 140 |
| Nom de domaine | DuckDNS (gratuit) / domaine .sn ou .com | 0 – 10 000 | 0 – 15 |
| Certificat HTTPS | Let's Encrypt (gratuit) | 0 | 0 |
| Notifications push | Expo + Firebase FCM (offre gratuite) | 0 | 0 |
| Sauvegardes | Snapshots VPS | inclus / ~ 12 000 | ~ 20 |
| **Total OPEX annuel** | | **~ 45 000 – 110 000 FCFA** | **~ 70 – 175 €** |

*Tableau : Coûts d'exploitation annuels réels de la plateforme AFI. Source : auteur, 2026 (tarifs OVH/DuckDNS constatés).*

Ce niveau de coût — inférieur à **150 € par an** pour une institution entière — constitue un argument économique décisif : il rend la solution accessible même à de petits établissements, et dégage une marge brute très élevée dans une logique de commercialisation.

## Section 2 : Le marché de l'EdTech en Afrique

La solution s'inscrit dans un marché en forte croissance. Selon l'**UNESCO (2023)**, dans son *Rapport mondial de suivi sur l'éducation — La technologie dans l'éducation*, le numérique éducatif est désormais un levier reconnu d'accès au savoir, à condition d'être au service de la pédagogie. Cette dynamique s'appuie sur la pénétration mobile : la **GSMA (2023)** recense **527 millions d'abonnés mobiles uniques** en Afrique subsaharienne (44 % de la population), un chiffre attendu à **751 millions à l'horizon 2030**.

Sur le plan strictement marchand, le marché africain de l'**e-learning** est estimé à **3,4 milliards de dollars US en 2024**, avec une projection à **7,7 milliards en 2033** (taux de croissance annuel composé d'environ 9 %) selon les données d'IMARC Group (2024). À l'échelle Moyen-Orient–Afrique, le marché des **technologies éducatives** pourrait atteindre près de **33 milliards de dollars US en 2030** (TCAC de 14,6 %) d'après Grand View Research (2025). Le segment du **logiciel de gestion des ressources et des apprentissages** y occupe une place centrale.

Le contexte sénégalais confirme cette trajectoire : la création de l'**Université Virtuelle du Sénégal** en 2013 — devenue **Université numérique Cheikh Hamidou Kane** en 2023 — a démontré la viabilité d'un enseignement numérique adapté au contexte local, passant de quelques milliers à plusieurs dizaines de milliers d'étudiants. Le **marché adressable** pour une solution comme la plateforme AFI se compose en premier lieu des établissements d'enseignement supérieur privés (écoles de commerce, d'informatique, instituts professionnels) du Sénégal et de la sous-région, dont les besoins en diffusion structurée de ressources sont identiques à ceux diagnostiqués à l'AFI.

## Section 3 : Modèles de revenus envisageables

Plusieurs modèles de monétisation, non exclusifs, peuvent être combinés.

1. **Licence institutionnelle (B2B SaaS) — modèle principal.** La plateforme est proposée en abonnement annuel à chaque établissement, facturé par établissement ou par tranche d'étudiants (ex. 150 000 – 600 000 FCFA/an selon la taille). Le coût d'exploitation marginal par client étant très faible, ce modèle dégage une marge brute élevée.
2. **Freemium.** Une version gratuite limitée (un nombre réduit de filières, stockage plafonné) permet l'acquisition, les fonctionnalités avancées (statistiques, espace illimité, notifications push, application mobile dédiée) étant payantes.
3. **White-label / revente sous marque.** La solution est cédée et personnalisée aux couleurs de l'établissement (logo, nom, charte), facturée en frais d'installation + maintenance annuelle.
4. **Services associés.** Hébergement géré, formation des administrateurs et délégués, développement de modules sur mesure (intégration emploi du temps, espace alumni).

## Section 4 : Projections et scénarios

En retenant le modèle de licence institutionnelle comme socle, trois scénarios prudents peuvent être esquissés sur trois ans, sur la base d'un prix moyen de **300 000 FCFA/an par établissement** et d'un coût d'exploitation marginal quasi nul.

| Scénario | Établissements clients (an 3) | Revenu annuel récurrent (an 3) | Marge brute estimée |
|---|---|---|---|
| Prudent | 5 | ~ 1 500 000 FCFA | > 90 % |
| Médian | 15 | ~ 4 500 000 FCFA | > 90 % |
| Ambitieux | 40 | ~ 12 000 000 FCFA | > 90 % |

*Tableau : Scénarios de revenus récurrents à trois ans (modèle licence institutionnelle). Source : auteur, 2026.*

La marge brute très élevée s'explique par la nature logicielle du produit : une fois développé, le coût de servir un client supplémentaire se limite à une fraction des ressources serveur. C'est précisément cette **économie d'échelle** qui fait la valeur des modèles SaaS.

## Section 5 : Stratégie de valorisation et hypothèse de revente

Dans l'hypothèse d'une cession, la valorisation d'une solution SaaS repose principalement sur son **revenu annuel récurrent (ARR)** et sur sa capacité de croissance, et non sur ses seuls actifs. Le marché valorise généralement les jeunes éditeurs SaaS à un **multiple de leur ARR** (souvent compris entre 2× et 5× pour une solution early-stage, davantage en cas de forte croissance et de faible taux d'attrition).

Sur cette base, le scénario médian (ARR ≈ 4,5 M FCFA) suggérerait une valorisation indicative de l'ordre de **9 à 22 millions de FCFA**, hors actifs incorporels (base de code, marque, base installée). Plusieurs leviers augmentent cette valeur : un faible taux d'attrition (les établissements changent rarement d'outil en cours d'année), des coûts d'exploitation maîtrisés, une base de code propre et documentée, et une marque déposée. À l'inverse, la dépendance à un développeur unique et l'absence de contrats pluriannuels signés constituent des facteurs de décote qu'une cession devrait anticiper (documentation, transfert de compétences, contractualisation préalable).

Au-delà de la revente pure, d'autres voies de valorisation existent : l'**intégration** de la solution à une offre plus large (suite de gestion d'établissement), le **partenariat** avec un acteur EdTech régional, ou la **licence d'exploitation** concédée à un éditeur disposant déjà d'un réseau commercial.

## Conclusion du chapitre

Ce chapitre a démontré que la plateforme AFI, conçue pour résoudre un problème interne, repose sur une **structure de coûts extrêmement légère** (moins de 150 € d'exploitation annuelle) et s'inscrit dans un **marché EdTech africain en croissance soutenue**. Les modèles de revenus envisageables — licence institutionnelle, freemium, white-label, services — sont compatibles avec une marge brute élevée caractéristique des logiciels en mode SaaS. Enfin, l'analyse de valorisation montre qu'une cession éventuelle dépendrait avant tout du revenu récurrent et de la solidité contractuelle de la base installée. La solution dépasse ainsi son cadre académique initial pour constituer un **actif numérique valorisable**, à condition d'être accompagnée d'un travail de contractualisation, de documentation et de réduction de la dépendance au développeur fondateur.

---

### Références mobilisées dans ce chapitre (APA)

- Grand View Research. (2025). *Middle East & Africa education technology market size & outlook, 2025–2030*. https://www.grandviewresearch.com/horizon/outlook/education-technology-market/mea
- GSMA. (2023). *The mobile economy Sub-Saharan Africa 2023*. GSMA Intelligence. https://www.gsma.com/solutions-and-impact/connectivity-for-good/mobile-economy/
- IMARC Group. (2024). *Africa e-learning market size, share and forecast 2025–2033*. https://www.imarcgroup.com/africa-e-learning-market
- UNESCO. (2023). *Global education monitoring report 2023: Technology in education — A tool on whose terms?* https://www.unesco.org/gem-report/en/technology
