import { ChevronRight, Plus, Trash2 } from "lucide-react";
import type { TopicNode } from "@/types/assessment";
import { cn } from "@/lib/utils";

type Selection =
  | { kind: "topic"; topicId: string }
  | { kind: "target"; topicId: string; targetId: string }
  | { kind: "action"; topicId: string; targetId: string; actionId: string };

interface Props {
  topics: TopicNode[];
  selection: Selection | null;
  expanded: Record<string, boolean>;
  onToggle: (id: string) => void;
  onSelect: (s: Selection) => void;
  onAddTopic: () => void;
  onAddTarget: (topicId: string) => void;
  onAddAction: (topicId: string, targetId: string) => void;
  onDelete: (s: Selection) => void;
}

export function TreeSidebar({
  topics,
  selection,
  expanded,
  onToggle,
  onSelect,
  onAddTopic,
  onAddTarget,
  onAddAction,
  onDelete,
}: Props) {
  const isSelected = (s: Selection) =>
    selection &&
    selection.kind === s.kind &&
    JSON.stringify(selection) === JSON.stringify(s);

  return (
    <aside className="w-72 shrink-0 border-r border-border bg-secondary/30 h-dvh sticky top-0 overflow-y-auto">
      <div className="p-5 border-b border-border">
        <h2 className="font-serif text-lg font-bold text-primary">Assessment Tree</h2>
        <p className="text-xs text-muted-foreground mt-1">Topics → Targets → Actions</p>
      </div>

      <div className="p-3 space-y-1">
        {topics.map((topic) => {
          const topicOpen = expanded[topic.id];
          return (
            <div key={topic.id}>
              <Row
                selected={!!isSelected({ kind: "topic", topicId: topic.id })}
                onClick={() => onSelect({ kind: "topic", topicId: topic.id })}
                onToggle={() => onToggle(topic.id)}
                open={topicOpen}
                hasChildren
                title={topic.title || "Untitled topic"}
                level={0}
                onAdd={() => {
                  onAddTarget(topic.id);
                }}
                onDelete={() => onDelete({ kind: "topic", topicId: topic.id })}
              />
              {topicOpen && (
                <div className="ml-2 border-l border-border/70 pl-1">
                  {topic.targets.map((target) => {
                    const tKey = `${topic.id}:${target.id}`;
                    const targetOpen = expanded[tKey];
                    return (
                      <div key={target.id}>
                        <Row
                          selected={
                            !!isSelected({
                              kind: "target",
                              topicId: topic.id,
                              targetId: target.id,
                            })
                          }
                          onClick={() =>
                            onSelect({
                              kind: "target",
                              topicId: topic.id,
                              targetId: target.id,
                            })
                          }
                          onToggle={() => onToggle(tKey)}
                          open={targetOpen}
                          hasChildren
                          title={target.title || "Untitled target"}
                          level={1}
                          onAdd={() => onAddAction(topic.id, target.id)}
                          onDelete={() =>
                            onDelete({
                              kind: "target",
                              topicId: topic.id,
                              targetId: target.id,
                            })
                          }
                        />
                        {targetOpen && (
                          <div className="ml-2 border-l border-border/70 pl-1">
                            {target.actions.map((action) => (
                              <Row
                                key={action.id}
                                selected={
                                  !!isSelected({
                                    kind: "action",
                                    topicId: topic.id,
                                    targetId: target.id,
                                    actionId: action.id,
                                  })
                                }
                                onClick={() =>
                                  onSelect({
                                    kind: "action",
                                    topicId: topic.id,
                                    targetId: target.id,
                                    actionId: action.id,
                                  })
                                }
                                title={action.title || "Untitled action"}
                                level={2}
                                onDelete={() =>
                                  onDelete({
                                    kind: "action",
                                    topicId: topic.id,
                                    targetId: target.id,
                                    actionId: action.id,
                                  })
                                }
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <button
          onClick={onAddTopic}
          className="w-full flex items-center gap-2 text-sm font-medium text-accent hover:bg-accent/10 rounded-md px-3 py-2 transition-colors mt-2"
        >
          <Plus className="h-4 w-4" /> Add Topic
        </button>
      </div>
    </aside>
  );
}

interface RowProps {
  selected: boolean;
  onClick: () => void;
  onToggle?: () => void;
  open?: boolean;
  hasChildren?: boolean;
  title: string;
  level: 0 | 1 | 2;
  onAdd?: () => void;
  onDelete: () => void;
}

function Row({
  selected,
  onClick,
  onToggle,
  open,
  hasChildren,
  title,
  level,
  onAdd,
  onDelete,
}: RowProps) {
  const sizeClass =
    level === 0
      ? "text-sm font-semibold font-serif"
      : level === 1
      ? "text-sm"
      : "text-xs text-muted-foreground";

  return (
    <div
      className={cn(
        "group flex items-center gap-1 rounded-md pr-1 transition-colors",
        selected ? "bg-accent/15 text-foreground" : "hover:bg-secondary",
      )}
    >
      {hasChildren ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle?.();
          }}
          className="p-1 text-muted-foreground hover:text-foreground"
          aria-label="Toggle"
        >
          <ChevronRight
            className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-90")}
          />
        </button>
      ) : (
        <span className="w-6" />
      )}
      <button
        onClick={onClick}
        className={cn("flex-1 text-left py-1.5 truncate", sizeClass)}
      >
        {title}
      </button>
      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
        {onAdd && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
            className="p-1 text-muted-foreground hover:text-accent"
            aria-label="Add child"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 text-muted-foreground hover:text-destructive"
          aria-label="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
