import { ChevronDown, ChevronRight, Plus, Trash2, FolderOpen } from "lucide-react";
import type { Selection, TopicNode } from "@/types/assessment";
import { cn } from "@/lib/utils";

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

export function TopicTree({
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
    <div className="border border-border rounded bg-card">
      <button
        onClick={onAddTopic}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-secondary/60 hover:bg-secondary transition-colors"
      >
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground/80">
          <FolderOpen className="h-4 w-4" /> Themen
        </div>
        <Plus className="h-4 w-4 opacity-70" />
      </button>

      <div>
        {topics.length === 0 && (
          <div className="px-3 py-6 text-sm text-muted-foreground text-center">
            Noch keine Themen. Fügen Sie eines hinzu.
          </div>
        )}
        {topics.map((topic) => {
          const topicOpen = expanded[topic.id];
          const tSel = !!isSelected({ kind: "topic", topicId: topic.id });
          return (
            <div key={topic.id} className="border-b border-border last:border-b-0">
              <Row
                level={0}
                title={topic.title || "Unbenanntes Thema"}
                selected={tSel}
                open={topicOpen}
                hasChildren
                onToggle={() => onToggle(topic.id)}
                onClick={() => onSelect({ kind: "topic", topicId: topic.id })}
                onAdd={() => onAddTarget(topic.id)}
                onDelete={() => onDelete({ kind: "topic", topicId: topic.id })}
              />
              {topicOpen &&
                topic.targets.map((target) => {
                  const tKey = `${topic.id}:${target.id}`;
                  const tgOpen = expanded[tKey];
                  const tgSel = !!isSelected({
                    kind: "target",
                    topicId: topic.id,
                    targetId: target.id,
                  });
                  return (
                    <div key={target.id}>
                      <Row
                        level={1}
                        title={target.title || "Unbenanntes Ziel"}
                        selected={tgSel}
                        open={tgOpen}
                        hasChildren
                        onToggle={() => onToggle(tKey)}
                        onClick={() =>
                          onSelect({
                            kind: "target",
                            topicId: topic.id,
                            targetId: target.id,
                          })
                        }
                        onAdd={() => onAddAction(topic.id, target.id)}
                        onDelete={() =>
                          onDelete({
                            kind: "target",
                            topicId: topic.id,
                            targetId: target.id,
                          })
                        }
                      />
                      {tgOpen &&
                        target.actions.map((action) => {
                          const aSel = !!isSelected({
                            kind: "action",
                            topicId: topic.id,
                            targetId: target.id,
                            actionId: action.id,
                          });
                          return (
                            <Row
                              key={action.id}
                              level={2}
                              title={action.title || "Unbenannte Massnahme"}
                              selected={aSel}
                              onClick={() =>
                                onSelect({
                                  kind: "action",
                                  topicId: topic.id,
                                  targetId: target.id,
                                  actionId: action.id,
                                })
                              }
                              onDelete={() =>
                                onDelete({
                                  kind: "action",
                                  topicId: topic.id,
                                  targetId: target.id,
                                  actionId: action.id,
                                })
                              }
                            />
                          );
                        })}
                    </div>
                  );
                })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface RowProps {
  level: 0 | 1 | 2;
  title: string;
  selected: boolean;
  open?: boolean;
  hasChildren?: boolean;
  onClick: () => void;
  onToggle?: () => void;
  onAdd?: () => void;
  onDelete: () => void;
}

function Row({
  level,
  title,
  selected,
  open,
  hasChildren,
  onClick,
  onToggle,
  onAdd,
  onDelete,
}: RowProps) {
  const padLeft = level === 0 ? "pl-3" : level === 1 ? "pl-7" : "pl-12";
  const text =
    level === 0
      ? "text-sm font-semibold uppercase tracking-wide"
      : level === 1
      ? "text-sm font-medium"
      : "text-sm";

  return (
    <div
      className={cn(
        "group flex items-center gap-1 pr-2 py-2 cursor-pointer transition-colors",
        padLeft,
        selected
          ? "bg-primary/10 text-foreground border-l-2 border-primary"
          : "hover:bg-secondary/60",
      )}
      onClick={onClick}
    >
      {hasChildren ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle?.();
          }}
          className="p-0.5 -ml-1 opacity-80 hover:opacity-100"
        >
          {open ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      ) : (
        <span className="w-4" />
      )}
      <span className={cn("flex-1 truncate", text)}>{title}</span>
      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
        {onAdd && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
            className="p-1 hover:bg-secondary rounded"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 hover:bg-secondary rounded"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
