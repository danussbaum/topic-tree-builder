# UC-25 Bedarfs-Handlung löschen

## Trigger
Der Benutzer klickt in der Umsetzung bei einer Handlung nach Bedarf auf «Bedarfs-Handlung löschen» oder im Dialog auf «Löschen».

## Pre-Condition
- Keine

## Postcondition
- Die Handlung nach Bedarf mit ihrer Umsetzung existiert nicht mehr; die Handlung im Plan bleibt bestehen.

## Main Path
1. Der Benutzer klickt auf «Bedarfs-Handlung löschen».
2. Das System löscht die Handlung nach Bedarf.

## Alternative Paths
**2a. Die Umsetzung ist nicht offen**
1. Das System fragt, ob die bereits bestätigte Handlung gelöscht werden soll.
2. Bestätigt der Benutzer, löscht das System; sonst endet der Use Case ohne Änderung.
