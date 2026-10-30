# UC-23 Ungeplante Handlung erstellen

## Trigger
Der Benutzer wählt in der Umsetzung im Klient/in-Menü oder im «+»-Menü einer Tageszeit «Ungeplante Handlung erstellen».

## Pre-Condition
- Keine

## Postcondition
- Pro Tag im Zeitraum Von–Bis und pro Zeitangabe existiert eine ungeplante Handlung ohne geplante Minuten; ihre Umsetzung hat den Status 'Offen'.

## Main Path
1. Der Benutzer wählt «Ab Vorlage verwenden» und sucht die Vorlage (ab 3 Zeichen).
2. Das System übernimmt die Angaben der Vorlage.
3. Der Benutzer erfasst Bezeichnung, Von, Bis, Beschreibung, Hilfsmittel, Tageszeiten mit optionalen Uhrzeiten, Anz. Personen, Klassifizierung, Resultat und optionale Leistungen und klickt auf «Bestätigen».
4. Das System erstellt pro Tag und Zeitangabe eine ungeplante Handlung der Klient/in.

## Alternative Paths
**1a. Der Benutzer wählt «Ohne Vorlage erstellen»**
1. Das System zeigt zusätzlich die Leistungsarten.
2. Weiter bei Schritt 3.

**3a. Bis liegt vor Von**
1. Das System zeigt «Bis-Datum muss nach dem Von-Datum liegen.»
2. Weiter bei Schritt 3.

**3b. Bis liegt mehr als 7 Tage nach Von**
1. Das System zeigt «Der Zeitraum darf maximal 1 Woche betragen.»
2. Weiter bei Schritt 3.

**3c. Von der Vorlage zwingende Felder sind leer**
1. Das System zeigt «Zwingend erforderliche Felder sind nicht ausgefüllt.»
2. Weiter bei Schritt 3.

**3d. Der Benutzer klickt auf «Abbrechen»**
1. Das System speichert nichts.
2. Use Case endet.
