import { Plus, Trash2, GripVertical } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import type { TopicNode } from "@/types/assessment";
import { cn } from "@/lib/utils";

interface Props {
  topics: TopicNode[];
  onUpdateTopic: (topicId: string, field: "title" | "notes", value: string) => void;
  onUpdateTarget: (
    topicId: string,
    targetId: string,
    field: "title" | "notes",
    value: string,
  ) => void;
  onUpdateAction: (
    topicId: string,
    targetId: string,
    actionId: string,
    field: "title" | "notes",
    value: string,
  ) => void;
  onToggleAction: (topicId: string, targetId: string, actionId: string) => void;
  onAddTarget: (topicId: string) => void;
  onAddAction: (topicId: string, targetId: string) => void;
  onAddTopic: () => void;
  onDeleteTopic: (topicId: string) => void;
  onDeleteTarget: (topicId: string, targetId: string) => void;
  onDeleteAction: (topicId: string, targetId: string, actionId: string) => void;
}

export function AssessmentOutline({
  topics,
  onUpdateTopic,
  onUpdateTarget,
  onUpdateAction,
  onToggleAction,
  onAddTarget,
  onAddAction,
  onAddTopic,
  onDeleteTopic,
  onDeleteTarget,
  onDeleteAction,
}: Props) {
  if (topics.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-sm p-12 text-center text-muted-foreground">
        <p className="mb-4">Noch keine Themen erfasst.</p>
        <button
          onClick={onAddTopic}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-sm text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Erstes Thema hinzufügen
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {topics.map((topic, ti) => (
        <section key={topic.id} className="group/topic">
          {/* Topic header */}
          <div className="flex items-start gap-3 pb-2 border-b-2 border-primary/30">
            <div className="text-3xl font-bold text-primary/40 leading-none pt-1 tabular-nums select-none">
              {ti + 1}.
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-widest font-semibold text-accent mb-1">
                Thema
              </div>
              <input
                value={topic.title}
                onChange={(e) => onUpdateTopic(topic.id, "title", e.target.value)}
                placeholder="Themenbezeichnung…"
                className="w-full text-2xl font-semibold bg-transparent border-0 outline-none focus:ring-0 px-0 placeholder:text-muted-foreground/40"
              />
            </div>
            <button
              onClick={() => onDeleteTopic(topic.id)}
              className="opacity-0 group-hover/topic:opacity-100 p-1.5 hover:bg-destructive/10 hover:text-destructive rounded transition-opacity"
              aria-label="Thema löschen"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <Notes
            value={topic.notes}
            onChange={(v) => onUpdateTopic(topic.id, "notes", v)}
            placeholder="Freitext zum Thema…"
            className="mt-3"
          />

          {/* Targets */}
          <div className="mt-6 space-y-6 pl-6 border-l border-border ml-4">
            {topic.targets.map((target, gi) => (
              <div key={target.id} className="group/target">
                <div className="flex items-start gap-3">
                  <div className="text-base font-semibold text-foreground/50 leading-none pt-2 tabular-nums select-none">
                    {ti + 1}.{gi + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-1">
                      Ziel
                    </div>
                    <input
                      value={target.title}
                      onChange={(e) =>
                        onUpdateTarget(topic.id, target.id, "title", e.target.value)
                      }
                      placeholder="Zielbezeichnung…"
                      className="w-full text-lg font-medium bg-transparent border-0 outline-none focus:ring-0 px-0 placeholder:text-muted-foreground/40"
                    />
                  </div>
                  <button
                    onClick={() => onDeleteTarget(topic.id, target.id)}
                    className="opacity-0 group-hover/target:opacity-100 p-1.5 hover:bg-destructive/10 hover:text-destructive rounded transition-opacity"
                    aria-label="Ziel löschen"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="pl-6">
                  <Notes
                    value={target.notes}
                    onChange={(v) => onUpdateTarget(topic.id, target.id, "notes", v)}
                    placeholder="Freitext zum Ziel…"
                    className="mt-2"
                  />

                  {/* Actions */}
                  <ul className="mt-3 space-y-1.5">
                    {target.actions.map((action) => {
                      const progress = (() => {
                        const total = target.actions.length;
                        const done = target.actions.filter((a) => a.done).length;
                        return { total, done };
                      })();
                      void progress;
                      return (
                        <li
                          key={action.id}
                          className="group/action flex items-start gap-3 py-1.5 px-2 -mx-2 rounded hover:bg-secondary/50"
                        >
                          <Checkbox
                            checked={action.done}
                            onCheckedChange={() =>
                              onToggleAction(topic.id, target.id, action.id)
                            }
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <input
                              value={action.title}
                              onChange={(e) =>
                                onUpdateAction(
                                  topic.id,
                                  target.id,
                                  action.id,
                                  "title",
                                  e.target.value,
                                )
                              }
                              placeholder="Massnahme…"
                              className={cn(
                                "w-full text-sm bg-transparent border-0 outline-none focus:ring-0 px-0 placeholder:text-muted-foreground/40",
                                action.done && "line-through text-muted-foreground",
                              )}
                            />
                            {action.notes || action.done ? null : null}
                            <Notes
                              value={action.notes}
                              onChange={(v) =>
                                onUpdateAction(
                                  topic.id,
                                  target.id,
                                  action.id,
                                  "notes",
                                  v,
                                )
                              }
                              placeholder="Notiz hinzufügen…"
                              compact
                            />
                          </div>
                          <button
                            onClick={() =>
                              onDeleteAction(topic.id, target.id, action.id)
                            }
                            className="opacity-0 group-hover/action:opacity-100 p-1 hover:bg-destructive/10 hover:text-destructive rounded transition-opacity self-start mt-0.5"
                            aria-label="Massnahme löschen"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>

                  <button
                    onClick={() => onAddAction(topic.id, target.id)}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Massnahme hinzufügen
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={() => onAddTarget(topic.id)}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Plus className="h-4 w-4" />
              Ziel hinzufügen
            </button>
          </div>
        </section>
      ))}

      <div className="pt-4 border-t border-dashed border-border">
        <button
          onClick={onAddTopic}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-sm text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Neues Thema
        </button>
      </div>
    </div>
  );
}

function Notes({
  value,
  onChange,
  placeholder,
  className,
  compact,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={compact ? 1 : 2}
      className={cn(
        "w-full resize-none bg-transparent border-0 shadow-none px-0 focus-visible:ring-0 placeholder:text-muted-foreground/40 leading-relaxed",
        compact ? "text-xs min-h-0 py-0.5" : "text-sm min-h-0 py-1",
        className,
      )}
      onInput={(e) => {
        const el = e.currentTarget;
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
      }}
    />
  );
}
