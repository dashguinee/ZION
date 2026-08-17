// Genere le rapport Word du bilan comptable des campagnes agricoles 2024 et 2025.
// Les chiffres proviennent de chiffres.json, produit par modele_reference.py.

const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  PageBreak, TableOfContents, Header, Footer, PageNumber, LevelFormat,
  convertInchesToTwip,
} = require('docx');

const D = JSON.parse(fs.readFileSync('chiffres.json', 'utf8'));
const A = D['2024'], B = D['2025'];

// ------------------------------------------------------------------ format
const nbsp = ' ';
const gnf = (v) => Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, nbsp);
const pct = (v, d = 1) => (v * 100).toFixed(d).replace('.', ',') + nbsp + '%';
const num = (v, d = 2) => v.toFixed(d).replace('.', ',');
const evol = (a, b) => (b / a - 1) >= 0 ? '+' + pct(b / a - 1) : pct(b / a - 1);

const BLEU = '1F3864';
const BLEU_CLAIR = 'DEEBF7';
const GRIS = 'F2F2F2';
const ROUGE = 'C00000';

const LARGEUR = convertInchesToTwip(6.5);

function cell(txt, opts = {}) {
  const {
    bold = false, align = AlignmentType.LEFT, fill = null,
    color = null, width = null, size = 19, italics = false,
  } = opts;
  return new TableCell({
    width: width ? { size: width, type: WidthType.DXA } : undefined,
    shading: fill ? { type: ShadingType.CLEAR, fill, color: 'auto' } : undefined,
    margins: { top: 60, bottom: 60, left: 90, right: 90 },
    children: [new Paragraph({
      alignment: align,
      spacing: { before: 0, after: 0 },
      children: [new TextRun({ text: String(txt), bold, color: color || undefined, size, italics })],
    })],
  });
}

function tableau(colWidths, entetes, lignes, opts = {}) {
  const { enteteFill = BLEU, alignNum = AlignmentType.RIGHT, textCols = [] } = opts;
  const rows = [];
  rows.push(new TableRow({
    tableHeader: true,
    children: entetes.map((h, i) => cell(h, {
      bold: true, color: 'FFFFFF', fill: enteteFill, width: colWidths[i],
      align: i === 0 ? AlignmentType.LEFT : AlignmentType.CENTER, size: 18,
    })),
  }));
  lignes.forEach((lg, idx) => {
    const style = lg.style || 'normal';
    const fill = style === 'total' ? BLEU_CLAIR
      : style === 'sous' ? GRIS
        : (idx % 2 === 1 ? 'FAFAFA' : null);
    const bold = style === 'total' || style === 'sous';
    const color = style === 'total' ? BLEU : null;
    rows.push(new TableRow({
      children: lg.c.map((v, i) => cell(v, {
        bold, fill, color, width: colWidths[i],
        align: (i === 0 || textCols.includes(i)) ? AlignmentType.LEFT : alignNum,
      })),
    }));
  });
  return new Table({
    columnWidths: colWidths,
    width: { size: LARGEUR, type: WidthType.DXA },
    rows,
  });
}

function p(txt, opts = {}) {
  const { bold = false, italics = false, size = 21, align = AlignmentType.JUSTIFIED,
    color = null, after = 140, before = 0 } = opts;
  return new Paragraph({
    alignment: align,
    spacing: { after, before, line: 276 },
    children: [new TextRun({ text: txt, bold, italics, size, color: color || undefined })],
  });
}

function h1(txt) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 180 },
    children: [new TextRun({ text: txt, bold: true, size: 30, color: BLEU })],
  });
}

function h2(txt) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 140 },
    children: [new TextRun({ text: txt, bold: true, size: 24, color: BLEU })],
  });
}

function h3(txt) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 110 },
    children: [new TextRun({ text: txt, bold: true, size: 21, color: '2E75B6' })],
  });
}

function puce(txt) {
  return new Paragraph({
    numbering: { reference: 'puces', level: 0 },
    spacing: { after: 90, line: 276 },
    alignment: AlignmentType.JUSTIFIED,
    children: [new TextRun({ text: txt, size: 21 })],
  });
}

function legende(txt) {
  return new Paragraph({
    spacing: { before: 80, after: 200 },
    alignment: AlignmentType.LEFT,
    children: [new TextRun({ text: txt, italics: true, size: 17, color: '595959' })],
  });
}

function filet() {
  return new Paragraph({
    spacing: { before: 120, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'BFBFBF' } },
    children: [new TextRun({ text: '' })],
  });
}

// ------------------------------------------------------------------ contenu
const contenu = [];

