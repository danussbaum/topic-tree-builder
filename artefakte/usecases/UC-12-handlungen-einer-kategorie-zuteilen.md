# UC-12 Handlungen einer Kategorie zuteilen

## Trigger
Der Benutzer wählt im Klient/in-Menü «Mehrere einer Kategorie zuteilen».

## Pre-Condition
- Alle markierten Handlungen gehören zu aktiven Themen / Zielen derselben Disziplin, und ihre Kategorie ist nicht durch die Handlungsvorlage festgelegt.

## Postcondition
- Die Handlungen haben die gewählte Kategorie oder keine.

## Main Path
1. Der Benutzer markiert eine oder mehrere Handlungen und klickt auf «Kategorie zuteilen…».
2. Das System zeigt «Ohne Kategorie» und die Kategorien der Disziplin.
3. Der Benutzer wählt eine Kategorie und klickt auf «Zuteilen».
4. Das System setzt die Kategorie.

## Alternative Paths
**1a. Die Kategorie ist durch die Handlungsvorlage festgelegt**
1. Das System lässt die Auswahl nicht zu («Kategorie ist durch die Handlungsvorlage festgelegt»).
2. Weiter bei Schritt 1.

**3a. Der Benutzer klickt auf «Abbrechen»**
1. Das System speichert nichts.
2. Use Case endet.
