import { useState } from "react";
import {
  BookOpen,
  CheckSquare,
  Calendar,
  FileText,
  Workflow,
  Files,
  HeartPulse,
  Network,
  Star,
  Users,
  MoreHorizontal,
  HelpCircle,
  Plus,
  Filter,
  Printer,
    Download,
  
  ListTodo,
  ClipboardCheck,
} from "lucide-react";
import { ClientSidebar, ClientSidebarTrigger } from "@/components/assessment/ClientSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AssessmentOutline } from "@/components/assessment/AssessmentOutline";
import type { ActionNode, Client, TopicNode } from "@/types/assessment";
import { cn } from "@/lib/utils";

const uid = () => Math.random().toString(36).slice(2, 10);

interface ClientNameInputProps {
  value: string;
  label: string;
  onChange: (value: string) => void;
}

const ClientNameInput = ({ value, label, onChange }: ClientNameInputProps) => (
  <span className="relative inline-block align-baseline">
    <span
      className="invisible whitespace-pre text-2xl font-semibold"
      aria-hidden="true"
    >
      {value || " "}
    </span>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className="absolute inset-0 w-full min-w-0 text-2xl font-semibold bg-transparent border-0 outline-none focus:ring-0 px-0"
    />
  </span>
);

const hasVisibleConfirmationItems = (
  client: Client,
  selectedDate: string,
  showConfirmed: boolean,
) => {
  return getVisibleConfirmationItems(client, selectedDate, showConfirmed).length > 0;
};

const getVisibleConfirmationItems = (
  client: Client,
  selectedDate: string,
  showConfirmed: boolean,
) => {
  const selDate = new Date(selectedDate);
  const items: Array<{
    topic: TopicNode;
    target: { id: string; title: string; notes: string };
    action: ActionNode;
  }> = [];

  client.topics.forEach((topic) => {
    topic.targets.forEach((target) => {
      target.actions.forEach((action) => {
        if (action.validFrom && new Date(action.validFrom) > selDate) return;
        if (action.validTo && new Date(action.validTo) < selDate) return;

        const status = action.confirmations?.[selectedDate]?.status || "open";
        if (!showConfirmed && status !== "open") return;

        items.push({ topic, target, action });
      });
    });
  });

  return items;
};

