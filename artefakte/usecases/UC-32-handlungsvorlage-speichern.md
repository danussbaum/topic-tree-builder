# UC-32 Handlungsvorlage speichern

## Trigger
Der Benutzer klickt in Einstellungen › Handlungsvorlagen auf «Neu» oder auf eine bestehende Handlungsvorlage.

## Pre-Condition
- Keine

## Postcondition
- Die Handlungsvorlage mit ihren Feldvorgaben und Leistungseinträgen ist gespeichert.

## Main Path
1. Der Benutzer erfasst Code, Disziplinen, Kategorie, die Felder mit «veränderbar»/«zwingend», Leistungsarten und optionale Leistungsarten und klickt auf «Speichern».
2. Das System prüft die Eingaben und speichert die Handlungsvorlage.

## Alternative Paths
**1a. Der Benutzer ändert die Disziplinen**
1. Das System entfernt die Kategorie, falls sie zu keiner gewählten Disziplin mehr gehört.
2. Weiter bei Schritt 1.

**1b. Der Benutzer klickt auf «Abbrechen»**
1. Das System verwirft die Eingaben.
2. Use Case endet.

**2a. Code enthält andere Zeichen als Buchstaben, Ziffern und Bindestrich**
1. Das System zeigt unter dem Feld «nur Buchstaben, Ziffern und Bindestrich erlaubt».
2. Weiter bei Schritt 1.

**2b. Code ist bereits vergeben**
1. Das System zeigt unter dem Feld «… ist bereits vergeben».
2. Weiter bei Schritt 1.

**2c. Titel ist leer und nicht veränderbar**
1. Das System zeigt unter dem Feld «zwingend, wenn das Feld in der Planung nicht veränderbar ist».
2. Weiter bei Schritt 1.

**2d. Geplante Dauer oder Anz. Personen ist keine ganze Zahl >= 0**
1. Das System zeigt unter dem Feld «muss eine ganze Zahl >= 0 sein».
2. Weiter bei Schritt 1.

**2e. Wiederholung fehlt, oder Wochentage bzw. Monatliche Regel fehlen bei nicht veränderbarem Feld**
1. Das System zeigt die zutreffende Meldung unter dem Feld.
2. Weiter bei Schritt 1.

**2f. Leistungsarten verletzen die Max.-Min.-Regel**
1. Das System zeigt «Alle ausser der letzten Leistungsart brauchen eine Max. Zeit — die letzte darf keine haben.»
2. Weiter bei Schritt 1.

**2g. Eine Tageszeit hat mehrere Durchführungen ohne bzw. mit gleicher Uhrzeit**
1. Das System zeigt «Mehrere Durchführungen in derselben Tageszeit brauchen je eine eigene, unterschiedliche Uhrzeit.»
2. Weiter bei Schritt 1.
