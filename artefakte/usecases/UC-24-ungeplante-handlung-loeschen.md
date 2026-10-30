# UC-24 Ungeplante Handlung löschen

## Trigger
Der Benutzer klickt in der Umsetzung bei einer ungeplanten Handlung auf «Ungeplante Handlung löschen» oder im Dialog auf «Löschen».

## Pre-Condition
- Keine

## Postcondition
- Die ungeplante Handlung mit ihrer Umsetzung existiert nicht mehr.

## Main Path
1. Der Benutzer klickt auf «Ungeplante Handlung löschen».
2. Das System löscht die ungeplante Handlung.

## Alternative Paths
**2a. Die Umsetzung ist nicht offen**
1. Das System fragt «Diese ungeplante Handlung wurde bereits bestätigt. Beim Löschen …».
2. Bestätigt der Benutzer, löscht das System; sonst endet der Use Case ohne Änderung.
