# UC-27 Umsetzungen exportieren

## Trigger
Der Benutzer klickt in der Umsetzung auf «Export».

## Pre-Condition
- Mindestens eine Klient/in ist ausgewählt.

## Postcondition
- Eine Excel-Datei «Umsetzungen» mit den angezeigten Umsetzungen des gewählten Zeitraums liegt vor.

## Main Path
1. Der Benutzer klickt auf «Export».
2. Das System erstellt die Datei mit genau den angezeigten Umsetzungen, inklusive Status, Grund, Resultat, Beobachtungen, Verschiebungsangaben, Benutzername, Zeitpunkt, Zeitangaben, Leistungsarten, optionalen Leistungen sowie geplanten und gespeicherten tatsächlichen Minuten und Personen.

## Alternative Paths
**1a. Keine Klient/in ist ausgewählt**
1. Das System lässt den Export nicht zu.
2. Use Case endet.
