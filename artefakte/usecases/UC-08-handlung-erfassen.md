# UC-08 Handlung erfassen

## Trigger
Der Benutzer klickt in der Planung bei einem Thema / Ziel auf «Neue Handlung erfassen».

## Pre-Condition
- Thema / Ziel aktiv

## Postcondition
- Eine geplante Handlung mit 1..n Durchführungen existiert.
- Für jeden fälligen Termin jeder Durchführung besteht eine Umsetzung im Status 'Offen'.

## Main Path
1. Der Benutzer wählt «Ab Vorlage».
2. Das System zeigt die Vorlagen der Disziplin des Themas / Ziels (Suche ab 2 Zeichen).
3. Der Benutzer wählt eine Vorlage.
4. Das System übernimmt die Felder der Vorlage, sperrt die nicht veränderbaren Felder, markiert zwingende Felder und übernimmt Gültig ab und Gültig bis vom Thema / Ziel.
5. Der Benutzer erfasst Bezeichnung, Beschreibung, Hilfsmittel, Leistungsarten, Tageszeiten (optional, je Tageszeit optional eine oder mehrere Uhrzeiten), Geplante Minuten, Anz. Personen, Klassifizierung, Resultat, Gültig ab, Gültig bis und Wiederholung und klickt auf «Speichern».
6. Das System prüft die Eingaben und speichert die Handlung mit einer Durchführung pro Tageszeit bzw. pro Uhrzeit einer Tageszeit; ohne Tageszeit mit einer Durchführung ohne Zeitangabe.

## Alternative Paths
**1a. Der Benutzer wählt «Ohne Vorlage»**
1. Das System zeigt eine leere Handlung mit den Hilfsmitteln der Disziplin des Themas / Ziels.
2. Weiter bei Schritt 5.

**5a. Der Benutzer hat «Ab Vorlage» gewählt, aber keine Vorlage**
1. Das System zeigt «Bitte eine Vorlage auswählen.»
2. Weiter bei Schritt 3.

**5b. Der Benutzer klickt auf «Abbrechen» oder ausserhalb des Panels**
1. Das System verwirft die Eingaben.
2. Use Case endet.

**6a. Bezeichnung ist leer**
1. Das System zeigt unter dem Feld «Eine Bezeichnung ist zwingend.»
2. Weiter bei Schritt 5.

**6b. Ein von der Vorlage zwingendes Feld ist leer**
1. Das System zeigt unter dem Feld «Pflichtfeld – bitte ausfüllen».
2. Weiter bei Schritt 5.

**6c. Gültig ab ist leer**
1. Das System zeigt «Gültig ab ist zwingend — sonst erscheint die Handlung nicht in der Umsetzung.»
2. Weiter bei Schritt 5.

**6d. Gültig bis liegt vor Gültig ab**
1. Das System zeigt «Gültig bis darf nicht vor Gültig ab liegen — sonst wird die Handlung nie fällig.»
2. Weiter bei Schritt 5.

**6e. Gültig ab oder Gültig bis liegt ausserhalb des Themas / Ziels**
1. Das System zeigt «Datum muss innerhalb des Gültigkeitsbereichs des Themas / Ziels liegen (…).»
2. Weiter bei Schritt 5.

**6f. Wiederholung fehlt, bei «Wöchentlich» fehlt ein Wochentag oder bei «Monatlich» fehlt das Muster**
1. Das System zeigt die zutreffende Meldung, z. B. «Mindestens ein Wochentag ist zwingend — sonst wird die Handlung nie fällig.»
2. Weiter bei Schritt 5.

**6g. Leistungsarten verletzen die Max.-Min.-Regel**
1. Das System zeigt «Alle Leistungsarten ausser der letzten benötigen eine Max. Anzahl Minuten — die letzte darf keine haben.»
2. Weiter bei Schritt 5.

**6h. Eine Tageszeit hat mehrere Durchführungen ohne bzw. mit gleicher Uhrzeit**
1. Das System zeigt «Mehrere Durchführungen in derselben Tageszeit brauchen je eine eigene, unterschiedliche Uhrzeit.»
2. Weiter bei Schritt 5.
