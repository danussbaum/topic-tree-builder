# UC-09 Handlung bearbeiten

## Trigger
Der Benutzer klickt in der Planung bei einer Handlung auf «Handlung bearbeiten».

## Pre-Condition
- Thema / Ziel aktiv

## Postcondition
- Die Änderungen sind gespeichert.
- Hat die Handlung bestätigte Umsetzungen, sind Bezeichnung, Leistungsarten und Gültig ab unverändert.

## Main Path
1. Der Benutzer öffnet die Handlung.
2. Das System zeigt die Felder; von der Vorlage gesperrte Felder und – falls bestätigte Umsetzungen existieren – Bezeichnung, Leistungsarten und Gültig ab sind gesperrt.
3. Der Benutzer ändert Felder und klickt auf «Speichern».
4. Das System prüft die Eingaben wie in UC-08 und speichert die Handlung.

## Alternative Paths
**3a. Der Benutzer entfernt eine Durchführung mit bestätigten Umsetzungen**
1. Das System fragt «Durchführung mit Bestätigungen entfernen»: «… Beim Speichern werden diese Daten unwiderruflich gelöscht. Fortfahren?»
2. Bestätigt der Benutzer, weiter bei Schritt 4; sonst weiter bei Schritt 3.

**3b. Der Benutzer klickt auf «Abbrechen»**
1. Das System verwirft die Änderungen.
2. Use Case endet.

**4a. Eingaben sind ungültig**
1. Das System zeigt die Meldungen wie in UC-08 unter den betroffenen Feldern.
2. Weiter bei Schritt 3.
