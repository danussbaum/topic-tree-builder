import { useMemo, useState } from "react";
import { Sprout } from "lucide-react";
import { TreeSidebar } from "@/components/assessment/TreeSidebar";
import { NodeEditor } from "@/components/assessment/NodeEditor";
import type { Selection, TopicNode } from "@/types/assessment";

const uid = () => Math.random().toString(36).slice(2, 10);

const seed: TopicNode[] = [
  {
    id: uid(),
    title: "Alpine Meadows",
    notes:
      "Detailed observations on the unique flora found in high-altitude alpine environments.",
    targets: [
      {
        id: uid(),
        title: "Edelweiss Bloom Cycle",
        notes: "Tracking the conditions and timing that influence blooming.",
        actions: [
          {
            id: uid(),
            title: "Monitor soil pH levels",
            notes: "Average pH is 5.5–6.0; requires good drainage.",
          },
          {
            id: uid(),
            title: "Record peak bloom date",
            notes: "Peak bloom observed July 15th in 2023.",
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

      <main className="flex-1 min-w-0">
        <header className="border-b border-border bg-card/60 backdrop-blur px-8 py-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
            <Sprout className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-serif text-xl font-bold text-primary leading-none">
              Flora Archivist
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Hierarchical assessment workspace
            </p>
          </div>
        </header>

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
            <p className="font-serif text-lg">Select a node from the tree to begin.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
