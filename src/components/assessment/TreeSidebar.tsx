import { ChevronDown, ChevronRight, Plus, Trash2, Search, FolderOpen } from "lucide-react";
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
    <aside className="w-72 shrink-0 bg-sidebar text-sidebar-foreground h-dvh sticky top-0 flex flex-col">
      {/* User chip */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-sidebar-border bg-sidebar-primary">
        <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center text-sm font-semibold">
          AS
        </div>
        <div className="text-sm font-semibold leading-tight">
          Assessor (GL)
        </div>
      </div>

      {/* Section header */}
      <button
        className="flex items-center justify-between gap-2 px-4 py-3 border-b border-sidebar-border bg-sidebar-primary/60 hover:bg-sidebar-primary transition-colors"
        onClick={onAddTopic}
        title="Add topic"
      >
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
          <FolderOpen className="h-4 w-4" /> Themen
        </div>
        <Plus className="h-4 w-4 opacity-80" />
      </button>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {topics.map((topic) => {
          const topicOpen = expanded[topic.id];
          const topicSelected = !!isSelected({ kind: "topic", topicId: topic.id });
          return (
            <div key={topic.id} className="border-b border-sidebar-border/60">
              <SidebarRow
                level={0}
                title={topic.title || "Untitled topic"}
                selected={topicSelected}
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
                  const targetOpen = expanded[tKey];
                  const tSelected = !!isSelected({
                    kind: "target",
                    topicId: topic.id,
                    targetId: target.id,
                  });
                  return (
                    <div key={target.id}>
                      <SidebarRow
                        level={1}
                        title={target.title || "Untitled target"}
                        selected={tSelected}
                        open={targetOpen}
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
                      {targetOpen &&
                        target.actions.map((action) => {
                          const aSelected = !!isSelected({
                            kind: "action",
                            topicId: topic.id,
                            targetId: target.id,
                            actionId: action.id,
                          });
                          return (
                            <SidebarRow
                              key={action.id}
                              level={2}
                              title={action.title || "Untitled action"}
                              selected={aSelected}
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

      {/* Search bar (socialweb has one bottom-left) */}
      <div className="border-t border-sidebar-border p-3 bg-sidebar-primary">
        <div className="flex items-center gap-2 bg-sidebar-accent/40 rounded px-2 py-1.5">
          <Search className="h-4 w-4 opacity-80" />
          <input
            placeholder="Suchen (Ctrl+D)"
            className="bg-transparent outline-none text-sm placeholder:text-sidebar-foreground/60 w-full"
          />
        </div>
      </div>
    </aside>
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

function SidebarRow({
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
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "hover:bg-sidebar-primary/70",
      )}
      onClick={onClick}
    >
      {hasChildren ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle?.();
          }}
          className="p-0.5 -ml-1 opacity-90 hover:opacity-100"
          aria-label="Toggle"
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
            className="p-1 hover:bg-white/10 rounded"
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
          className="p-1 hover:bg-white/10 rounded"
          aria-label="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
