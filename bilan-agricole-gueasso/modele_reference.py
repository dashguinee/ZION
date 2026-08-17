#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Recalcul independant du modele, en Python pur.
Sert de controle croise des formules du classeur Excel et alimente le rapport Word.
Les hypotheses sont strictement identiques a celles de l'onglet "Hypotheses".
"""

M = 1_000_000


def campagne(an):
    p = PARAM[an]
    res = {}

    # --- production
    prod = {}
    for cult, surf in p["surfaces"].items():
        brut = surf * p["rendements"][cult]
        prod[cult] = {"surface": surf, "rdt": p["rendements"][cult],
                      "brut": brut, "net": brut * (1 - p["pertes"])}
    res["production"] = prod
    res["prod_nette_totale"] = sum(v["net"] for v in prod.values())

    # --- riz
    paddy = prod["riz_pluvial"]["net"] + prod["riz_basfond"]["net"]
    paddy_usine = paddy * p["part_usinee"]
    riz_blanc = paddy_usine * p["rdt_usinage"]
    paddy_vendu = paddy - paddy_usine
    ca_riz = riz_blanc * p["prix"]["riz_blanc"] * 1000 + paddy_vendu * p["prix"]["paddy"] * 1000
    res["riz"] = {"paddy": paddy, "paddy_usine": paddy_usine, "riz_blanc": riz_blanc,
                  "paddy_vendu": paddy_vendu, "ca": ca_riz}

    # --- manioc
    racines = prod["manioc"]["net"]
    transf = racines * p["part_gari"]
    gari = transf * p["rdt_gari"]
    frais = racines - transf
    ca_manioc = gari * p["prix"]["gari"] * 1000 + frais * p["prix"]["manioc"] * 1000
    res["manioc"] = {"racines": racines, "transf": transf, "gari": gari,
                     "frais": frais, "ca": ca_manioc}

    # --- mais et arachide
    ca_mais = prod["mais"]["net"] * p["prix"]["mais"] * 1000
    ca_ara = prod["arachide"]["net"] * p["prix"]["arachide"] * 1000

    produits = (ca_riz + ca_mais + ca_manioc + ca_ara
                + p["sous_produits"] + p["prestations"])
    res["ca_riz"], res["ca_mais"], res["ca_manioc"], res["ca_arachide"] = ca_riz, ca_mais, ca_manioc, ca_ara
    res["produits"] = produits

    # --- charges
    achats = (p["semences"] + p["engrais"] + p["amendements"]
              + p["surface_totale"] * p["phyto_ha"]
              + p["emballages"] + p["carburant"] + p["pieces"])
    services = (p["mecanisation"] + paddy_usine * p["cout_decorticage"]
                + transf * p["cout_gari"] + p["transport"] + p["locations"]
                + p["assurances"] + p["honoraires"] + p["telecom"] + p["formation"])
    impots_taxes = p["patente"] + p["taxes_communales"]
    salaires = sum(p["salaires"].values())
    cnss = salaires * p["taux_cnss"]
    journaliers = p["nb_hj"] * p["cout_hj"]
    personnel = salaires + cnss + journaliers
    financier = p["interets"]
    dotations = p["dotations"]

    charges_expl = achats + services + impots_taxes + personnel + dotations
    res.update(achats=achats, services=services, impots_taxes=impots_taxes,
               salaires=salaires, cnss=cnss, journaliers=journaliers,
               personnel=personnel, financier=financier, dotations=dotations,
               charges_expl=charges_expl,
               charges_totales=charges_expl + financier)

    # --- soldes
    va = produits - achats - services
    ebe = va - impots_taxes - personnel
    re_ = ebe - dotations
    rai = re_ - financier
    impot = max(0, rai * p["taux_is"])
    rn = rai - impot
    caf = rn + dotations
    res.update(va=va, ebe=ebe, resultat_exploitation=re_, rai=rai,
               impot=impot, resultat_net=rn, caf=caf)

    # --- seuil de rentabilite
    charges_fixes = (salaires + cnss + dotations + financier + impots_taxes
                     + p["locations"] + p["assurances"] + p["honoraires"]
                     + p["telecom"] + p["formation"])
    charges_variables = res["charges_totales"] - charges_fixes
    mcv = produits - charges_variables
    taux_mcv = mcv / produits
    res.update(charges_fixes=charges_fixes, charges_variables=charges_variables,
               taux_mcv=taux_mcv, seuil=charges_fixes / taux_mcv)
    return res


PARAM = {
    2024: dict(
        surface_totale=55,
        surfaces=dict(riz_pluvial=22, riz_basfond=0, mais=14, manioc=12, arachide=7),
        rendements=dict(riz_pluvial=2.60, riz_basfond=0.0, mais=2.90, manioc=13.50, arachide=1.35),
        pertes=0.10, rdt_usinage=0.65, rdt_gari=0.22, part_usinee=0.55, part_gari=0.25,
        prix=dict(paddy=5000, riz_blanc=11500, mais=4200, manioc=1700, gari=9000, arachide=9500),
        sous_produits=14 * M, prestations=0,
        semences=53.8 * M, engrais=106.2 * M, amendements=0, phyto_ha=420_000,
        emballages=21 * M, carburant=34 * M, pieces=16 * M,
        mecanisation=48 * M, cout_decorticage=700_000, cout_gari=350_000,
        transport=46 * M, locations=8 * M, assurances=6 * M, honoraires=10 * M,
        telecom=12 * M, formation=0,
        patente=4.5 * M, taxes_communales=9.5 * M,
        salaires=dict(direction=36 * M, techniciens=40.8 * M, resp_transfo=0,
                      ouvriers=52.8 * M, gardiens=24 * M),
        taux_cnss=0.18, nb_hj=2800, cout_hj=30_000,
        interets=250 * M * 0.14 * 10 / 12,
        dotations=(145 / 10 * 9 / 12 + 120 / 20 * 5 / 12 + 78 / 5 * 10 / 12
                   + 25 / 5 * 8 / 12 + 62 / 5 * 10 / 12 + 18 / 5 * 10 / 12) * M,
        taux_is=0.25,
    ),
    2025: dict(
        surface_totale=58,
        surfaces=dict(riz_pluvial=23, riz_basfond=4, mais=14, manioc=11, arachide=6),
        rendements=dict(riz_pluvial=3.30, riz_basfond=4.50, mais=3.70, manioc=17.00, arachide=1.70),
        pertes=0.05, rdt_usinage=0.65, rdt_gari=0.22, part_usinee=0.85, part_gari=0.45,
        prix=dict(paddy=5400, riz_blanc=12500, mais=4600, manioc=1850, gari=10000, arachide=10500),
        sous_produits=28 * M, prestations=42 * M,
        semences=61.46 * M, engrais=131.2 * M, amendements=18 * M, phyto_ha=450_000,
        emballages=32 * M, carburant=96 * M, pieces=38 * M,
        mecanisation=14 * M, cout_decorticage=0, cout_gari=0,
        transport=58 * M, locations=6 * M, assurances=18 * M, honoraires=16 * M,
        telecom=22 * M, formation=12 * M,
        patente=12 * M, taxes_communales=10 * M,
        salaires=dict(direction=43.2 * M, techniciens=68.4 * M, resp_transfo=26.4 * M,
                      ouvriers=97.2 * M, gardiens=26.4 * M),
        taux_cnss=0.18, nb_hj=3200, cout_hj=32_000,
        interets=208 * M * 0.14 + 450 * M * 0.13 * 11 / 12,
        dotations=((385 / 8 * 11 / 12 + 178 / 7 * 10 / 12 + 95 / 20 * 7 / 12
                    + 68 / 10 * 9 / 12 + 32 / 5 * 8 / 12)
                   + (145 / 10 + 120 / 20 + 78 / 5 + 25 / 5 + 62 / 5 + 18 / 5)) * M,
        taux_is=0.25,
    ),
}

# --- bilan
BILAN = {
    2024: dict(immo_brutes=448 * M, stock_intrants=28 * M, stock_pf=72 * M, creances=46 * M,
               fournisseurs=42 * M, dettes_sociales=12 * M,
               apports=200 * M, capital=0, comptes_courants=120 * M,
               emprunt_mt=250 * M - 42 * M, emprunt_inv=0,
               investissements=448 * M, nouveaux_emprunts=250 * M, remboursement=42 * M,
               apports_flux=320 * M),
    2025: dict(immo_brutes=(448 + 758) * M, stock_intrants=45 * M, stock_pf=118 * M, creances=78 * M,
               fournisseurs=68 * M, dettes_sociales=20 * M,
               apports=0, capital=10 * M, comptes_courants=370 * M,
               emprunt_mt=208 * M - 42 * M, emprunt_inv=450 * M,
               investissements=758 * M, nouveaux_emprunts=450 * M, remboursement=42 * M,
               apports_flux=60 * M),
}


def construire():
    r = {an: campagne(an) for an in (2024, 2025)}
    treso_prec, bfr_prec = 0.0, 0.0
    amort_cumule = 0.0
    for an in (2024, 2025):
        b, c = BILAN[an], r[an]
        amort_cumule += c["dotations"]
        c["amort_cumule"] = amort_cumule
        c["immo_nettes"] = b["immo_brutes"] - amort_cumule
        bfr = (b["stock_intrants"] + b["stock_pf"] + b["creances"]
               - b["fournisseurs"] - b["dettes_sociales"] - c["impot"])
        c["bfr"] = bfr
        c["var_bfr"] = bfr - bfr_prec
        treso = (treso_prec + c["caf"] - c["var_bfr"] - b["investissements"]
                 + b["apports_flux"] + b["nouveaux_emprunts"] - b["remboursement"])
        c["tresorerie"] = treso
        treso_prec, bfr_prec = treso, bfr

        c["actif"] = c["immo_nettes"] + b["stock_intrants"] + b["stock_pf"] + b["creances"] + treso
        report = r[2024]["resultat_net"] if an == 2025 else 0
        c["capitaux_propres"] = b["capital"] + b["apports"] + report + c["resultat_net"]
        c["cp_elargis"] = c["capitaux_propres"] + b["comptes_courants"]
        c["dettes_financieres"] = b["emprunt_mt"] + b["emprunt_inv"]
        c["passif_circulant"] = b["fournisseurs"] + b["dettes_sociales"] + c["impot"]
        c["passif"] = c["cp_elargis"] + c["dettes_financieres"] + c["passif_circulant"]
        c["ecart_bilan"] = c["actif"] - c["passif"]
        c["fr"] = c["cp_elargis"] + c["dettes_financieres"] - c["immo_nettes"]
        c["surface"] = PARAM[an]["surface_totale"]
    return r


RESULTATS = construire()


def g(x):
    return f"{x:,.0f}".replace(",", " ")


if __name__ == "__main__":
    for an in (2024, 2025):
        c = RESULTATS[an]
        print(f"\n{'=' * 62}\nCAMPAGNE {an}   ({c['surface']} ha emblaves)\n{'=' * 62}")
        for cle, lib in [
            ("prod_nette_totale", "Production nette totale (t)"),
            ("produits", "Produits d'exploitation"),
            ("achats", "  Achats consommes"),
            ("services", "  Services exterieurs"),
            ("impots_taxes", "  Impots et taxes"),
            ("personnel", "  Charges de personnel"),
            ("dotations", "  Dotations aux amortissements"),
            ("charges_expl", "Total charges d'exploitation"),
            ("va", "VALEUR AJOUTEE"),
            ("ebe", "EXCEDENT BRUT D'EXPLOITATION"),
            ("resultat_exploitation", "RESULTAT D'EXPLOITATION"),
            ("financier", "  Charges financieres"),
            ("rai", "RESULTAT AVANT IMPOT"),
            ("impot", "  Impot sur les benefices (25%)"),
            ("resultat_net", "RESULTAT NET"),
            ("caf", "Capacite d'autofinancement"),
            ("bfr", "Besoin en fonds de roulement"),
            ("tresorerie", "Tresorerie a la cloture"),
            ("immo_nettes", "Immobilisations nettes"),
            ("actif", "TOTAL ACTIF"),
            ("passif", "TOTAL PASSIF"),
            ("ecart_bilan", "Ecart actif - passif"),
            ("fr", "Fonds de roulement"),
            ("seuil", "Seuil de rentabilite"),
        ]:
            v = c[cle]
            print(f"{lib:<38} {v:>18,.2f}".replace(",", " ") if cle == "prod_nette_totale"
                  else f"{lib:<38} {g(v):>18} GNF")
        print(f"{'Marge nette':<38} {c['resultat_net'] / c['produits']:>17.1%}")
        print(f"{'VA par hectare':<38} {g(c['va'] / c['surface']):>18} GNF")
        print(f"{'Resultat net par hectare':<38} {g(c['resultat_net'] / c['surface']):>18} GNF")
        print(f"{'Seuil en % des produits':<38} {c['seuil'] / c['produits']:>17.1%}")

    a, b = RESULTATS[2024], RESULTATS[2025]
    print(f"\n{'=' * 62}\nPROGRESSION 2024 -> 2025\n{'=' * 62}")
    for cle, lib in [("produits", "Produits"), ("va", "Valeur ajoutee"),
                     ("ebe", "EBE"), ("resultat_net", "Resultat net"), ("caf", "CAF")]:
        print(f"{lib:<24} {g(a[cle]):>16} -> {g(b[cle]):>16}   x{b[cle] / a[cle]:.2f}")
