import {
  Calendar,
  FileText,
  Workflow,
  Files,
  HeartPulse,
  Star,
  ClipboardCheck,
  Users,
  KeyRound,
  CalendarClock,
  CalendarRange,
  ClockIcon,
  Wallet,
  Receipt,
  Settings as SettingsIcon,
  Tags,
  MessageSquare,
  Printer,
  ShieldCheck,
  Network,
  type LucideIcon,
} from "lucide-react";

export interface SettingsLink {
  label: string;
  href?: string;
}

export interface SettingsCategory {
  id: string;
  title: string;
  icon: LucideIcon;
  links: SettingsLink[];
}

/**
 * Categories displayed in the settings page, grouped to roughly match
 * the original three-column layout of the reference screen.
 */
export const settingsCategories: SettingsCategory[] = [
  // Column 1
  { id: "termine", title: "Termine", icon: Calendar, links: [{ label: "Vorlagen" }] },
  { id: "texte", title: "Texte", icon: FileText, links: [{ label: "Vorlagen" }] },
  {
    id: "prozesse",
    title: "Prozesse",
    icon: Workflow,
    links: [
      { label: "Prozesse" },
      { label: "Prozessphasen" },
      { label: "Prozessschritte" },
    ],
  },
  { id: "dateien", title: "Dateien", icon: Files, links: [{ label: "Vorlagen" }] },
  {
    id: "pflege",
    title: "Pflege",
    icon: HeartPulse,
    links: [
      { label: "Pflegeformulare" },
      { label: "Massnahmen-Gruppen" },
      { label: "Arzneiformen" },
    ],
  },
  { id: "bewertungen", title: "Bewertungen", icon: Star, links: [{ label: "Vorlagen" }] },
  {
    id: "anwesenheiten",
    title: "Anwesenheiten",
    icon: ClipboardCheck,
    links: [
      { label: "Angebote" },
      { label: "Angebots-Gruppen" },
      { label: "Anwesenheitsarten" },
      { label: "Slots" },
      { label: "Reservations-Vorlagen" },
      { label: "AMM-Vorlagen" },
    ],
  },
  { id: "systeme", title: "Systeme", icon: Network, links: [{ label: "Beziehungen" }] },
  { id: "kontakte", title: "Kontakte", icon: Users, links: [{ label: "Stammdaten-Gruppen" }] },
  { id: "schluessel", title: "Schlüssel", icon: KeyRound, links: [{ label: "Schlüssel-Gruppen" }] },

  // Column 2
  {
    id: "planung-meta",
    title: "Planung, Zeiterfassung & Arbeitszeit",
    icon: CalendarClock,
    links: [
      { label: "Arbeitsarten" },
      { label: "Funktionen" },
      { label: "Feiertage & Betriebsferien" },
    ],
  },
  {
    id: "planung",
    title: "Planung",
    icon: CalendarRange,
    links: [
      { label: "Pläne" },
      { label: "Planungs-Gruppen" },
      { label: "Dienst-Gruppen" },
      { label: "Allgemeine Dienste" },
      { label: "Akzentfarben" },
    ],
  },
  {
    id: "zeiterfassung",
    title: "Zeiterfassung & Arbeitszeit",
    icon: ClockIcon,
    links: [
      { label: "Auswertungs-Gruppen" },
      { label: "Kontingente" },
      { label: "Zeitgutschriften" },
      { label: "Zulagen" },
    ],
  },
  {
    id: "kassabuch",
    title: "Kassabuch & Leistungen",
    icon: Wallet,
    links: [
      { label: "Kassabücher" },
      { label: "Konten" },
      { label: "Leistungs-Gruppen" },
      { label: "Leistungsarten" },
    ],
  },
  {
    id: "rechnungen",
    title: "Rechnungen",
    icon: Receipt,
    links: [
      { label: "Vorlagen" },
      { label: "Allgemeine Tarife" },
      { label: "Einzahlungsscheine" },
      { label: "Mahnungen" },
    ],
  },

  // Column 3
  {
    id: "global",
    title: "Globale Einstellungen",
    icon: SettingsIcon,
    links: [
      { label: "Basiseinstellungen" },
      { label: "Schnittstellen" },
      { label: "Variablen" },
      { label: "Textbausteine" },
      { label: "Links" },
      { label: "Datenaufbewahrung" },
      { label: "Lizenzierte Module" },
    ],
  },
  {
    id: "kategorien",
    title: "Kategorien & Markierungen",
    icon: Tags,
    links: [
      { label: "Gruppierungen" },
      { label: "Kategorien" },
      { label: "Markierungen" },
    ],
  },
  {
    id: "nachrichten",
    title: "Nachrichten",
    icon: MessageSquare,
    links: [
      { label: "Nachrichten-Gruppen" },
      { label: "Verteilerlisten" },
    ],
  },
  {
    id: "drucken",
    title: "Drucken",
    icon: Printer,
    links: [
      { label: "Druckvorlagen" },
      { label: "Schriftarten" },
    ],
  },
  {
    id: "sicherheit",
    title: "Sicherheit",
    icon: ShieldCheck,
    links: [
      { label: "Benutzer/innen" },
      { label: "Benutzer/innen-Gruppen" },
      { label: "Rollen" },
      { label: "Klassifizierungen" },
      { label: "Sicherheitseinstellungen" },
      { label: "Sicherheitsprotokoll" },
      { label: "Client Zertifikate" },
    ],
  },
];

/**
 * Distribute categories across the three columns roughly matching
 * the reference layout.
 */
export const getSettingsColumns = (): SettingsCategory[][] => {
  const ids = settingsCategories.reduce<Record<string, SettingsCategory>>((acc, c) => {
    acc[c.id] = c;
    return acc;
  }, {});

  const col1Ids = [
    "termine",
    "texte",
    "prozesse",
    "dateien",
    "pflege",
    "bewertungen",
    "anwesenheiten",
    "systeme",
    "kontakte",
    "schluessel",
  ];
  const col2Ids = ["planung-meta", "planung", "zeiterfassung", "kassabuch", "rechnungen"];
  const col3Ids = ["global", "kategorien", "nachrichten", "drucken", "sicherheit"];

  return [
    col1Ids.map((id) => ids[id]).filter(Boolean),
    col2Ids.map((id) => ids[id]).filter(Boolean),
    col3Ids.map((id) => ids[id]).filter(Boolean),
  ];
};

/**
 * Sidebar grouping (left navigation). Mirrors the secondary nav in the screenshot.
 */
export const settingsSidebarGroups: { id: string; label: string }[] = [
  { id: "global", label: "Globale Einstellungen" },
  { id: "kategorien", label: "Kategorien & Markierungen" },
  { id: "termine", label: "Termine" },
  { id: "texte", label: "Texte" },
  { id: "prozesse", label: "Prozesse" },
  { id: "dateien", label: "Dateien" },
  { id: "pflege", label: "Pflege" },
  { id: "bewertungen", label: "Bewertungen" },
  { id: "anwesenheiten", label: "Anwesenheiten" },
  { id: "systeme", label: "Systeme" },
  { id: "kontakte", label: "Kontakte" },
  { id: "schluessel", label: "Schlüssel" },
  { id: "planung-meta", label: "Planung, Zeiterfassung & Arbei…" },
  { id: "planung", label: "Planung" },
  { id: "zeiterfassung", label: "Zeiterfassung & Arbeitszeit" },
  { id: "kassabuch", label: "Kassabuch & Leistungen" },
  { id: "rechnungen", label: "Rechnungen" },
  { id: "nachrichten", label: "Nachrichten" },
  { id: "drucken", label: "Drucken" },
];
