# UC-22 Handlung nach Bedarf erstellen

## Trigger
Der Benutzer wählt in der Umsetzung im Klient/in-Menü oder im «+»-Menü einer Tageszeit «Handlung nach Bedarf erstellen».

## Pre-Condition
- Die Klient/in hat für das Datum eine Handlung mit Wiederholung 'Nach Bedarf' in einem aktiven Thema / Ziel.

## Postcondition
- Eine Handlung nach Bedarf für das Datum existiert; ihre Umsetzung hat den Status 'Offen'.

## Main Path
1. Der Benutzer wählt das Datum (bei Aufruf aus einer Tageszeit ist es vorgegeben).
2. Das System zeigt die möglichen Handlungen als «Disziplin › Thema / Ziel» mit Titel und geplanten Minuten.
3. Der Benutzer wählt die Handlung, die Tageszeit (oder «Ohne Zeitangabe») und optional eine Uhrzeit und klickt auf «Bestätigen».
4. Das System erstellt die Handlung nach Bedarf für diesen einen Tag im selben Thema / Ziel.

## Alternative Paths
**2a. Keine Handlung nach Bedarf vorhanden**
1. Das System zeigt «Für dieses Datum ist keine Handlung mit der Wiederholung «Nach Bedarf» im Plan hinterlegt.»
2. Use Case endet.

**3a. Der Benutzer klickt auf «Abbrechen»**
1. Das System speichert nichts.
2. Use Case endet.
