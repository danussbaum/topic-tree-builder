# State Chart: Thema / Ziel

```mermaid
stateDiagram-v2
    [*] --> Aktiv : UC-03 Thema / Ziel erstellen
    Aktiv --> Abgeschlossen : UC-05 Gültig bis des Themas / Ziels ändern [Neues Gültig bis liegt vor heute]
    Abgeschlossen --> Aktiv : UC-07 Thema / Ziel wieder aktivieren
    Aktiv --> [*] : UC-06 Thema / Ziel löschen
```

Ein Thema / Ziel wechselt auch ohne Benutzeraktion von «Aktiv» zu «Abgeschlossen», sobald das Gültig bis vor dem heutigen Datum liegt. Dazu gibt es keinen Use Case (siehe Konsistenzprüfung).
