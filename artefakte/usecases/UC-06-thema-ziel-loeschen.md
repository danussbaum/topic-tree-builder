# UC-06 Thema / Ziel löschen

## Trigger
Der Benutzer klickt in der Planung bei einem Thema / Ziel auf «Thema / Ziel löschen».

## Pre-Condition
- Thema / Ziel aktiv

## Postcondition
- Das Thema / Ziel mit allen Handlungen, Durchführungen und Umsetzungen existiert nicht mehr.

## Main Path
1. Der Benutzer klickt auf «Thema / Ziel löschen».
2. Das System fragt: «Dieses Thema / Ziel enthält Handlungen. Beim Löschen werden alle verknüpften Daten ebenfalls gelöscht. Möchten Sie fortfahren?»
3. Der Benutzer bestätigt.
4. Das System löscht das Thema / Ziel samt allen verknüpften Daten.

## Alternative Paths
**2a. Das Thema / Ziel enthält keine Handlungen**
1. Das System löscht das Thema / Ziel ohne Rückfrage.
2. Use Case endet.

**3a. Der Benutzer bricht ab**
1. Das System löscht nichts.
2. Use Case endet.
