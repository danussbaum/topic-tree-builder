# UC-36 Disziplin speichern

## Trigger
Der Benutzer klickt in Einstellungen › Disziplinen auf «Neu» oder auf eine bestehende Disziplin.

## Pre-Condition
- Keine

## Postcondition
- Die Disziplin mit berechtigten Rollen und Kategorien ist gespeichert.

## Main Path
1. Der Benutzer erfasst Titel, Berechtigte Rollen und Kategorien und klickt auf «Speichern».
2. Das System speichert die Disziplin.

## Alternative Paths
**1a. Der Benutzer klickt auf «Abbrechen»**
1. Das System verwirft die Eingaben.
2. Use Case endet.

**2a. Titel ist leer**
1. Das System zeigt unter dem Feld, dass der Titel zwingend ist.
2. Weiter bei Schritt 1.
