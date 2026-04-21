import { useMemo, useState } from "react";
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
  Save,
} from "lucide-react";
import { TreeSidebar } from "@/components/assessment/TreeSidebar";
import { NodeEditor } from "@/components/assessment/NodeEditor";
import type { Selection, TopicNode } from "@/types/assessment";

const uid = () => Math.random().toString(36).slice(2, 10);

const seed: TopicNode[] = [
  {
    id: uid(),
    title: "Förderziele KJA",
    notes:
      "Strukturierte Förderziele für die Kinder- und Jugendarbeit, gegliedert nach Leistungstypen und individuellen Massnahmen.",
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
              "Die Aktivierung und Förderung des Systems sowie die Erreichung der gemeinsam erarbeiteten Ziele wurden gemeinsam reflektiert.",
          },
          {
            id: uid(),
            title: "LZ-2 IND-1: Individuelle Kontaktregelung",
            notes:
              "Eine individuelle Kontaktregelung liegt vor und wurde kongruent umgesetzt.",
          },
          {
            id: uid(),
            title: "LZ-3 IND-2: Freizeitgestaltung fördern",
            notes:
              "Ein neues Freizeitprogramm wurde entwickelt und gefördert.",
          },
        ],
      },
    ],
  },
];

const Index = () => {
  const [topics, setTopics] = useState<TopicNode[]>(seed);
  const [selection, setSelection] = useState<Selection | null>({
    kind: "topic",
    topicId: seed[0].id,
  });
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    [seed[0].id]: true,
    [`${seed[0].id}:${seed[0].targets[0].id}`]: true,
  });

  const toggle = (id: string) =>
    setExpanded((e) => ({ ...e, [id]: !e[id] }));

  const addTopic = () => {
    const t: TopicNode = { id: uid(), title: "New Topic", notes: "", targets: [] };
    setTopics((prev) => [...prev, t]);
    setExpanded((e) => ({ ...e, [t.id]: true }));
    setSelection({ kind: "topic", topicId: t.id });
  };

  const addTarget = (topicId: string) => {
    const targetId = uid();
    setTopics((prev) =>
      prev.map((t) =>
        t.id === topicId
          ? {
              ...t,
              targets: [
                ...t.targets,
                { id: targetId, title: "New Target", notes: "", actions: [] },
              ],
            }
          : t,
      ),
    );
    setExpanded((e) => ({ ...e, [topicId]: true, [`${topicId}:${targetId}`]: true }));
    setSelection({ kind: "target", topicId, targetId });
  };

  const addAction = (topicId: string, targetId: string) => {
    const actionId = uid();
    setTopics((prev) =>
      prev.map((t) =>
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
                        { id: actionId, title: "New Action", notes: "" },
                      ],
                    },
              ),
            },
      ),
    );
    setExpanded((e) => ({
      ...e,
      [topicId]: true,
      [`${topicId}:${targetId}`]: true,
    }));
    setSelection({ kind: "action", topicId, targetId, actionId });
  };

  const removeNode = (s: Selection) => {
    setTopics((prev) => {
      if (s.kind === "topic") return prev.filter((t) => t.id !== s.topicId);
      if (s.kind === "target")
        return prev.map((t) =>
          t.id === s.topicId
            ? { ...t, targets: t.targets.filter((tg) => tg.id !== s.targetId) }
            : t,
        );
      return prev.map((t) =>
        t.id !== s.topicId
          ? t
          : {
              ...t,
              targets: t.targets.map((tg) =>
                tg.id !== s.targetId
                  ? tg
                  : { ...tg, actions: tg.actions.filter((a) => a.id !== s.actionId) },
              ),
            },
      );
    });
    if (
      selection &&
      JSON.stringify(selection) === JSON.stringify(s)
    ) {
      setSelection(null);
    }
  };

  const updateNode = (
    field: "title" | "notes",
    value: string,
  ) => {
    if (!selection) return;
    setTopics((prev) =>
      prev.map((t) => {
        if (t.id !== selection.topicId) return t;
        if (selection.kind === "topic") return { ...t, [field]: value };
        return {
          ...t,
          targets: t.targets.map((tg) => {
            if (tg.id !== selection.targetId) return tg;
            if (selection.kind === "target") return { ...tg, [field]: value };
            return {
              ...tg,
              actions: tg.actions.map((a) =>
                a.id !== selection.actionId ? a : { ...a, [field]: value },
              ),
            };
          }),
        };
      }),
    );
  };

  const current = useMemo(() => {
    if (!selection) return null;
    const topic = topics.find((t) => t.id === selection.topicId);
    if (!topic) return null;
    if (selection.kind === "topic") {
      return {
        kindLabel: "Topic",
        breadcrumbs: [topic.title || "Untitled topic"],
        title: topic.title,
        notes: topic.notes,
      };
    }
    const target = topic.targets.find((tg) => tg.id === selection.targetId);
    if (!target) return null;
    if (selection.kind === "target") {
      return {
        kindLabel: "Target",
        breadcrumbs: [topic.title, target.title || "Untitled target"],
        title: target.title,
        notes: target.notes,
      };
    }
    const action = target.actions.find((a) => a.id === selection.actionId);
    if (!action) return null;
    return {
      kindLabel: "Action",
      breadcrumbs: [topic.title, target.title, action.title || "Untitled action"],
      title: action.title,
      notes: action.notes,
    };
  }, [selection, topics]);

  return (
    <div className="min-h-dvh bg-background flex">
      <TreeSidebar
        topics={topics}
        selection={selection}
        expanded={expanded}
        onToggle={toggle}
        onSelect={setSelection}
        onAddTopic={addTopic}
        onAddTarget={addTarget}
        onAddAction={addAction}
        onDelete={removeNode}
      />

      <main className="flex-1 min-w-0 flex flex-col">
        {/* Top tab bar (socialweb style) */}
        <div className="flex items-center bg-topbar text-topbar-foreground border-b border-border h-12 pr-2">
          <nav className="flex items-stretch h-full overflow-x-auto">
            {[
              { label: "Prozesse", icon: Workflow, active: true },
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
            <button className="p-2 rounded hover:bg-secondary text-muted-foreground" aria-label="Help">
              <HelpCircle className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Ribbon toolbar */}
        <div className="flex items-center gap-1 px-3 py-2 bg-secondary/60 border-b border-border">
          <RibbonButton icon={Plus} label="Neu" />
          <RibbonDivider />
          <RibbonButton icon={Filter} label="Filter" />
          <RibbonButton icon={Save} label="Speichern" />
          <RibbonDivider />
          <RibbonButton icon={Printer} label="Drucken" />
          <RibbonButton icon={Download} label="Export" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-background">
          {current ? (
            <NodeEditor
              kindLabel={current.kindLabel}
              breadcrumbs={current.breadcrumbs}
              title={current.title}
              notes={current.notes}
              onTitleChange={(v) => updateNode("title", v)}
              onNotesChange={(v) => updateNode("notes", v)}
            />
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              <p className="text-lg">Wählen Sie einen Knoten in der Baumstruktur.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

function RibbonButton({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <button className="flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded hover:bg-secondary text-foreground/80 hover:text-foreground transition-colors min-w-[64px]">
      <Icon className="h-5 w-5" />
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
}

function RibbonDivider() {
  return <div className="w-px h-10 bg-border mx-1" />;
}

export default Index;
