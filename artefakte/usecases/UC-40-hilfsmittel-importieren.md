# UC-40 Hilfsmittel importieren

## Trigger
Der Benutzer klickt in Einstellungen › Hilfsmittel auf «Import».

## Pre-Condition
- Keine

## Postcondition
- Der Hilfsmittel-Katalog besteht aus den importierten Zeilen.

## Main Path
1. Der Benutzer wählt eine CSV-Datei mit Name, Beschreibung und Disziplinen.
2. Das System ersetzt den ganzen Katalog durch die importierten Hilfsmittel.

## Alternative Paths
**2a. Name fehlt in einer Zeile**
1. Das System überspringt die Zeile und meldet «Zeile N: Name fehlt» unter «Import mit Fehlern».
2. Use Case endet.

**2b. Eine Disziplin ist unbekannt**
1. Das System importiert die Zeile ohne diese Disziplin und meldet «Zeile N: unbekannte Disziplin …».
2. Use Case endet.
