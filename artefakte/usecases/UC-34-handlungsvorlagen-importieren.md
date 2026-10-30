# UC-34 Handlungsvorlagen importieren

## Trigger
Der Benutzer klickt in Einstellungen › Handlungsvorlagen auf «Import».

## Pre-Condition
- Keine

## Postcondition
- Gültige Zeilen sind als Handlungsvorlagen ergänzt oder aktualisiert.

## Main Path
1. Der Benutzer wählt eine CSV-Datei.
2. Das System ordnet jede Zeile über den Code (ohne Code über den Titel) einer bestehenden Vorlage zu und aktualisiert diese oder ergänzt eine neue.

## Alternative Paths
**2a. Zeilen sind ungültig (unbekannte Disziplin, Kategorie, Leistungsart oder Hilfsmittel, ungültige Werte, doppelter Code)**
1. Das System überspringt diese Zeilen und listet sie unter «Importfehler» als «Zeile N: …».
2. Use Case endet.
