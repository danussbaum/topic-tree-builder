# State Chart: Umsetzung

Eine Umsetzung gehört zu einer Durchführung an einem ursprünglich geplanten Datum.

```mermaid
stateDiagram-v2
    state "Offen" as Offen
    state "Durchgeführt" as Durchgefuehrt
    state "Mit Abweichung durchgeführt" as MitAbweichung
    state "Nicht durchgeführt" as NichtDurchgefuehrt
    state "Verschoben" as Verschoben

    [*] --> Offen : UC-08 Handlung erfassen
    [*] --> Offen : UC-22 Handlung nach Bedarf erstellen
    [*] --> Offen : UC-23 Ungeplante Handlung erstellen

    Offen --> Durchgefuehrt : UC-14 Handlung als durchgeführt bestätigen [Termin erreicht, Berechtigung für Klassifizierung, Thema / Ziel aktiv]
    Offen --> MitAbweichung : UC-15 Handlung mit Abweichung bestätigen [Termin erreicht, Berechtigung für Klassifizierung, Thema / Ziel aktiv]
    Offen --> NichtDurchgefuehrt : UC-16 Handlung als nicht durchgeführt bestätigen [Termin erreicht, Berechtigung für Klassifizierung, Thema / Ziel aktiv]
    Offen --> Verschoben : UC-17 Handlung neu planen [Ursprünglicher Termin max. 1 Woche zurück, Berechtigung für Klassifizierung, Thema / Ziel aktiv]
    Offen --> NichtDurchgefuehrt : UC-20 Mehrere Handlungen als nicht durchgeführt bestätigen [Termin erreicht, Berechtigung für Klassifizierung, Thema / Ziel aktiv]
    Offen --> Durchgefuehrt : UC-21 Mehrere Handlungen als durchgeführt bestätigen [Termin erreicht, Berechtigung für Klassifizierung, Thema / Ziel aktiv, Resultat nicht zwingend]

    Verschoben --> Verschoben : UC-17 Handlung neu planen [Ursprünglicher Termin max. 1 Woche zurück, Berechtigung für Klassifizierung, Thema / Ziel aktiv]
    Verschoben --> Durchgefuehrt : UC-14 Handlung als durchgeführt bestätigen [Termin erreicht, Berechtigung für Klassifizierung, Thema / Ziel aktiv]
    Verschoben --> MitAbweichung : UC-15 Handlung mit Abweichung bestätigen [Termin erreicht, Berechtigung für Klassifizierung, Thema / Ziel aktiv]
    Verschoben --> NichtDurchgefuehrt : UC-16 Handlung als nicht durchgeführt bestätigen [Termin erreicht, Berechtigung für Klassifizierung, Thema / Ziel aktiv]
    Verschoben --> NichtDurchgefuehrt : UC-20 Mehrere Handlungen als nicht durchgeführt bestätigen [Termin erreicht, Berechtigung für Klassifizierung, Thema / Ziel aktiv]
    Verschoben --> Durchgefuehrt : UC-21 Mehrere Handlungen als durchgeführt bestätigen [Termin erreicht, Berechtigung für Klassifizierung, Thema / Ziel aktiv, Resultat nicht zwingend]
    Verschoben --> Offen : UC-19 Umsetzung zurücksetzen [Thema / Ziel aktiv]

    Durchgefuehrt --> Durchgefuehrt : UC-18 Umsetzung bearbeiten [Thema / Ziel aktiv]
    MitAbweichung --> MitAbweichung : UC-18 Umsetzung bearbeiten [Thema / Ziel aktiv]
    NichtDurchgefuehrt --> NichtDurchgefuehrt : UC-18 Umsetzung bearbeiten [Thema / Ziel aktiv]
    Durchgefuehrt --> Offen : UC-19 Umsetzung zurücksetzen [Thema / Ziel aktiv]
    MitAbweichung --> Offen : UC-19 Umsetzung zurücksetzen [Thema / Ziel aktiv]
    NichtDurchgefuehrt --> Offen : UC-19 Umsetzung zurücksetzen [Thema / Ziel aktiv]
```

Löschen: Eine Umsetzung endet, wenn ihre Handlung gelöscht wird. Das geschieht in UC-06, UC-09 (Entfernen einer Durchführung), UC-10, UC-24 und UC-25. Weil das aus jedem Zustand möglich ist, sind diese Übergänge zur Lesbarkeit nicht eingezeichnet.
