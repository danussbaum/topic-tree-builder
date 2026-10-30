# UC-38 Hilfsmittel speichern

## Trigger
Der Benutzer klickt in Einstellungen › Hilfsmittel auf «Neu» oder auf ein bestehendes Hilfsmittel.

## Pre-Condition
- Keine

## Postcondition
- Das Hilfsmittel ist gespeichert.

## Main Path
1. Der Benutzer erfasst Name, Beschreibung und Disziplinen (leer = alle) und klickt auf «Speichern».
2. Das System speichert das Hilfsmittel.

## Alternative Paths
**1a. Der Benutzer klickt auf «Abbrechen»**
1. Das System verwirft die Eingaben.
2. Use Case endet.

**2a. Name ist leer**
1. Das System zeigt unter dem Feld, dass der Name zwingend ist.
2. Weiter bei Schritt 1.
