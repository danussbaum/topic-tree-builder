# UC-26 Filter anwenden

## Trigger
Der Benutzer klickt in der Umsetzung oder in den Auswertungen auf «Filter».

## Pre-Condition
- Die Ansicht Umsetzung oder Auswertungen ist aktiv.

## Postcondition
- Die Ansicht zeigt nur Umsetzungen, die dem Filter entsprechen; der Filter bleibt gespeichert.

## Main Path
1. Der Benutzer setzt Status, Minuten geplant/tatsächlich, Differenz, Disziplin, Tageszeit, Planungsart, Klassifizierung, Anzahl Personen, Resultat, Handlung (Titel enthält) und «Nur abgeschlossene Themen / Ziele einblenden» und klickt auf «Anwenden».
2. Das System filtert die Ansicht.

## Alternative Paths
**1a. Der Benutzer klickt auf «Zurücksetzen»**
1. Das System stellt den Standardfilter (Offen und Verschoben) her.
2. Weiter bei Schritt 1.

**1b. Der Benutzer klickt auf «Abbrechen»**
1. Das System verwirft die Änderungen am Filter.
2. Use Case endet.
