# UC-04 Thema / Ziel bearbeiten

## Trigger
Der Benutzer klickt in der Planung auf Bezeichnung, Freitext oder «Gültig ab» eines Themas / Ziels.

## Pre-Condition
- Thema / Ziel aktiv

## Postcondition
- Bezeichnung, Freitext und Gültig ab sind gespeichert.
- Handlungen mit früherem Gültig ab beginnen am neuen Gültig ab des Themas / Ziels.

## Main Path
1. Der Benutzer ändert Bezeichnung, Freitext und/oder Gültig ab.
2. Das System speichert die Änderung und setzt Gültig ab aller Handlungen, die vor dem neuen Gültig ab beginnen, auf das neue Datum.

## Alternative Paths
**1a. Der Benutzer bricht die Bearbeitung ab**
1. Das System verwirft die Änderung.
2. Use Case endet.
