# UC-02 Klient/in umbenennen

## Trigger
Der Benutzer klickt in der Kopfzeile der Klient/in auf Vorname oder Nachname.

## Pre-Condition
- Genau eine Klient/in ist ausgewählt.

## Postcondition
- Vorname und Nachname sind gespeichert.

## Main Path
1. Der Benutzer ändert Vorname und/oder Nachname.
2. Das System speichert die Änderung.

## Alternative Paths
**1a. Der Benutzer bricht die Bearbeitung ab**
1. Das System verwirft die Änderung.
2. Use Case endet.
