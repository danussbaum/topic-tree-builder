# Konsistenzprüfung

| Prüfpunkt | Resultat |
|---|---|
| Jede Transition verweist auf einen existierenden Use Case (ID und Titel identisch) | ✅ |
| Jeder Use Case, der einen Status ändert, hat eine passende Transition | ✅ |
| Jedes Domänenobjekt mit Status-Aufzählung hat ein State Chart | ✅ Umsetzung, Thema / Ziel |
| Alle Zustände im State Chart entsprechen den Aufzählungswerten im Domänenmodell | ✅ |
| Jeder Guard steht gleich formuliert in der Pre-Condition des zugehörigen Use Cases | ⚠️ Befund 2 |
| Alle in Use Cases verwendeten Objekte und Attribute existieren im Domänenmodell | ✅ |
| Alle Mermaid-Diagramme sind syntaktisch gültig | ⚠️ Befund 4 |
| Keine technischen Felder oder Stack-Begriffe in den Artefakten | ✅ |

## Befunde

1. **Zeitgesteuerter Abschluss ohne Use Case**
   - **Wo:** `statecharts/ThemaZiel.md`
   - **Was:** Ein Thema / Ziel wird «Abgeschlossen», sobald «Gültig bis» vor dem heutigen Datum liegt, auch ohne Benutzeraktion. Für diese Transition gibt es keinen Use Case.
   - **Vorschlag:** einen System-Use-Case «Thema / Ziel automatisch abschliessen» ergänzen oder den zeitgesteuerten Übergang ausdrücklich als Ausnahme der Regel festhalten.

2. **Guard von UC-21 auf zwei Punkte verteilt**
   - **Wo:** `statecharts/Umsetzung.md`, `usecases/UC-21`
   - **Was:** Der Guard heisst «Termin erreicht, Berechtigung für Klassifizierung, Thema / Ziel aktiv, Resultat nicht zwingend». In der Pre-Condition steht er als zwei Punkte.
   - **Vorschlag:** die Pre-Condition zu einer Zeile zusammenfassen.

3. **Statusbegriffe in der Oberfläche**
   - **Wo:** Domänenmodell, alle Umsetzungs-Use-Cases
   - **Was:** Gemäss Entscheid verwenden die Artefakte die Export-Begriffe: «Durchgeführt», «Mit Abweichung durchgeführt», «Verschoben». In Filter und Dialog des Prototyps stehen weiterhin «Erledigt wie geplant», «Erledigt mit Abweichung» und «Neu planen».
   - **Vorschlag:** entscheiden, ob die Oberfläche angeglichen wird.

4. **Mermaid nicht maschinell validiert**
   - **Wo:** alle Diagramme
   - **Was:** Die Syntax ist manuell geprüft: keine runden Klammern in Attributen, Zustands-IDs ohne Leerzeichen. Ein Rendering-Test fehlt.
   - **Vorschlag:** die Diagramme einmal in einem Mermaid-Viewer öffnen.

5. **Lösch-Übergänge nicht eingezeichnet**
   - **Wo:** `statecharts/Umsetzung.md`
   - **Was:** Umsetzungen enden durch UC-06, UC-09, UC-10, UC-24 und UC-25. Das ist nur im Text beschrieben.
   - **Vorschlag:** so belassen oder die Übergänge zu `[*]` einzeichnen.

## Entscheide, die vom Prototyp abweichen

Gemäss Rückfragen beschreiben die Artefakte in diesen Punkten das Soll-Verhalten:

- Nach der ersten bestätigten Umsetzung sind Bezeichnung, Leistungsarten und Gültig ab einer Handlung gesperrt.
- Im Dialog «Handlungen anpassen?» heisst der Button nicht mehr «Nein», sondern «Abbrechen»: Er bricht die Änderung ab.
- Titel einer Disziplin und Name eines Hilfsmittels sind Pflichtfelder mit Meldung unter dem Feld.
- Geplante Dauer und Anz. Personen einer Handlungsvorlage werden auch beim Speichern geprüft.
- Eine Handlungsvorlage im Modus «Tageszeiten» ohne gewählte Tageszeit ergibt eine Fehlermeldung.
- «Ist» zeigt die bei der Bestätigung gespeicherten Werte, nicht die aktuellen Planwerte.
- Umsetzungs-Export und Auswertungen berücksichtigen dieselben Filter wie die Ansicht.

## Änderung «Feste Tageszeiten» (30.10.2026)

Artefakte und Prototyp sind an diese Anforderung angepasst:

- **Tageszeiten:** Sie sind fix (Morgen, Mittag, Nachmittag, Abend, Nacht). Die Einstellung «Tageszeiten» und der frühere UC «Tageszeiten speichern» sind entfernt. Die Use Cases danach sind neu nummeriert, es sind jetzt 44.
- **Zeitangabe:** Die Tageszeit ist optional. Eine Uhrzeit gibt es nur zusammen mit einer Tageszeit, pro Tageszeit sind mehrere Uhrzeiten möglich. Es gibt keine Plausibilisierung der Uhrzeit. Der frühere Uhrzeit-Modus entfällt.
- **Fälligkeit:** Eine Durchführung ist immer am geplanten Datum fällig, auch nachts nach Mitternacht. Der Abschnitt «Nacht (Vortag)» entfällt.
- **Abschnitte der Umsetzung:** Die Reihenfolge ist Ohne Zeitangabe, Nacht, Morgen, Mittag, Nachmittag, Abend.
- **Quittierung:** Bestätigen ist ab der Uhrzeit möglich, ohne Uhrzeit ab Tagesbeginn.
- **Neu planen:** Auch die Tageszeit lässt sich ändern (UC-17, neues Attribut «Neue Tageszeit»).
- **Datenversion:** Sie ist auf 3 erhöht. Bestehende Browserdaten müssen nach dem Login gelöscht werden.

Erneute Prüfung: Alle State-Chart-Transitionen verweisen weiterhin auf UC-03 bis UC-25, deren Nummern unverändert sind. Es gibt keine neuen Befunde.

