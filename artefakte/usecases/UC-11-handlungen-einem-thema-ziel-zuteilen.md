# UC-11 Handlungen einem Thema / Ziel zuteilen

## Trigger
Der Benutzer wählt im Klient/in-Menü «Mehrere einem Thema / Ziel zuteilen».

## Pre-Condition
- Alle markierten Handlungen gehören zu aktiven Themen / Zielen derselben Disziplin.

## Postcondition
- Die zugeteilten Handlungen gehören zum gewählten Thema / Ziel.

## Main Path
1. Der Benutzer markiert eine oder mehrere Handlungen.
2. Das System zeigt die Anzahl ausgewählter Handlungen.
3. Der Benutzer klickt auf «Zu Thema / Ziel zuteilen…».
4. Das System zeigt die aktiven Themen / Ziele derselben Disziplin mit ihrer Gültigkeit.
5. Der Benutzer wählt ein Thema / Ziel und klickt auf «N zuteilen».
6. Das System verschiebt die Handlungen.

## Alternative Paths
**1a. Die Handlung gehört zu einem abgeschlossenen Thema / Ziel oder zu einer anderen Disziplin**
1. Das System lässt die Auswahl nicht zu und zeigt den Grund.
2. Weiter bei Schritt 1.

**4a. Handlungen haben Bestätigungen ausserhalb der Gültigkeit des gewählten Themas / Ziels**
1. Das System zeigt diese als «Nicht verschiebbar» und teilt sie nicht zu.
2. Weiter bei Schritt 5.

**4b. Die Gültigkeit einer Handlung reicht über das gewählte Thema / Ziel hinaus**
1. Das System zeigt einen Hinweis, lässt die Zuteilung aber zu.
2. Weiter bei Schritt 5.

**5a. Der Benutzer klickt auf «Abbrechen»**
1. Das System speichert nichts.
2. Use Case endet.
