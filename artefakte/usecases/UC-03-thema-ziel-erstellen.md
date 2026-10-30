# UC-03 Thema / Ziel erstellen

## Trigger
Der Benutzer wählt in der Planung «Neu», im Klient/in-Menü «Thema / Ziel hinzufügen» oder im Disziplin-Kasten «+ Thema / Ziel».

## Pre-Condition
- Genau eine Klient/in ist ausgewählt.
- Die Ansicht Planung ist aktiv.

## Postcondition
- Ein neues Thema / Ziel der gewählten Disziplin existiert und hat den Status 'Aktiv'.

## Main Path
1. Der Benutzer öffnet «Neues Thema / Ziel».
2. Das System schlägt die erste Disziplin vor.
3. Der Benutzer wählt die Disziplin und klickt auf «Thema / Ziel erstellen».
4. Das System legt ein Thema / Ziel ohne Bezeichnung an und setzt den Fokus auf die Bezeichnung.

## Alternative Paths
**1a. Es ist nicht genau eine Klient/in ausgewählt**
1. Das System zeigt «Bitte genau eine Klient/in auswählen» und lässt die Aktion nicht zu.
2. Use Case endet.
