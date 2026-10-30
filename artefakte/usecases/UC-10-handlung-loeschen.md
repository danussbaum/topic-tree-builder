# UC-10 Handlung löschen

## Trigger
Der Benutzer klickt in der Planung bei einer Handlung auf «Handlung löschen» oder im Bearbeitungspanel auf «Löschen».

## Pre-Condition
- Thema / Ziel aktiv

## Postcondition
- Die Handlung mit allen Durchführungen und Umsetzungen existiert nicht mehr.

## Main Path
1. Der Benutzer klickt auf «Handlung löschen».
2. Das System löscht die Handlung.

## Alternative Paths
**2a. Die Handlung hat bestätigte Umsetzungen**
1. Das System fragt: «Diese geplante Handlung hat bereits bestätigte Einträge. Beim Löschen werden alle verknüpften Daten ebenfalls gelöscht. Möchten Sie fortfahren?»
2. Bestätigt der Benutzer, löscht das System die Handlung; sonst endet der Use Case ohne Änderung.
