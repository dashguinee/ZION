# Bilan comptable des campagnes agricoles 2024 et 2025

**Domaine de 60 hectares — Sous-préfecture de Guéasso, Préfecture de Lola, Région de N'Zérékoré (Guinée forestière)**

Exploitant : **KASI GROUP SARL** — RCCM `GN.TCC.2025.B.16465` — NIF `642333652`

---

## ⚠️ Nature du document

KASI GROUP SARL est immatriculée depuis le **19 novembre 2025**. Elle ne peut donc pas produire
d'états financiers historiques certifiés au titre de 2024, ni un exercice social complet 2025.

Les documents produits ici sont des **comptes d'exploitation et bilans reconstitués sur hypothèses
technico-économiques explicites**. Ils ne sont **ni audités, ni certifiés, ni opposables à
l'administration fiscale**. Cadre juridique retenu :

| Campagne | Cadre |
|---|---|
| 2024 | Exploitation en nom propre des promoteurs (entreprise individuelle agricole) |
| 2025 | Exploitation apportée à KASI GROUP SARL ; capitaux 2024 reclassés en comptes courants d'associés |

Usage prévu : dossier de financement, demande de crédit agricole, plan d'affaires. L'avertissement
doit être conservé dans toute production devant un tiers.

---

## Résultats de synthèse

| Indicateur | Campagne 2024 | Campagne 2025 | Progression |
|---|---:|---:|---:|
| Superficie emblavée | 55 ha | 58 ha | +5,5 % |
| Production nette | 242,33 t | 325,75 t | +34,4 % |
| Produits d'exploitation | 833 808 650 GNF | 1 443 071 456 GNF | +73,1 % |
| Valeur ajoutée | 417 131 350 GNF | 894 311 456 GNF | ×2,14 |
| Excédent brut d'exploitation | 137 883 350 GNF | 461 223 456 GNF | ×3,35 |
| **Résultat net** | **49 256 262 GNF** | **182 951 923 GNF** | **×3,71** |
| Marge nette | 5,9 % | 12,7 % | +6,8 pts |
| Capacité d'autofinancement | 92 297 929 GNF | 317 494 482 GNF | ×3,44 |
| Trésorerie à la clôture | 96 716 683 GNF | 107 776 385 GNF | +11,4 % |
| Total du bilan | 647 675 017 GNF | 1 377 192 159 GNF | ×2,13 |
| Seuil de rentabilité | 82,2 % des produits | 71,8 % des produits | −10,4 pts |

**Les deux campagnes sont bénéficiaires** et les deux bilans sont équilibrés à l'unité près.

### D'où vient la progression

La surface ne change pas (60 ha). Trois leviers expliquent l'écart :

1. **Rendements** — semences certifiées R1, fumure raisonnée sur analyse de sol, désherbage précoce
   (riz pluvial 2,60 → 3,30 t/ha ; maïs 2,90 → 3,70 ; manioc 13,5 → 17,0 ; arachide 1,35 → 1,70).
2. **Bas-fond** — 4 ha aménagés à maîtrise d'eau, rendement de 4,50 t/ha.
3. **Transformation internalisée** — part du paddy usiné 55 % → 85 %, part du manioc en gari 25 % → 45 %.
   La marge d'usinage payée à des tiers en 2024 reste dans l'exploitation en 2025, qui facture même
   42 000 000 GNF de travail à façon aux producteurs voisins.

Les pertes post-récolte passent de 10 % à 5 % grâce au hangar ventilé et à l'aire de séchage bétonnée.

---

## Fichiers

| Fichier | Contenu |
|---|---|
| `Bilan_Comptable_Agricole_Gueasso_2024_2025.xlsx` | Classeur de calcul complet, 10 onglets, entièrement paramétrable |
| `Rapport_Bilan_Agricole_Gueasso_2024_2025.docx` | Rapport rédigé, 7 chapitres, 13 pages, prêt à imprimer |
| `Rapport_Bilan_Agricole_Gueasso_2024_2025.pdf` | Le même rapport en PDF, pour diffusion |
| `generer_bilan.py` | Générateur du classeur Excel (openpyxl) |
| `generer_rapport.cjs` | Générateur du rapport Word (docx-js) |
| `modele_reference.py` | Recalcul indépendant en Python pur — contrôle croisé des formules Excel |
| `injecter_valeurs.py` | Met en cache les valeurs calculées dans le `.xlsx` (utile si LibreOffice Calc est absent) |
| `chiffres.json` | Chiffres produits par le modèle, consommés par le rapport Word |

### Onglets du classeur

`Notice` · `Hypotheses` · `Production` · `Immobilisations` · `Charges` ·
`Compte de resultat` · `Flux & Financement` · `Bilan` · `SIG & Ratios` · `Comparatif`

Code couleur : **bleu** = donnée d'entrée modifiable · **noir** = formule · **vert** = lien
inter-onglets · **fond jaune** = hypothèse clé.

Toutes les hypothèses (assolement, rendements, prix, taux de transformation, coûts unitaires,
paramètres financiers) sont regroupées dans l'onglet `Hypotheses`. Modifier une cellule bleue
recalcule l'ensemble des états, y compris le bilan et le contrôle d'équilibre.

---

## Reproduire les calculs

```bash
pip  install openpyxl                        # dépendance du générateur Excel
npm  install docx                            # dépendance du générateur Word
python3 generer_bilan.py                     # produit le classeur .xlsx
python3 modele_reference.py                  # affiche le contrôle croisé et régénère chiffres.json
node    generer_rapport.cjs                  # produit le rapport .docx
```

Le paquet `docx` n'est pas déclaré dans le `package.json` du dépôt : il n'est utile qu'à la
régénération du rapport, pas à l'application ZION.

### Vérifications effectuées

| Contrôle | Résultat |
|---|---|
| Formules du classeur évaluées | 568 formules, **0 erreur** |
| Écart actif − passif | **0 GNF** sur les deux campagnes |
| Classeur Excel vs modèle Python indépendant | **0 écart** sur 18 agrégats de contrôle |
| Décomposition de l'amélioration du résultat | cohérente avec l'écart des résultats nets |

Le classeur a été recalculé par LibreOffice Calc et croisé avec `modele_reference.py`, qui
recalcule le même modèle sans passer par Excel. Pour rejouer la vérification :

```bash
python3 /root/.claude/skills/synced/xlsx/scripts/recalc.py \
        Bilan_Comptable_Agricole_Gueasso_2024_2025.xlsx 450
```

---

## Points de vigilance

- **Prix** — le paddy et le manioc frais sont volatils. Une baisse de 15 % du prix du riz blanc
  coûterait environ 61 M GNF de résultat net en 2025.
- **Climat** — irrégularité pluviométrique sur le riz pluvial ; une assurance récolte indicielle est
  budgétée en 2025, sa disponibilité effective reste à confirmer.
- **Logistique** — l'état des pistes Guéasso / Lola / N'Zérékoré conditionne le coût d'évacuation et
  le prix bord champ.
- **Main-d'œuvre** — 2 800 h-j en 2024 et 3 200 h-j en 2025, concentrés sur les pics de travaux.
- **Mécanique** — la rentabilité 2025 suppose le fonctionnement continu du tracteur et de l'unité
  post-récolte : contrat de maintenance et stock de pièces critiques nécessaires.
- **Fiscalité** — taux de 25 % de droit commun retenu ; l'éligibilité à un régime agricole
  dérogatoire est à vérifier auprès de la DGI.
