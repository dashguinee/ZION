#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Injecte les valeurs calculees dans les cellules de formule du classeur.

openpyxl ecrit les formules sans valeur mise en cache : tant que le fichier n'a pas ete
recalcule, tout lecteur qui s'appuie sur le cache (pandas, apercus, Google Sheets) affiche
des cellules vides. LibreOffice Calc n'etant pas installe dans cet environnement, le
recalcul est fait par le moteur "formulas" puis les resultats sont ecrits directement dans
le XML du classeur, a cote des formules qui restent intactes.
"""

import pickle
import re
import shutil
import zipfile
from pathlib import Path
import xml.etree.ElementTree as ET

NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
NS_R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
ET.register_namespace("", NS)

FICHIER = Path("Bilan_Comptable_Agricole_Gueasso_2024_2025.xlsx")
CACHE = Path("valeurs_calculees.pkl")


def charger_valeurs():
    brut = pickle.load(open(CACHE, "rb"))
    par_feuille = {}
    for (feuille, cellule), valeur in brut.items():
        par_feuille.setdefault(feuille.upper(), {})[cellule] = valeur
    return par_feuille


def nom_des_feuilles(zf):
    """Associe chaque xl/worksheets/*.xml a son nom d'onglet."""
    wb = ET.fromstring(zf.read("xl/workbook.xml"))
    rels = ET.fromstring(zf.read("xl/_rels/workbook.xml.rels"))
    cible = {r.get("Id"): r.get("Target") for r in rels}
    out = {}
    for sh in wb.find(f"{{{NS}}}sheets"):
        rid = sh.get(f"{{{NS_R}}}id")
        chemin = cible[rid].lstrip("/")
        if not chemin.startswith("xl/"):
            chemin = "xl/" + chemin
        out[chemin] = sh.get("name")
    return out


def formater(valeur):
    """Retourne (type_openxml, texte) ou None si la valeur n'est pas exploitable."""
    if valeur is None:
        return None
    if isinstance(valeur, bool):
        return "b", "1" if valeur else "0"
    if isinstance(valeur, str):
        if valeur.startswith("#"):
            return "e", valeur
        return "str", valeur
    try:
        f = float(valeur)
    except (TypeError, ValueError):
        return None
    if f != f or f in (float("inf"), float("-inf")):
        return None
    return None, repr(f)


def injecter():
    valeurs = charger_valeurs()
    source = FICHIER.with_suffix(".xlsx.orig")
    shutil.copy(FICHIER, source)

    total, remplies = 0, 0
    with zipfile.ZipFile(source) as zin:
        feuilles = nom_des_feuilles(zin)
        elements = zin.infolist()
        contenus = {i.filename: zin.read(i.filename) for i in elements}

    for chemin, nom in feuilles.items():
        if chemin not in contenus:
            continue
        table = valeurs.get(nom.upper(), {})
        racine = ET.fromstring(contenus[chemin])
        modifie = False
        for cellule in racine.iter(f"{{{NS}}}c"):
            formule = cellule.find(f"{{{NS}}}f")
            if formule is None:
                continue
            total += 1
            ref = cellule.get("r")
            mise = formater(table.get(ref))
            for ancien in cellule.findall(f"{{{NS}}}v"):
                cellule.remove(ancien)
            if mise is None:
                continue
            typ, texte = mise
            if typ is None:
                cellule.attrib.pop("t", None)
            else:
                cellule.set("t", typ)
            v = ET.SubElement(cellule, f"{{{NS}}}v")
            v.text = texte
            # <f> doit preceder <v>
            enfants = list(cellule)
            enfants.sort(key=lambda e: 0 if e.tag == f"{{{NS}}}f" else 1)
            cellule[:] = enfants
            remplies += 1
            modifie = True
        if modifie:
            contenus[chemin] = ET.tostring(racine, encoding="UTF-8", xml_declaration=True)

    # forcer le recalcul a l'ouverture pour que Excel confirme les valeurs
    wb = ET.fromstring(contenus["xl/workbook.xml"])
    calc = wb.find(f"{{{NS}}}calcPr")
    if calc is None:
        calc = ET.SubElement(wb, f"{{{NS}}}calcPr")
    calc.set("fullCalcOnLoad", "1")
    calc.set("calcId", "191029")
    contenus["xl/workbook.xml"] = ET.tostring(wb, encoding="UTF-8", xml_declaration=True)

    with zipfile.ZipFile(FICHIER, "w", zipfile.ZIP_DEFLATED) as zout:
        for info in elements:
            zout.writestr(info, contenus[info.filename])

    source.unlink()
    print(f"Cellules de formule : {total} | valeurs mises en cache : {remplies}")


if __name__ == "__main__":
    injecter()
