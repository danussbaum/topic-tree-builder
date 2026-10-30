# UC-28 Zielbeurteilung speichern

## Trigger
Der Benutzer klickt in der Evaluation bei einem abgeschlossenen Thema / Ziel auf «Beurteilung erfassen» bzw. «Beurteilung bearbeiten».

## Pre-Condition
- Das Thema / Ziel hat den Status 'Abgeschlossen'.

## Postcondition
- Die Zielbeurteilung ist mit Beurteilt von und Beurteilt am gespeichert.

## Main Path
1. Der Benutzer erfasst Ziel erreicht, Auswertung und Abgeleitete Massnahmen und klickt auf «Speichern».
2. Das System speichert die Zielbeurteilung und überschreibt eine bestehende.

## Alternative Paths
**1a. Der Benutzer klickt auf «Abbrechen»**
1. Das System speichert nichts.
2. Use Case endet.
