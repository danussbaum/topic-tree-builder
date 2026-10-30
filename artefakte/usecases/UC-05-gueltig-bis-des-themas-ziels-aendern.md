# UC-05 Gültig bis des Themas / Ziels ändern

## Trigger
Der Benutzer ändert in der Planung «Gültig bis» eines Themas / Ziels.

## Pre-Condition
- Thema / Ziel aktiv
- Neues Gültig bis liegt vor heute (nur für den Wechsel in den Status 'Abgeschlossen')

## Postcondition
- Das Thema / Ziel hat das neue Gültig bis.
- Liegt es vor heute, hat das Thema / Ziel den Status 'Abgeschlossen'.

## Main Path
1. Der Benutzer erfasst ein neues Gültig bis.
2. Das System stellt fest, dass Handlungen kein oder ein späteres Gültig bis haben, und fragt «Handlungen anpassen?».
3. Der Benutzer bestätigt mit «Ja».
4. Das System setzt Gültig bis des Themas / Ziels und der betroffenen Handlungen auf das neue Datum.

## Alternative Paths
**2a. Keine Handlung hat kein oder ein späteres Gültig bis**
1. Das System speichert das neue Gültig bis des Themas / Ziels ohne Rückfrage.
2. Weiter bei Schritt 4a.

**3a. Der Benutzer wählt «Nein»**
1. Das System verwirft die Änderung vollständig.
2. Use Case endet.

**4a. Neues Gültig bis liegt vor heute**
1. Das System setzt den Status des Themas / Ziels auf 'Abgeschlossen'.
2. Use Case endet.
