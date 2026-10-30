# UC-18 Umsetzung bearbeiten

## Trigger
Der Benutzer klickt in der Umsetzung bei einer bestätigten Handlung auf «Umsetzung bearbeiten».

## Pre-Condition
- Thema / Ziel aktiv

## Postcondition
- Die Umsetzung hat unverändert ihren Status mit den geänderten Angaben.

## Main Path
1. Der Benutzer klickt auf «Umsetzung bearbeiten».
2. Das System zeigt den Dialog mit der gespeicherten Variante, Bestätigt von und Bestätigt am.
3. Der Benutzer ändert die Angaben und klickt auf «Bestätigen».
4. Das System speichert die Änderungen mit neuem Bestätigt von und Bestätigt am.

## Alternative Paths
**3a. Pflichtangaben der Variante fehlen**
1. Das System lässt «Bestätigen» nicht zu.
2. Weiter bei Schritt 3.

**3b. Der Benutzer klickt auf «Abbrechen»**
1. Das System speichert nichts.
2. Use Case endet.