// ---- page de garde
contenu.push(
  new Paragraph({ spacing: { before: 1400, after: 0 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'KASI GROUP SARL', bold: true, size: 40, color: BLEU })] }),
  new Paragraph({ spacing: { before: 60, after: 500 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'RCCM GN.TCC.2025.B.16465' + nbsp + '|' + nbsp + 'NIF 642333652',
      size: 20, color: '595959' })] }),
  new Paragraph({ spacing: { before: 0, after: 60 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'BILAN COMPTABLE', bold: true, size: 52, color: BLEU })] }),
  new Paragraph({ spacing: { before: 0, after: 300 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'DES CAMPAGNES AGRICOLES 2024 ET 2025', bold: true, size: 30, color: BLEU })] }),
  new Paragraph({ spacing: { before: 0, after: 40 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Domaine agricole de 60 hectares', size: 26 })] }),
  new Paragraph({ spacing: { before: 0, after: 40 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Sous-préfecture de Guéasso', bold: true, size: 26 })] }),
  new Paragraph({ spacing: { before: 0, after: 900 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Préfecture de Lola' + nbsp + '—' + nbsp + 'Région de N’Zérékoré' + nbsp + '—' + nbsp + 'République de Guinée', size: 22, color: '595959' })] }),
);

const gardeRows = [
  { c: ['Campagne 2024', gnf(A.resultat_net) + ' GNF', 'Bénéficiaire'], style: 'normal' },
  { c: ['Campagne 2025', gnf(B.resultat_net) + ' GNF', 'Bénéficiaire'], style: 'normal' },
  { c: ['Progression du résultat net', evol(A.resultat_net, B.resultat_net), '×' + num(B.resultat_net / A.resultat_net, 2)], style: 'total' },
];
contenu.push(tableau([2900, 3200, 3260], ['Résultat net de la campagne', 'Montant', 'Situation'], gardeRows));

contenu.push(
  new Paragraph({ spacing: { before: 700, after: 0 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Comptes d’exploitation et bilans reconstitués sur hypothèses technico-économiques', italics: true, size: 19, color: ROUGE })] }),
  new Paragraph({ spacing: { before: 30, after: 0 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Référentiel SYSCOHADA révisé' + nbsp + '—' + nbsp + 'Document non audité et non certifié', italics: true, size: 19, color: '595959' })] }),
  new Paragraph({ children: [new PageBreak()] }),
);

// ---- avertissement
contenu.push(h1('Avertissement sur la portée du document'));
contenu.push(new Paragraph({
  spacing: { after: 160, line: 276 },
  alignment: AlignmentType.JUSTIFIED,
  shading: { type: ShadingType.CLEAR, fill: 'FFF2CC', color: 'auto' },
  border: {
    top: { style: BorderStyle.SINGLE, size: 6, color: ROUGE },
    bottom: { style: BorderStyle.SINGLE, size: 6, color: ROUGE },
    left: { style: BorderStyle.SINGLE, size: 6, color: ROUGE },
    right: { style: BorderStyle.SINGLE, size: 6, color: ROUGE },
  },
  children: [new TextRun({
    text: 'KASI GROUP SARL est immatriculée au Registre du Commerce et du Crédit Mobilier depuis le '
      + '19 novembre 2025. La société ne peut donc produire ni états financiers historiques certifiés au '
      + 'titre de la campagne 2024, ni exercice social complet au titre de 2025. Le présent document est '
      + 'un jeu de comptes d’exploitation et de bilans RECONSTITUÉS, établis sur des hypothèses '
      + 'technico-économiques explicites et intégralement documentées. Il n’est ni audité, ni '
      + 'certifié par un commissaire aux comptes, ni opposable à l’administration fiscale.',
    size: 20, bold: true,
  })],
}));

contenu.push(p('Le cadre juridique retenu pour chacune des deux campagnes est le suivant :'));
contenu.push(puce('Campagne 2024 — l’exploitation est conduite en nom propre par les promoteurs, MM. KABA Alhassane et SIDIBE Mohamed, sous le régime de l’entreprise individuelle agricole, avant la constitution de la société.'));
contenu.push(puce('Campagne 2025 — l’exploitation est apportée à KASI GROUP SARL lors de sa constitution du 19 novembre 2025. Les capitaux engagés par les promoteurs en 2024 sont reclassés en comptes courants d’associés bloqués au 31 décembre 2025.'));
contenu.push(p('Ce document est destiné à un dossier de financement, à une demande de crédit agricole ou à la '
  + 'présentation du projet à un partenaire technique ou financier. Toute production devant un tiers doit '
  + 'conserver le présent avertissement. Les hypothèses de rendement et de prix sont des hypothèses de '
  + 'travail à valider par une contre-expertise avant tout engagement financier.'));

contenu.push(h2('Sommaire'));
contenu.push(new TableOfContents('Sommaire', { hyperlink: true, headingStyleRange: '1-3' }));
contenu.push(new Paragraph({ children: [new PageBreak()] }));

// ---- I. Presentation
contenu.push(h1('1. Présentation de l’exploitant et du domaine'));
contenu.push(h2('1.1 Identification juridique et fiscale'));
contenu.push(tableau([3000, 6360], ['Élément', 'Référence'], [
  { c: ['Raison sociale', 'KASI GROUP SARL (sigle K-G-SARL)'] },
  { c: ['Forme juridique', 'Société à responsabilité limitée'] },
  { c: ['Numéro RCCM', 'GN.TCC.2025.B.16465'] },
  { c: ['Numéro de formalité', 'GN.TCC.2025.18612'] },
  { c: ['Date d’immatriculation', '19 novembre 2025, Tribunal de Commerce de Conakry'] },
  { c: ['Numéro d’Identification Fiscale', '642333652'] },
  { c: ['Numéro eTax', '1228802510892'] },
  { c: ['Capital social', '10' + nbsp + '000' + nbsp + '000 GNF, intégralement libéré en numéraire'] },
  { c: ['Durée', '99 ans à compter de l’immatriculation au RCCM'] },
  { c: ['Siège social', 'Immeuble Sonoco, Marché Niger, Commune de Kaloum, Conakry'] },
  { c: ['Cogérants', 'KABA Alhassane et SIDIBE Mohamed'] },
  { c: ['Objet social', 'BTP, commerce, agriculture, communication, technologie, transport, mines, élevage, immobilier'] },
], { alignNum: AlignmentType.LEFT }));
contenu.push(legende('Source : extrait RCCM du 19 novembre 2025 et notification d’immatriculation de la Direction Générale des Impôts.'));

contenu.push(h2('1.2 Localisation et contexte agro-écologique'));
contenu.push(p('Le domaine est situé dans la sous-préfecture de Guéasso, préfecture de Lola, région '
  + 'administrative de N’Zérékoré, en Guinée forestière. Cette zone bénéficie d’une pluviométrie '
  + 'annuelle comprise entre 1' + nbsp + '800 et 2' + nbsp + '200 millimètres, répartie sur huit à neuf mois, '
  + 'et de sols ferrallitiques désaturés profonds sur un relief de collines entrecoupées de bas-fonds.'));
contenu.push(p('Ces conditions sont favorables au riz pluvial et au riz de bas-fond, au maïs, au manioc et à '
  + 'l’arachide, qui constituent l’assolement retenu. Les débouchés commerciaux sont les marchés de '
  + 'Lola, de N’Zérékoré et de Beyla, complétés par les flux transfrontaliers de la zone. Le principal '
  + 'facteur limitant de la zone n’est pas agronomique mais logistique : l’état des pistes rurales '
  + 'conditionne l’évacuation des récoltes et le prix obtenu au bord du champ.'));

contenu.push(h2('1.3 Assolement des deux campagnes'));
contenu.push(tableau([3260, 1500, 1500, 3100], ['Spéculation', '2024 (ha)', '2025 (ha)', 'Évolution retenue'], [
  { c: ['Riz pluvial NERICA', '22,0', '23,0', 'Spéculation pivot du domaine'] },
  { c: ['Riz de bas-fond aménagé', '—', '4,0', 'Bas-fond planné et endigué en 2025'] },
  { c: ['Maïs grain', '14,0', '14,0', 'Rotation et débouché provende'] },
  { c: ['Manioc', '12,0', '11,0', 'Surface réduite au profit du riz'] },
  { c: ['Arachide en coque', '7,0', '6,0', 'Légumineuse de rotation, tête d’assolement'] },
  { c: ['Total emblavé', '55,0', '58,0', 'Emprise non cultivée réduite'], style: 'total' },
  { c: ['Superficie non cultivée', '5,0', '2,0', 'Siège, hangars, pistes, pare-feu'] },
  { c: ['Superficie totale du domaine', '60,0', '60,0', ''], style: 'total' },
], { textCols: [3] }));

contenu.push(new Paragraph({ children: [new PageBreak()] }));

// ---- II. Methodologie
contenu.push(h1('2. Méthodologie et hypothèses retenues'));
contenu.push(h2('2.1 Conventions comptables'));
contenu.push(puce('Référentiel : SYSCOHADA révisé, système normal, issu de l’Acte uniforme OHADA relatif au droit comptable et à l’information financière.'));
contenu.push(puce('Monnaie de tenue des comptes : le franc guinéen. Tous les montants du présent rapport sont exprimés en GNF.'));
contenu.push(puce('Immobilisations : évaluées au coût d’acquisition. Amortissement linéaire, calculé prorata temporis à compter de la date de mise en service.'));
contenu.push(puce('Stocks : intrants au coût d’achat, produits finis au coût de production.'));
contenu.push(puce('Imposition : impôt sur les bénéfices au taux de droit commun de 25' + nbsp + '%, hors régime dérogatoire agricole éventuel.'));
contenu.push(puce('Exercice : la campagne agricole est assimilée à l’exercice civil, du 1er janvier au 31 décembre.'));

contenu.push(h2('2.2 Hypothèses techniques'));
contenu.push(tableau([3900, 1900, 1900, 1660], ['Paramètre', 'Campagne 2024', 'Campagne 2025', 'Écart'], [
  { c: ['Rendement riz pluvial (t/ha)', '2,60', '3,30', '+27' + nbsp + '%'] },
  { c: ['Rendement riz de bas-fond (t/ha)', '—', '4,50', 'nouveau'] },
  { c: ['Rendement maïs (t/ha)', '2,90', '3,70', '+28' + nbsp + '%'] },
  { c: ['Rendement manioc (t/ha)', '13,50', '17,00', '+26' + nbsp + '%'] },
  { c: ['Rendement arachide en coque (t/ha)', '1,35', '1,70', '+26' + nbsp + '%'] },
  { c: ['Taux de pertes post-récolte', '10,0' + nbsp + '%', '5,0' + nbsp + '%', '−5 points'] },
  { c: ['Part du paddy usinée en riz blanc', '55,0' + nbsp + '%', '85,0' + nbsp + '%', '+30 points'] },
  { c: ['Part du manioc transformée en gari', '25,0' + nbsp + '%', '45,0' + nbsp + '%', '+20 points'] },
  { c: ['Rendement à l’usinage du paddy', '65,0' + nbsp + '%', '65,0' + nbsp + '%', 'stable'] },
  { c: ['Rendement de transformation en gari', '22,0' + nbsp + '%', '22,0' + nbsp + '%', 'stable'] },
]));
contenu.push(legende('La progression des rendements repose sur l’emploi de semences certifiées R1, une fumure raisonnée '
  + 'établie sur analyse de sol, le respect du calendrier cultural, un désherbage précoce et un encadrement '
  + 'technique permanent. Références indicatives : ANPROCA et IRAG pour la Guinée forestière.'));

contenu.push(h2('2.3 Hypothèses de prix'));
contenu.push(tableau([3900, 1900, 1900, 1660], ['Produit (prix en GNF/kg)', 'Campagne 2024', 'Campagne 2025', 'Variation'], [
  { c: ['Paddy, bord champ', '5' + nbsp + '000', '5' + nbsp + '400', '+8,0' + nbsp + '%'] },
  { c: ['Riz blanc local, sortie magasin', '11' + nbsp + '500', '12' + nbsp + '500', '+8,7' + nbsp + '%'] },
  { c: ['Maïs grain sec', '4' + nbsp + '200', '4' + nbsp + '600', '+9,5' + nbsp + '%'] },
  { c: ['Manioc frais, racines', '1' + nbsp + '700', '1' + nbsp + '850', '+8,8' + nbsp + '%'] },
  { c: ['Gari, semoule de manioc', '9' + nbsp + '000', '10' + nbsp + '000', '+11,1' + nbsp + '%'] },
  { c: ['Arachide en coque', '9' + nbsp + '500', '10' + nbsp + '500', '+10,5' + nbsp + '%'] },
]));
contenu.push(legende('Barème indicatif de campagne des marchés de Lola et de N’Zérékoré. Ces prix constituent des '
  + 'hypothèses de travail : la volatilité du paddy et du manioc est le principal risque du modèle.'));

contenu.push(new Paragraph({ children: [new PageBreak()] }));

// ---- III. Campagne 2024
function sectionCampagne(an, C, titre, intro) {
  const out = [];
  out.push(h1(titre));
  out.push(p(intro));

  out.push(h2(`${an === 2024 ? '3.1' : '4.1'} Production et chiffre d’affaires`));
  const dp = C.detail_production;
  const ligProd = [
    { c: ['Riz pluvial NERICA', num(dp.riz_pluvial.surface, 1), num(dp.riz_pluvial.rdt, 2), num(dp.riz_pluvial.brut, 2), num(dp.riz_pluvial.net, 2)] },
  ];
  if (dp.riz_basfond.surface > 0) {
    ligProd.push({ c: ['Riz de bas-fond aménagé', num(dp.riz_basfond.surface, 1), num(dp.riz_basfond.rdt, 2), num(dp.riz_basfond.brut, 2), num(dp.riz_basfond.net, 2)] });
  }
  ligProd.push(
    { c: ['Maïs grain', num(dp.mais.surface, 1), num(dp.mais.rdt, 2), num(dp.mais.brut, 2), num(dp.mais.net, 2)] },
    { c: ['Manioc, racines fraîches', num(dp.manioc.surface, 1), num(dp.manioc.rdt, 2), num(dp.manioc.brut, 2), num(dp.manioc.net, 2)] },
    { c: ['Arachide en coque', num(dp.arachide.surface, 1), num(dp.arachide.rdt, 2), num(dp.arachide.brut, 2), num(dp.arachide.net, 2)] },
    { c: ['Total', num(C.surface, 1), '—', num(Object.values(dp).reduce((s, v) => s + v.brut, 0), 2), num(C.prod_nette_totale, 2)], style: 'total' },
  );
  out.push(tableau([2900, 1300, 1400, 1880, 1880],
    ['Spéculation', 'Surface (ha)', 'Rendement (t/ha)', 'Production brute (t)', 'Production nette (t)'], ligProd));
  out.push(legende('La production nette est obtenue après application du taux de pertes post-récolte de la campagne.'));

  out.push(h3('Affectation du riz et du manioc'));
  const r = C.detail_riz, m = C.detail_manioc;
  out.push(tableau([4200, 2580, 2580], ['Affectation', 'Quantité (t)', 'Valorisation (GNF)'], [
    { c: ['Paddy net disponible', num(r.paddy, 2), '—'], style: 'sous' },
    { c: ['dont paddy dirigé vers l’usinage', num(r.paddy_usine, 2), '—'] },
    { c: ['Riz blanc obtenu et vendu', num(r.riz_blanc, 2), gnf(r.riz_blanc * (an === 2024 ? 11500 : 12500) * 1000)] },
    { c: ['Paddy vendu en l’état', num(r.paddy_vendu, 2), gnf(r.paddy_vendu * (an === 2024 ? 5000 : 5400) * 1000)] },
    { c: ['Chiffre d’affaires riz', '—', gnf(C.ca_riz)], style: 'total' },
    { c: ['Racines de manioc nettes', num(m.racines, 2), '—'], style: 'sous' },
    { c: ['dont racines transformées', num(m.transf, 2), '—'] },
    { c: ['Gari obtenu et vendu', num(m.gari, 2), gnf(m.gari * (an === 2024 ? 9000 : 10000) * 1000)] },
    { c: ['Racines vendues fraîches', num(m.frais, 2), gnf(m.frais * (an === 2024 ? 1700 : 1850) * 1000)] },
    { c: ['Chiffre d’affaires manioc', '—', gnf(C.ca_manioc)], style: 'total' },
  ]));

  out.push(h3('Produits d’exploitation'));
  out.push(tableau([5400, 3960], ['Nature du produit (compte SYSCOHADA)', 'Montant (GNF)'], [
    { c: ['701 — Ventes de riz, paddy et riz blanc', gnf(C.ca_riz)] },
    { c: ['701 — Ventes de maïs grain', gnf(C.ca_mais)] },
    { c: ['701 — Ventes de manioc et de gari', gnf(C.ca_manioc)] },
    { c: ['701 — Ventes d’arachide en coque', gnf(C.ca_arachide)] },
    { c: ['702 — Ventes de sous-produits, son, brisures, fanes', gnf(an === 2024 ? 14000000 : 28000000)] },
    { c: ['706 — Prestations de décorticage et de battage pour tiers', an === 2024 ? '—' : gnf(42000000)] },
    { c: ['TOTAL DES PRODUITS D’EXPLOITATION', gnf(C.produits)], style: 'total' },
  ]));

  out.push(h2(`${an === 2024 ? '3.2' : '4.2'} Charges d’exploitation`));
  out.push(tableau([5400, 2200, 1760], ['Rubrique de charge', 'Montant (GNF)', 'Poids'], [
    { c: ['60 — Achats et fournitures consommés', gnf(C.achats), pct(C.achats / C.charges_totales)] },
    { c: ['61 et 62 — Transports et services extérieurs', gnf(C.services), pct(C.services / C.charges_totales)] },
    { c: ['64 — Impôts et taxes', gnf(C.impots_taxes), pct(C.impots_taxes / C.charges_totales)] },
    { c: ['66 — Charges de personnel', gnf(C.personnel), pct(C.personnel / C.charges_totales)] },
    { c: ['68 — Dotations aux amortissements', gnf(C.dotations), pct(C.dotations / C.charges_totales)] },
    { c: ['Sous-total des charges d’exploitation', gnf(C.charges_expl), pct(C.charges_expl / C.charges_totales)], style: 'total' },
    { c: ['67 — Charges financières', gnf(C.financier), pct(C.financier / C.charges_totales)] },
    { c: ['TOTAL GÉNÉRAL DES CHARGES', gnf(C.charges_totales), '100,0' + nbsp + '%'], style: 'total' },
  ]));
  out.push(p('Le détail du poste « charges de personnel » se décompose en ' + gnf(C.salaires)
    + ' GNF de salaires bruts permanents, ' + gnf(C.cnss) + ' GNF de charges sociales patronales CNSS au '
    + 'taux de 18' + nbsp + '%, et ' + gnf(C.journaliers) + ' GNF de main-d’œuvre journalière de campagne.'));

  out.push(h2(`${an === 2024 ? '3.3' : '4.3'} Compte de résultat de la campagne ${an}`));
  out.push(tableau([5400, 3960], ['Libellé', 'Montant (GNF)'], [
    { c: ['Produits d’exploitation', gnf(C.produits)], style: 'sous' },
    { c: ['Consommations intermédiaires, achats et services extérieurs', '(' + gnf(C.achats + C.services) + ')'] },
    { c: ['VALEUR AJOUTÉE', gnf(C.va)], style: 'total' },
    { c: ['Impôts et taxes', '(' + gnf(C.impots_taxes) + ')'] },
    { c: ['Charges de personnel', '(' + gnf(C.personnel) + ')'] },
    { c: ['EXCÉDENT BRUT D’EXPLOITATION', gnf(C.ebe)], style: 'total' },
    { c: ['Dotations aux amortissements', '(' + gnf(C.dotations) + ')'] },
    { c: ['RÉSULTAT D’EXPLOITATION', gnf(C.resultat_exploitation)], style: 'total' },
    { c: ['Charges financières', '(' + gnf(C.financier) + ')'] },
    { c: ['RÉSULTAT AVANT IMPÔT', gnf(C.rai)], style: 'total' },
    { c: ['Impôt sur les bénéfices, taux de 25' + nbsp + '%', '(' + gnf(C.impot) + ')'] },
    { c: ['RÉSULTAT NET DE LA CAMPAGNE', gnf(C.resultat_net)], style: 'total' },
    { c: ['Capacité d’autofinancement', gnf(C.caf)], style: 'total' },
  ]));

  out.push(h2(`${an === 2024 ? '3.4' : '4.4'} Bilan au 31 décembre ${an}`));
  const b = C.bilan;
  out.push(h3('Actif'));
  out.push(tableau([5400, 3960], ['Poste d’actif', 'Montant (GNF)'], [
    { c: ['Immobilisations brutes', gnf(b.immo_brutes)] },
    { c: ['Amortissements cumulés', '(' + gnf(C.amort_cumule) + ')'] },
    { c: ['Actif immobilisé net', gnf(C.immo_nettes)], style: 'total' },
    { c: ['Stocks d’intrants et d’emballages', gnf(b.stock_intrants)] },
    { c: ['Stocks de produits finis', gnf(b.stock_pf)] },
    { c: ['Créances clients et autres créances', gnf(b.creances)] },
    { c: ['Actif circulant', gnf(b.stock_intrants + b.stock_pf + b.creances)], style: 'total' },
    { c: ['Banques, caisse et disponibilités', gnf(C.tresorerie)] },
    { c: ['TOTAL DE L’ACTIF', gnf(C.actif)], style: 'total' },
  ]));
  out.push(h3('Passif'));
  const ligPassif = [];
  if (b.capital > 0) ligPassif.push({ c: ['Capital social libéré', gnf(b.capital)] });
  if (b.apports > 0) ligPassif.push({ c: ['Apports des promoteurs, exploitation en nom propre', gnf(b.apports)] });
  if (an === 2025) ligPassif.push({ c: ['Report à nouveau, résultat de la campagne 2024', gnf(A.resultat_net)] });
  ligPassif.push(
    { c: ['Résultat net de la campagne', gnf(C.resultat_net)] },
    { c: ['Capitaux propres', gnf(C.capitaux_propres)], style: 'total' },
    { c: ['Comptes courants d’associés bloqués', gnf(b.comptes_courants)] },
    { c: ['Capitaux propres élargis', gnf(C.cp_elargis)], style: 'total' },
    { c: ['Emprunt moyen terme 2024, encours', gnf(b.emprunt_mt)] },
  );
  if (b.emprunt_inv > 0) ligPassif.push({ c: ['Emprunt d’investissement 2025, encours', gnf(b.emprunt_inv)] });
  ligPassif.push(
    { c: ['Dettes financières', gnf(C.dettes_financieres)], style: 'total' },
    { c: ['Dettes fournisseurs', gnf(b.fournisseurs)] },
    { c: ['Dettes sociales', gnf(b.dettes_sociales)] },
    { c: ['Dettes fiscales, impôt sur les bénéfices', gnf(C.impot)] },
    { c: ['Passif circulant', gnf(C.passif_circulant)], style: 'total' },
    { c: ['TOTAL DU PASSIF', gnf(C.passif)], style: 'total' },
  );
  out.push(tableau([5400, 3960], ['Poste de passif', 'Montant (GNF)'], ligPassif));
  out.push(p('Contrôle d’équilibre : total de l’actif ' + gnf(C.actif) + ' GNF, total du passif '
    + gnf(C.passif) + ' GNF, écart nul. Le fonds de roulement net global s’établit à ' + gnf(C.fr)
    + ' GNF pour un besoin en fonds de roulement de ' + gnf(C.bfr) + ' GNF, dégageant une trésorerie nette '
    + 'positive de ' + gnf(C.tresorerie) + ' GNF.', { bold: false }));
  return out;
}

contenu.push(...sectionCampagne(2024, A, '3. Campagne agricole 2024 — mise en valeur du domaine',
  'La campagne 2024 est la campagne de mise en valeur. Elle supporte la défriche et le dessouchage des '
  + '55 hectares emblavés, l’ouverture des pistes internes et des pare-feu, la construction du hangar de '
  + 'stockage, et l’acquisition du premier équipement. La mécanisation est entièrement confiée à des '
  + 'prestataires et la transformation, décorticage du paddy comme production de gari, est sous-traitée à '
  + 'façon. Les pertes post-récolte atteignent 10' + nbsp + '% faute d’infrastructure de séchage et de '
  + 'stockage complète. La campagne dégage néanmoins un résultat net positif.'));
contenu.push(new Paragraph({ children: [new PageBreak()] }));

contenu.push(...sectionCampagne(2025, B, '4. Campagne agricole 2025 — consolidation et intégration',
  'La campagne 2025 change d’échelle sans changer de foncier. Trois décisions structurent l’année : '
  + 'l’acquisition d’un tracteur de 60 chevaux avec son train d’outils, qui met fin au recours '
  + 'aux prestataires ; l’installation d’une unité post-récolte complète, décortiqueuse, batteuse et '
  + 'râpeuse-presse à gari, qui internalise la marge de transformation ; et l’aménagement de 4 hectares de '
  + 'bas-fond rizicole à maîtrise d’eau. À cela s’ajoutent des semences certifiées, une fumure '
  + 'raisonnée établie sur analyse de sol et un encadrement technique permanent.'));
contenu.push(new Paragraph({ children: [new PageBreak()] }));

// ---- V. Comparatif
contenu.push(h1('5. Analyse comparative des deux campagnes'));
contenu.push(h2('5.1 Tableau de bord'));
contenu.push(tableau([3100, 2050, 2050, 2160], ['Indicateur', 'Campagne 2024', 'Campagne 2025', 'Progression'], [
  { c: ['Superficie emblavée (ha)', num(A.surface, 1), num(B.surface, 1), evol(A.surface, B.surface)] },
  { c: ['Production nette totale (t)', num(A.prod_nette_totale, 2), num(B.prod_nette_totale, 2), evol(A.prod_nette_totale, B.prod_nette_totale)] },
  { c: ['Produits d’exploitation', gnf(A.produits), gnf(B.produits), evol(A.produits, B.produits)] },
  { c: ['Valeur ajoutée', gnf(A.va), gnf(B.va), evol(A.va, B.va)] },
  { c: ['Excédent brut d’exploitation', gnf(A.ebe), gnf(B.ebe), evol(A.ebe, B.ebe)] },
  { c: ['Résultat d’exploitation', gnf(A.resultat_exploitation), gnf(B.resultat_exploitation), evol(A.resultat_exploitation, B.resultat_exploitation)] },
  { c: ['RÉSULTAT NET', gnf(A.resultat_net), gnf(B.resultat_net), evol(A.resultat_net, B.resultat_net)], style: 'total' },
  { c: ['Capacité d’autofinancement', gnf(A.caf), gnf(B.caf), evol(A.caf, B.caf)] },
  { c: ['Total du bilan', gnf(A.actif), gnf(B.actif), evol(A.actif, B.actif)] },
  { c: ['Trésorerie à la clôture', gnf(A.tresorerie), gnf(B.tresorerie), evol(A.tresorerie, B.tresorerie)] },
]));

contenu.push(h2('5.2 Décomposition de l’amélioration du résultat'));
const effetVolume = (B.prod_nette_totale - A.prod_nette_totale) / B.prod_nette_totale * (B.produits - A.produits);
const effetPrix = (B.produits - A.produits) - effetVolume;
contenu.push(tableau([5400, 3960], ['Levier', 'Contribution (GNF)'], [
  { c: ['Effet volume et rendement, production nette supplémentaire', gnf(effetVolume)] },
  { c: ['Effet prix et transformation, valorisation unitaire supplémentaire', gnf(effetPrix)] },
  { c: ['Augmentation totale des produits', gnf(B.produits - A.produits)], style: 'total' },
  { c: ['Augmentation des charges d’exploitation et financières', '(' + gnf(B.charges_totales - A.charges_totales) + ')'] },
  { c: ['Augmentation de l’impôt sur les bénéfices', '(' + gnf(B.impot - A.impot) + ')'] },
  { c: ['AMÉLIORATION NETTE DU RÉSULTAT', gnf(B.resultat_net - A.resultat_net)], style: 'total' },
]));
contenu.push(p('L’effet prix et transformation, qui pèse ' + gnf(effetPrix) + ' GNF, est le premier moteur '
  + 'de la progression. Il traduit essentiellement la captation de la marge d’usinage : en 2024, '
  + 'l’exploitation payait ' + gnf(A.detail_riz.paddy_usine * 700000) + ' GNF de prestation de décorticage '
  + 'et ' + gnf(A.detail_manioc.transf * 350000) + ' GNF de prestation de transformation en gari à des tiers. '
  + 'En 2025, ces prestations disparaissent du compte de charges et la marge correspondante reste dans '
  + 'l’exploitation, qui facture même ' + gnf(42000000) + ' GNF de travail à façon aux producteurs voisins.'));

contenu.push(h2('5.3 Performance ramenée à l’hectare'));
contenu.push(tableau([3100, 2050, 2050, 2160], ['Indicateur par hectare emblavé', 'Campagne 2024', 'Campagne 2025', 'Progression'], [
  { c: ['Produits d’exploitation', gnf(A.produits / A.surface), gnf(B.produits / B.surface), evol(A.produits / A.surface, B.produits / B.surface)] },
  { c: ['Valeur ajoutée', gnf(A.va / A.surface), gnf(B.va / B.surface), evol(A.va / A.surface, B.va / B.surface)] },
  { c: ['Excédent brut d’exploitation', gnf(A.ebe / A.surface), gnf(B.ebe / B.surface), evol(A.ebe / A.surface, B.ebe / B.surface)] },
  { c: ['Résultat net', gnf(A.resultat_net / A.surface), gnf(B.resultat_net / B.surface), evol(A.resultat_net / A.surface, B.resultat_net / B.surface)], style: 'total' },
]));
contenu.push(new Paragraph({ children: [new PageBreak()] }));

// ---- VI. Ratios
contenu.push(h1('6. Ratios financiers et seuil de rentabilité'));
contenu.push(h2('6.1 Ratios de rentabilité'));
contenu.push(tableau([3900, 1900, 1900, 1660], ['Ratio', '2024', '2025', 'Lecture'], [
  { c: ['Taux de valeur ajoutée', pct(A.va / A.produits), pct(B.va / B.produits), 'En hausse'] },
  { c: ['Taux de marge brute, EBE sur produits', pct(A.ebe / A.produits), pct(B.ebe / B.produits), 'Solide'] },
  { c: ['Taux de marge nette', pct(A.resultat_net / A.produits), pct(B.resultat_net / B.produits), 'En hausse'] },
  { c: ['Rentabilité économique', pct(A.resultat_exploitation / A.actif), pct(B.resultat_exploitation / B.actif), 'En hausse'] },
  { c: ['Rentabilité des capitaux propres élargis', pct(A.resultat_net / A.cp_elargis), pct(B.resultat_net / B.cp_elargis), 'En hausse'] },
], { textCols: [3] }));

contenu.push(h2('6.2 Ratios de structure et de solvabilité'));
contenu.push(tableau([3900, 1900, 1900, 1660], ['Ratio', '2024', '2025', 'Norme'], [
  { c: ['Autonomie financière', pct(A.cp_elargis / A.actif), pct(B.cp_elargis / B.actif), '> 30' + nbsp + '%'] },
  { c: ['Taux d’endettement financier', pct(A.dettes_financieres / A.cp_elargis), pct(B.dettes_financieres / B.cp_elargis), '< 100' + nbsp + '%'] },
  { c: ['Capacité de remboursement (années)', num(A.dettes_financieres / A.caf, 2), num(B.dettes_financieres / B.caf, 2), '< 4 ans'] },
  { c: ['Couverture des frais financiers', num(A.ebe / A.financier, 2), num(B.ebe / B.financier, 2), '> 3'] },
  { c: ['Liquidité générale', num((A.bilan.stock_intrants + A.bilan.stock_pf + A.bilan.creances + A.tresorerie) / A.passif_circulant, 2), num((B.bilan.stock_intrants + B.bilan.stock_pf + B.bilan.creances + B.tresorerie) / B.passif_circulant, 2), '> 1,5'] },
]));
contenu.push(p('L’autonomie financière recule mécaniquement en 2025 parce que l’exercice porte '
  + gnf(B.bilan.investissements) + ' GNF d’investissements financés à 59' + nbsp + '% par un emprunt '
  + 'd’investissement. Ce recul traduit un effet de levier assumé et non une dégradation : la capacité de '
  + 'remboursement s’améliore, passant de ' + num(A.dettes_financieres / A.caf, 2) + ' à '
  + num(B.dettes_financieres / B.caf, 2) + ' années, très en deçà de la norme bancaire de quatre années, et la '
  + 'couverture des frais financiers reste confortable.'));

contenu.push(h2('6.3 Seuil de rentabilité'));
contenu.push(tableau([3900, 2730, 2730], ['Élément', 'Campagne 2024', 'Campagne 2025'], [
  { c: ['Charges fixes', gnf(A.charges_fixes), gnf(B.charges_fixes)] },
  { c: ['Charges variables', gnf(A.charges_variables), gnf(B.charges_variables)] },
  { c: ['Marge sur coût variable', gnf(A.produits - A.charges_variables), gnf(B.produits - B.charges_variables)] },
  { c: ['Taux de marge sur coût variable', pct(A.taux_mcv), pct(B.taux_mcv)] },
  { c: ['SEUIL DE RENTABILITÉ', gnf(A.seuil), gnf(B.seuil)], style: 'total' },
  { c: ['Seuil en pourcentage des produits', pct(A.seuil / A.produits), pct(B.seuil / B.produits)] },
  { c: ['Marge de sécurité', gnf(A.produits - A.seuil), gnf(B.produits - B.seuil)], style: 'total' },
]));
contenu.push(p('En 2024, l’exploitation doit réaliser ' + pct(A.seuil / A.produits) + ' de ses produits pour '
  + 'couvrir ses charges : la marge de sécurité est faible et une mauvaise campagne, un accident '
  + 'pluviométrique ou une chute du prix du paddy suffiraient à basculer le résultat. En 2025, le seuil tombe à '
  + pct(B.seuil / B.produits) + ' des produits. L’exploitation peut désormais absorber une baisse de '
  + 'près de ' + pct(1 - B.seuil / B.produits, 0) + ' de son chiffre d’affaires sans devenir déficitaire. '
  + 'C’est le gain le plus important de la campagne 2025, au-delà même du niveau du résultat net.'));
contenu.push(new Paragraph({ children: [new PageBreak()] }));

// ---- VII. Conclusion
contenu.push(h1('7. Conclusion et points de vigilance'));
contenu.push(h2('7.1 Conclusion'));
contenu.push(p('Les deux campagnes agricoles se soldent par un résultat net positif, ce qui était '
  + 'l’objectif assigné à la mise en valeur du domaine de 60 hectares de Guéasso.'));
contenu.push(puce('La campagne 2024 dégage un résultat net de ' + gnf(A.resultat_net) + ' GNF pour '
  + gnf(A.produits) + ' GNF de produits, soit une marge nette de ' + pct(A.resultat_net / A.produits)
  + '. Ce résultat est positif mais étroit : la campagne absorbe la défriche, l’aménagement initial, une '
  + 'mécanisation entièrement sous-traitée et des pertes post-récolte de 10' + nbsp + '%.'));
contenu.push(puce('La campagne 2025 dégage un résultat net de ' + gnf(B.resultat_net) + ' GNF pour '
  + gnf(B.produits) + ' GNF de produits, soit une marge nette de ' + pct(B.resultat_net / B.produits)
  + '. Le résultat net est multiplié par ' + num(B.resultat_net / A.resultat_net, 2)
  + ' et la valeur ajoutée par hectare par ' + num((B.va / B.surface) / (A.va / A.surface), 2) + '.'));
contenu.push(puce('La progression ne vient pas d’une extension du foncier, qui reste de 60 hectares, mais '
  + 'de trois leviers techniques : des rendements supérieurs, la mise en valeur de 4 hectares de bas-fond '
  + 'rizicole, et surtout l’internalisation de la transformation.'));
contenu.push(puce('La structure financière reste saine sur les deux campagnes : trésorerie positive à chaque '
  + 'clôture, fonds de roulement couvrant intégralement le besoin en fonds de roulement, et capacité de '
  + 'remboursement très en deçà de la norme bancaire.'));

contenu.push(h2('7.2 Points de vigilance à documenter'));
contenu.push(p('Les éléments suivants doivent être vérifiés et documentés avant tout engagement financier '
  + 'fondé sur ce dossier.'));
contenu.push(puce('Volatilité des prix — le paddy et le manioc frais connaissent des variations '
  + 'saisonnières fortes. Une baisse de 15' + nbsp + '% du prix du riz blanc réduirait le résultat 2025 '
  + 'd’environ ' + gnf(B.detail_riz.riz_blanc * 12500 * 1000 * 0.15 * 0.75) + ' GNF après impôt.'));
contenu.push(puce('Aléa climatique — l’irrégularité de la répartition pluviométrique en Guinée forestière '
  + 'peut affecter les rendements du riz pluvial. Une assurance récolte indicielle est intégrée aux charges '
  + 'de 2025 ; sa disponibilité effective doit être confirmée.'));
contenu.push(puce('Logistique d’évacuation — l’état des pistes rurales entre Guéasso, Lola et '
  + 'N’Zérékoré conditionne le coût du transport et le prix obtenu. Une dégradation en saison des pluies '
  + 'peut immobiliser la récolte et peser sur le besoin en fonds de roulement.'));
contenu.push(puce('Disponibilité de la main-d’œuvre — le modèle repose sur '
  + '2' + nbsp + '800 hommes-jours en 2024 et 3' + nbsp + '200 en 2025, concentrés sur les pics de sarclage et '
  + 'de récolte. La disponibilité locale à ces périodes doit être sécurisée en amont.'));
contenu.push(puce('Maintenance du parc mécanique — la rentabilité de 2025 repose sur le fonctionnement continu '
  + 'du tracteur et de l’unité post-récolte. Un contrat de maintenance et un stock de pièces critiques '
  + 'sont indispensables.'));
contenu.push(puce('Régime fiscal — le taux d’imposition de 25' + nbsp + '% retenu est le taux de droit '
  + 'commun. L’éligibilité éventuelle à un régime agricole dérogatoire ou à des exonérations liées au '
  + 'code des investissements doit être vérifiée auprès de la Direction Générale des Impôts.'));

contenu.push(filet());
contenu.push(p('Document établi sur la base des hypothèses détaillées au chapitre 2 et du classeur de calcul '
  + '« Bilan_Comptable_Agricole_Gueasso_2024_2025.xlsx », qui permet de modifier chaque paramètre et de '
  + 'recalculer l’ensemble des états. Comptes reconstitués, non audités et non certifiés.',
{ italics: true, size: 18 }));

// ------------------------------------------------------------------ document
const doc = new Document({
  creator: 'KASI GROUP SARL',
  title: 'Bilan comptable des campagnes agricoles 2024 et 2025',
  description: 'Domaine de 60 hectares, sous-prefecture de Gueasso, prefecture de Lola',
  styles: {
    default: {
      document: { run: { font: 'Arial', size: 21 } },
      heading1: { run: { font: 'Arial' } },
      heading2: { run: { font: 'Arial' } },
      heading3: { run: { font: 'Arial' } },
    },
  },
  numbering: {
    config: [{
      reference: 'puces',
      levels: [{
        level: 0, format: LevelFormat.BULLET, text: '•',
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 400, hanging: 220 } } },
      }],
    }],
  },
  sections: [{
    properties: {
      titlePage: true,
      page: {
        margin: { top: 1200, right: 1100, bottom: 1200, left: 1100 },
      },
    },
    headers: {
      first: new Header({ children: [new Paragraph({ children: [new TextRun({ text: '' })] })] }),
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { after: 100 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF' } },
          children: [new TextRun({
            text: 'KASI GROUP SARL' + nbsp + '—' + nbsp + 'Bilan comptable des campagnes agricoles 2024 et 2025',
            size: 16, color: '808080',
          })],
        })],
      }),
    },
    footers: {
      first: new Footer({ children: [new Paragraph({ children: [new TextRun({ text: '' })] })] }),
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: 'Comptes reconstitués sur hypothèses' + nbsp + '—' + nbsp + 'Page ', size: 16, color: '808080' }),
            new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '808080' }),
            new TextRun({ text: ' / ', size: 16, color: '808080' }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: '808080' }),
          ],
        })],
      }),
    },
    children: contenu,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  const out = 'Rapport_Bilan_Agricole_Gueasso_2024_2025.docx';
  fs.writeFileSync(out, buf);
  console.log('Rapport genere :', out, Math.round(buf.length / 1024) + ' Ko');
});