const seedClients: Client[] = [
  {
    id: uid(),
    firstName: "Anna",
    lastName: "Müller",
    topics: [
      {
        id: uid(),
        title: "Förderziele KJA",
        notes:
          "Strukturierte Förderziele für die Kinder- und Jugendarbeit, gegliedert nach Leistungstypen und individuellen Handlungn.",
        targets: [
          {
            id: uid(),
            title: "Betreuung und Wohnen 2025",
            notes:
              "Die Erreichung der gemeinsam erarbeiteten Ziele wird durch die beteiligten Personen beurteilt.",
            actions: [
              {
                id: uid(),
                title: "LZ-1 IND-2: Ressourcen aktivieren",
                notes:
                  "Die Aktivierung und Förderung des Systems wurde gemeinsam reflektiert.",
                plannedMinutes: 45,
                actualMinutes: 60,
                reason: "Gespräch mit Familie länger als geplant.",
                status: "done_with_deviation",
                done: true,
              },
              {
                id: uid(),
                title: "LZ-2 IND-1: Individuelle Kontaktregelung",
                notes:
                  "Eine individuelle Kontaktregelung liegt vor und wurde kongruent umgesetzt.",
                plannedMinutes: 30,
                status: "open",
                done: false,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: uid(),
    firstName: "Lukas",
    lastName: "Bachmann",
    topics: [
      {
        id: uid(),
        title: "Tagesstruktur",
        notes: "Aufbau einer stabilen Tages- und Wochenstruktur.",
        targets: [
          {
            id: uid(),
            title: "Schule und Ausbildung",
            notes: "Regelmässiger Schulbesuch und Lerncoaching.",
            actions: [],
          },
        ],
      },
    ],
  },
  { id: uid(), firstName: "Sara", lastName: "Keller", topics: [] },
  { id: uid(), firstName: "Marco", lastName: "Schneider", topics: [] },
];

const Index = () => {
  const [viewMode, setViewMode] = useState<"planning" | "confirmation">("planning");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [clients, setClients] = useState<Client[]>(seedClients);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([
    seedClients[0].id,
  ]);
  const [showConfirmed, setShowConfirmed] = useState(false);

  const selectedClients = clients.filter((c) => selectedClientIds.includes(c.id));
  const visibleSelectedClients =
    viewMode === "confirmation"
      ? selectedClients.filter((client) =>
          hasVisibleConfirmationItems(client, selectedDate, showConfirmed),
        )
      : selectedClients;

  const toggleClient = (id: string) => {
    setSelectedClientIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleAllClients = () => {
    setSelectedClientIds((prev) => {
      const clientIds = clients.map((c) => c.id);
      const allSelected =
        clientIds.length > 0 && clientIds.every((id) => prev.includes(id));

      return allSelected ? [] : clientIds;
    });
  };

  const updateClientTopicsFor = (
    clientId: string,
    fn: (topics: TopicNode[]) => TopicNode[],
  ) => {
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, topics: fn(c.topics) } : c)),
    );
  };

  const addClient = () => {
    const c: Client = {
      id: uid(),
      firstName: "Neu",
      lastName: "Klient/in",
      topics: [],
    };
    setClients((prev) => [...prev, c]);
    setSelectedClientIds((prev) => [...prev, c.id]);
  };

  const addTopic = (clientId: string) => {
    updateClientTopicsFor(clientId, (topics) => [
      ...topics,
      { id: uid(), title: "", notes: "", targets: [] },
    ]);
  };

  const addTarget = (clientId: string, topicId: string) => {
    updateClientTopicsFor(clientId, (topics) =>
      topics.map((t) =>
        t.id === topicId
          ? {
              ...t,
              targets: [
                ...t.targets,
                { id: uid(), title: "", notes: "", actions: [] },
              ],
            }
          : t,
      ),
    );
  };

  const addAction = (clientId: string, topicId: string, targetId: string) => {
    updateClientTopicsFor(clientId, (topics) =>
      topics.map((t) =>
        t.id !== topicId
          ? t
          : {
              ...t,
              targets: t.targets.map((tg) =>
                tg.id !== targetId
                  ? tg
                  : {
                      ...tg,
                      actions: [
                        ...tg.actions,
                        {
                          id: uid(),
                          title: "",
                          notes: "",
                          status: "open",
                          done: false,
                          validFrom: new Date().toISOString().slice(0, 10),
                        },
                      ],
                    },
              ),
            },
      ),
    );
  };

  const updateTopic = (
    clientId: string,
    topicId: string,
    field: "title" | "notes",
    value: string,
  ) => {
    updateClientTopicsFor(clientId, (topics) =>
      topics.map((t) => (t.id === topicId ? { ...t, [field]: value } : t)),
    );
  };

  const updateTarget = (
    clientId: string,
    topicId: string,
    targetId: string,
    field: "title" | "notes",
    value: string,
  ) => {
    updateClientTopicsFor(clientId, (topics) =>
      topics.map((t) =>
        t.id !== topicId
          ? t
          : {
              ...t,
              targets: t.targets.map((tg) =>
                tg.id === targetId ? { ...tg, [field]: value } : tg,
              ),
            },
      ),
    );
  };

  const updateAction = (
    clientId: string,
    topicId: string,
    targetId: string,
    actionId: string,
    field: "title" | "notes" | "requiredResources",
    value: string,
  ) => {
    updateClientTopicsFor(clientId, (topics) =>
      topics.map((t) =>
        t.id !== topicId
          ? t
          : {
              ...t,
              targets: t.targets.map((tg) =>
                tg.id !== targetId
                  ? tg
                  : {
                      ...tg,
                      actions: tg.actions.map((a) =>
                        a.id === actionId ? { ...a, [field]: value } : a,
                      ),
                    },
              ),
            },
      ),
    );
  };

  const updateActionField = (
    clientId: string,
    topicId: string,
    targetId: string,
    actionId: string,
    field:
      | "plannedMinutes"
      | "requiredPersons"
      | "resultRequirement"
      | "actualMinutes"
      | "reason"
      | "dayPart"
      | "validFrom"
      | "validTo"
      | "observations",
    value: number | string | undefined,
  ) => {
    updateClientTopicsFor(clientId, (topics) =>
      topics.map((t) =>
        t.id !== topicId
          ? t
          : {
              ...t,
              targets: t.targets.map((tg) =>
                tg.id !== targetId
                  ? tg
                  : {
                      ...tg,
                      actions: tg.actions.map((a) =>
                        a.id === actionId ? { ...a, [field]: value } : a,
                      ),
                    },
              ),
            },
      ),
    );
  };

  const confirmAction = (
    clientId: string,
    topicId: string,
    targetId: string,
    actionId: string,
    payload:
      | { status: "done_as_planned"; result?: string; observations?: string }
      | { status: "done_with_deviation"; actualMinutes: number; reason: string; result?: string; observations?: string }
      | { status: "not_done"; reason: string }
      | { status: "open" },
    date?: string,
  ) => {
    updateClientTopicsFor(clientId, (topics) =>
      topics.map((t) =>
        t.id !== topicId
          ? t
          : {
              ...t,
              targets: t.targets.map((tg) =>
                tg.id !== targetId
                  ? tg
                  : {
                      ...tg,
                      actions: tg.actions.map((a) => {
                        if (a.id !== actionId) return a;
                        if (!date) return a;

                        const nextConfirmations = { ...(a.confirmations || {}) };

                        if (payload.status === "open") {
                          delete nextConfirmations[date];
                        } else if (payload.status === "done_as_planned") {
                          nextConfirmations[date] = {
                            status: "done_as_planned",
                            done: true,
                            actualMinutes: a.plannedMinutes,
                            result: payload.result,
                            observations: payload.observations,
                          };
                        } else if (payload.status === "done_with_deviation") {
                          nextConfirmations[date] = {
                            status: "done_with_deviation",
                            done: true,
                            actualMinutes: payload.actualMinutes,
                            reason: payload.reason,
                            result: payload.result,
                            observations: payload.observations,
                          };
                        } else if (payload.status === "not_done") {
                          nextConfirmations[date] = {
                            status: "not_done",
                            done: true,
                            reason: payload.reason,
                          };
                        }

                        return { ...a, confirmations: nextConfirmations };
                      }),
                    },
              ),
            },
      ),
    );
  };

  const deleteTopic = (clientId: string, topicId: string) =>
    updateClientTopicsFor(clientId, (topics) => topics.filter((t) => t.id !== topicId));

  const deleteTarget = (clientId: string, topicId: string, targetId: string) =>
    updateClientTopicsFor(clientId, (topics) =>
      topics.map((t) =>
        t.id !== topicId
          ? t
          : { ...t, targets: t.targets.filter((tg) => tg.id !== targetId) },
      ),
    );

  const deleteAction = (
    clientId: string,
    topicId: string,
    targetId: string,
    actionId: string,
  ) =>
    updateClientTopicsFor(clientId, (topics) =>
      topics.map((t) =>
        t.id !== topicId
          ? t
          : {
              ...t,
              targets: t.targets.map((tg) =>
                tg.id !== targetId
                  ? tg
                  : { ...tg, actions: tg.actions.filter((a) => a.id !== actionId) },
              ),
            },
      ),
    );

  const updateClientName = (
    clientId: string,
    field: "firstName" | "lastName",
    value: string,
  ) => {
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, [field]: value } : c)),
    );
  };

  const shiftDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const exportConfirmationExcel = () => {
    if (viewMode !== "confirmation") return;

    const rows = selectedClients.flatMap((client) =>
      getVisibleConfirmationItems(client, selectedDate, showConfirmed).map(
        ({ topic, target, action }) => {
          const confirmation = action.confirmations?.[selectedDate];
          const status = confirmation?.status || "open";

          return {
            Datum: selectedDate,
            "Klient/in": `${client.firstName} ${client.lastName}`.trim(),
            Schwerpunkt: topic.title,
            Ziel: target.title,
            Handlung: action.title,
            Beschreibung: action.notes,
            Hilfsmittel: action.requiredResources ?? "",
            Status:
              status === "done_as_planned"
                ? "Wie geplant durchgeführt"
                : status === "done_with_deviation"
                  ? "Mit Abweichung durchgeführt"
                  : status === "not_done"
                    ? "Nicht durchgeführt"
                    : "Offen",
            Grund: confirmation?.reason ?? "",
            Resultat: confirmation?.result ?? "",
            Beobachtungen: confirmation?.observations ?? "",
            "Gültig ab": action.validFrom ?? "",
            "Gültig bis": action.validTo ?? "",
            "Tageszeit": action.dayPart ?? "",
            "Minuten geplant": action.plannedMinutes ?? "",
            "Minuten tatsächlich": confirmation?.actualMinutes ?? "",
          };
        },
      ),
    );

    const allHeaders = [
      "Datum",
      "Klient/in",
      "Schwerpunkt",
      "Ziel",
      "Handlung",
      "Beschreibung",
      "Hilfsmittel",
      "Status",
      "Grund",
      "Resultat",
      "Beobachtungen",
      "Gültig ab",
      "Gültig bis",
      "Tageszeit",
      "Minuten geplant",
      "Minuten tatsächlich",
    ];

    const escapeXml = (value: string | number) =>
      String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&apos;");

    const columnRef = (columnIndex: number) => {
      let value = "";
      let current = columnIndex + 1;
      while (current > 0) {
        const remainder = (current - 1) % 26;
        value = String.fromCharCode(65 + remainder) + value;
        current = Math.floor((current - 1) / 26);
      }
      return value;
    };

    const toWorksheetRow = (values: (string | number)[], rowIndex: number) =>
      `<row r="${rowIndex}">${values
        .map(
          (value, colIndex) =>
            `<c r="${columnRef(colIndex)}${rowIndex}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`,
        )
        .join("")}</row>`;

    const sheetData = [
      toWorksheetRow(allHeaders, 1),
      ...rows.map((row, index) =>
        toWorksheetRow(
          allHeaders.map((header) => row[header as keyof typeof row] ?? ""),
          index + 2,
        ),
      ),
    ].join("");

    const worksheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${sheetData}</sheetData>
</worksheet>`;

    const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Bestätigungen" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`;

    const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

    const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="1"><fill><patternFill patternType="none"/></fill></fills>
  <borders count="1"><border/></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

    const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

    const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

    const buildXlsxBlob = (files: Array<{ path: string; content: string }>) => {
      const encoder = new TextEncoder();
      const crcTable = new Uint32Array(256).map((_, n) => {
        let c = n;
        for (let k = 0; k < 8; k += 1) {
          c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        }
        return c >>> 0;
      });

      const crc32 = (data: Uint8Array) => {
        let crc = 0xffffffff;
        for (const byte of data) {
          crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
        }
        return (crc ^ 0xffffffff) >>> 0;
      };

      const writeUint16 = (view: DataView, offset: number, value: number) =>
        view.setUint16(offset, value, true);
      const writeUint32 = (view: DataView, offset: number, value: number) =>
        view.setUint32(offset, value, true);

      const localParts: Uint8Array[] = [];
      const centralParts: Uint8Array[] = [];
      let localOffset = 0;

      files.forEach(({ path, content }) => {
        const nameBytes = encoder.encode(path);
        const fileBytes = encoder.encode(content);
        const crc = crc32(fileBytes);

        const localHeader = new Uint8Array(30 + nameBytes.length);
        const localView = new DataView(localHeader.buffer);
        writeUint32(localView, 0, 0x04034b50);
        writeUint16(localView, 4, 20);
        writeUint16(localView, 6, 0);
        writeUint16(localView, 8, 0);
        writeUint16(localView, 10, 0);
        writeUint16(localView, 12, 0);
        writeUint32(localView, 14, crc);
        writeUint32(localView, 18, fileBytes.length);
        writeUint32(localView, 22, fileBytes.length);
        writeUint16(localView, 26, nameBytes.length);
        writeUint16(localView, 28, 0);
        localHeader.set(nameBytes, 30);

        const centralHeader = new Uint8Array(46 + nameBytes.length);
        const centralView = new DataView(centralHeader.buffer);
        writeUint32(centralView, 0, 0x02014b50);
        writeUint16(centralView, 4, 20);
        writeUint16(centralView, 6, 20);
        writeUint16(centralView, 8, 0);
        writeUint16(centralView, 10, 0);
        writeUint16(centralView, 12, 0);
        writeUint16(centralView, 14, 0);
        writeUint32(centralView, 16, crc);
        writeUint32(centralView, 20, fileBytes.length);
        writeUint32(centralView, 24, fileBytes.length);
        writeUint16(centralView, 28, nameBytes.length);
        writeUint16(centralView, 30, 0);
        writeUint16(centralView, 32, 0);
        writeUint16(centralView, 34, 0);
        writeUint16(centralView, 36, 0);
        writeUint32(centralView, 38, 0);
        writeUint32(centralView, 42, localOffset);
        centralHeader.set(nameBytes, 46);

        localParts.push(localHeader, fileBytes);
        centralParts.push(centralHeader);
        localOffset += localHeader.length + fileBytes.length;
      });

      const centralDirectorySize = centralParts.reduce((sum, part) => sum + part.length, 0);
      const endRecord = new Uint8Array(22);
      const endView = new DataView(endRecord.buffer);
      writeUint32(endView, 0, 0x06054b50);
      writeUint16(endView, 4, 0);
      writeUint16(endView, 6, 0);
      writeUint16(endView, 8, files.length);
      writeUint16(endView, 10, files.length);
      writeUint32(endView, 12, centralDirectorySize);
      writeUint32(endView, 16, localOffset);
      writeUint16(endView, 20, 0);

      return new Blob([...localParts, ...centralParts, endRecord], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
    };

    const blob = buildXlsxBlob([
      { path: "[Content_Types].xml", content: contentTypesXml },
      { path: "_rels/.rels", content: rootRelsXml },
      { path: "xl/workbook.xml", content: workbookXml },
      { path: "xl/_rels/workbook.xml.rels", content: workbookRelsXml },
      { path: "xl/styles.xml", content: stylesXml },
      { path: "xl/worksheets/sheet1.xml", content: worksheetXml },
    ]);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bestaetigungen_${selectedDate}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <SidebarProvider>
      <div className="min-h-dvh bg-background flex w-full">
        <ClientSidebar
          clients={clients}
          selectedClientIds={selectedClientIds}
          onToggleClient={toggleClient}
          onToggleAllClients={toggleAllClients}
          onAddClient={addClient}
        />

        <main className="flex-1 min-w-0 flex flex-col">
          {/* Top tab bar */}
          <div className="flex items-center bg-topbar text-topbar-foreground border-b border-border h-12 pr-2">
            <nav className="flex items-stretch h-full overflow-x-auto">
              {[
                { label: "Handlungsplanung", icon: Workflow, active: true },
                { label: "Journal", icon: BookOpen },
                { label: "Aufgaben", icon: CheckSquare },
                { label: "Termine", icon: Calendar },
                { label: "Texte", icon: FileText },
                { label: "Dateien", icon: Files },
                { label: "Pflege", icon: HeartPulse },
                { label: "Systeme", icon: Network },
                { label: "Bewertungen", icon: Star },
                { label: "Kontakte", icon: Users },
                { label: "Weitere", icon: MoreHorizontal },
              ].map((t) => (
                <button
                  key={t.label}
                  className={
                    "px-4 text-xs font-semibold uppercase tracking-wide flex items-center gap-2 border-r border-border transition-colors " +
                    (t.active
                      ? "bg-topbar-active text-topbar-active-foreground"
                      : "hover:bg-secondary")
                  }
                >
                  <t.icon className="h-4 w-4" />
                  {t.label}
                </button>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-1 pl-2">
              <button
                className="p-2 rounded hover:bg-secondary text-muted-foreground"
                aria-label="Hilfe"
              >
                <HelpCircle className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Ribbon toolbar */}
          <div className="flex items-center gap-1 px-3 py-2 bg-secondary/60 border-b border-border">
            <div className="flex items-center gap-1 pr-2 border-r border-border mr-1">
              <ClientSidebarTrigger />
            </div>
            <RibbonButton
              icon={Plus}
              label="Neuer Schwerpunkt"
              disabled={selectedClients.length !== 1 || viewMode === "confirmation"}
              onClick={() => {
                if (selectedClients[0]) addTopic(selectedClients[0].id);
              }}
            />
            <RibbonDivider />
            <div className="flex items-center gap-1 bg-background/50 p-1 rounded-md border border-border">
              <button
                onClick={() => setViewMode("planning")}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors",
                  viewMode === "planning"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <ListTodo className="h-4 w-4" />
                Planung
              </button>
              <button
                onClick={() => setViewMode("confirmation")}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors",
                  viewMode === "confirmation"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <ClipboardCheck className="h-4 w-4" />
                Bestätigung
              </button>
            </div>
            <RibbonDivider />
            <RibbonButton icon={Filter} label="Filter" />
            <RibbonDivider />
            <RibbonButton icon={Printer} label="Drucken" />
            <RibbonButton
              icon={Download}
              label="Export"
              onClick={exportConfirmationExcel}
              disabled={viewMode !== "confirmation"}
            />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto bg-background">
            {selectedClients.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <p className="text-lg">Wählen Sie eine oder mehrere Klient/innen in der Navigation.</p>
              </div>
            ) : (
              <div className="px-6 lg:px-10 py-6 max-w-4xl mx-auto space-y-10">
                {viewMode === "confirmation" && (
                  <div className="flex items-center justify-between bg-secondary/30 p-4 rounded-lg border border-border sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                      <h2 className="text-xl font-semibold">Tagesbestätigung</h2>
                      <div className="flex items-center gap-1 bg-background border border-border rounded-md p-1">
                        <button
                          className="h-8 w-8 inline-flex items-center justify-center rounded hover:bg-secondary"
                          onClick={() => shiftDate(-1)}
                          aria-label="Vorheriger Tag"
                        >
                          ‹
                        </button>
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="bg-transparent text-sm px-2 py-1 outline-none"
                        />
                        <button
                          className="h-8 w-8 inline-flex items-center justify-center rounded hover:bg-secondary"
                          onClick={() => shiftDate(1)}
                          aria-label="Nächster Tag"
                        >
                          ›
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={showConfirmed}
                          onChange={(e) => setShowConfirmed(e.target.checked)}
                          className="h-4 w-4 rounded border-border accent-primary"
                        />
                        Bestätigte anzeigen
                      </label>
                    </div>
                  </div>
                )}

                {visibleSelectedClients.map((client) => (
                  <section key={client.id} className="space-y-6">
                    {/* Client header */}
                    <div className="flex items-center gap-4 pb-5 border-b border-border">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-0">
                          <ClientNameInput
                            value={client.firstName}
                            label="Vorname"
                            onChange={(value) => updateClientName(client.id, "firstName", value)}
                          />
                          <span
                            className="whitespace-pre text-2xl font-semibold"
                            aria-hidden="true"
                          >
                            {" "}
                          </span>
                          <ClientNameInput
                            value={client.lastName}
                            label="Nachname"
                            onChange={(value) => updateClientName(client.id, "lastName", value)}
                          />
                        </div>
                      </div>
                    </div>

                    <AssessmentOutline
                      viewMode={viewMode}
                      selectedDate={selectedDate}
                      onSelectedDateChange={setSelectedDate}
                      topics={client.topics}
                      hideConfirmationHeader
                      showConfirmed={showConfirmed}
                      onUpdateTopic={(topicId, field, value) =>
                        updateTopic(client.id, topicId, field, value)
                      }
                      onUpdateTarget={(topicId, targetId, field, value) =>
                        updateTarget(client.id, topicId, targetId, field, value)
                      }
                      onUpdateAction={(topicId, targetId, actionId, field, value) =>
                        updateAction(client.id, topicId, targetId, actionId, field, value)
                      }
                      onUpdateActionField={(topicId, targetId, actionId, field, value) =>
                        updateActionField(client.id, topicId, targetId, actionId, field, value)
                      }
                      onConfirmAction={(topicId, targetId, actionId, payload, date) =>
                        confirmAction(client.id, topicId, targetId, actionId, payload, date)
                      }
                      onAddTopic={() => addTopic(client.id)}
                      onAddTarget={(topicId) => addTarget(client.id, topicId)}
                      onAddAction={(topicId, targetId) => addAction(client.id, topicId, targetId)}
                      onDeleteTopic={(topicId) => deleteTopic(client.id, topicId)}
                      onDeleteTarget={(topicId, targetId) =>
                        deleteTarget(client.id, topicId, targetId)
                      }
                      onDeleteAction={(topicId, targetId, actionId) =>
                        deleteAction(client.id, topicId, targetId, actionId)
                      }
                    />
                  </section>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

function RibbonButton({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded hover:bg-secondary text-foreground/80 hover:text-foreground transition-colors min-w-[64px] disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-foreground/80 disabled:cursor-not-allowed"
    >
      <Icon className="h-5 w-5" />
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
}

function RibbonDivider() {
  return <div className="w-px h-10 bg-border mx-1" />;
}

export default Index;
