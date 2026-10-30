# UC-13 Planung exportieren

## Trigger
Der Benutzer klickt in der Planung auf «Export».

## Pre-Condition
- Mindestens eine Klient/in ist ausgewählt.

## Postcondition
- Eine Excel-Datei «Planung» mit einer Zeile pro Handlung liegt vor.

## Main Path
1. Der Benutzer klickt auf «Export».
2. Das System erstellt die Datei mit Laufnummer, Dossier, Disziplin, Thema / Ziel, Handlung, Planungsart, Wiederholung, Zeitangaben, Gültigkeit, Klassifizierung, Kategorie, Leistungsarten, Hilfsmitteln, geplanten Minuten, Personen und Resultat-Erfordernis; ungeplante Handlungen und Handlungen nach Bedarf sind nicht enthalten.

## Alternative Paths
**1a. Keine Klient/in ist ausgewählt**
1. Das System lässt den Export nicht zu («Export benötigt mindestens eine angewählte Klient/in»).
2. Use Case endet.
