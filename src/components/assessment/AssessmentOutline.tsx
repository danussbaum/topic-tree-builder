import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Circle,
  RotateCcw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ActionNode, ActionStatus, TopicNode } from "@/types/assessment";
import { cn } from "@/lib/utils";

type ConfirmPayload =
  | { status: "done_as_planned" }
  | { status: "done_with_deviation"; actualMinutes: number; reason: string }
  | { status: "not_done"; reason: string }
  | { status: "open" };

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
  onUpdateActionField: (
    topicId: string,
    targetId: string,
    actionId: string,
    field: "plannedMinutes" | "actualMinutes" | "reason",
    value: number | string | undefined,
  ) => void;
  onConfirmAction: (
    topicId: string,
    targetId: string,
    actionId: string,
    payload: ConfirmPayload,
  ) => void;
  onAddTarget: (topicId: string) => void;
  onAddAction: (topicId: string, targetId: string) => void;
  onAddTopic: () => void;
  onDeleteTopic: (topicId: string) => void;
  onDeleteTarget: (topicId: string, targetId: string) => void;
  onDeleteAction: (topicId: string, targetId: string, actionId: string) => void;
}

interface DialogTarget {
  topicId: string;
  targetId: string;
  action: ActionNode;
}

export function AssessmentOutline({
  topics,
  onUpdateTopic,
  onUpdateTarget,
  onUpdateAction,
  onUpdateActionField,
  onConfirmAction,
  onAddTarget,
  onAddAction,
  onAddTopic,
  onDeleteTopic,
  onDeleteTarget,
  onDeleteAction,
}: Props) {
  const [dialogTarget, setDialogTarget] = useState<DialogTarget | null>(null);

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
                  <ul className="mt-3 space-y-1">
                    {target.actions.map((action) => (
                      <li
                        key={action.id}
                        className="group/action flex items-start gap-3 py-2 px-2 -mx-2 rounded hover:bg-secondary/40"
                      >
                        <button
                          onClick={() =>
                            setDialogTarget({
                              topicId: topic.id,
                              targetId: target.id,
                              action,
                            })
                          }
                          className="mt-0.5"
                          aria-label="Status ändern"
                          title="Status ändern"
                        >
                          <StatusIcon status={action.status} />
                        </button>
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
                              action.status === "done_as_planned" &&
                                "line-through text-muted-foreground",
                              action.status === "done_with_deviation" &&
                                "line-through text-muted-foreground",
                              action.status === "not_done" &&
                                "line-through text-muted-foreground/70",
                            )}
                          />

                          {/* Planned minutes + status meta line */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                            <label className="inline-flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5" />
                              <span>geplant</span>
                              <input
                                type="number"
                                min={0}
                                step={5}
                                value={action.plannedMinutes ?? ""}
                                onChange={(e) =>
                                  onUpdateActionField(
                                    topic.id,
                                    target.id,
                                    action.id,
                                    "plannedMinutes",
                                    e.target.value === ""
                                      ? undefined
                                      : Math.max(0, Number(e.target.value)),
                                  )
                                }
                                placeholder="–"
                                className="w-14 bg-transparent border-b border-border focus:border-primary outline-none px-1 py-0 text-right tabular-nums"
                              />
                              <span>Min</span>
                            </label>

                            <StatusBadge action={action} />
                          </div>

                          {(action.reason ||
                            action.status === "done_with_deviation" ||
                            action.status === "not_done") && (
                            <div className="mt-1 text-xs text-muted-foreground italic">
                              {action.status === "done_with_deviation" &&
                                action.actualMinutes != null && (
                                  <span className="not-italic mr-1 font-medium text-foreground/70">
                                    {action.actualMinutes} Min tatsächlich:
                                  </span>
                                )}
                              {action.reason}
                            </div>
                          )}

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
                    ))}
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

      <ConfirmActionDialog
        target={dialogTarget}
        onClose={() => setDialogTarget(null)}
        onConfirm={(payload) => {
          if (!dialogTarget) return;
          onConfirmAction(
            dialogTarget.topicId,
            dialogTarget.targetId,
            dialogTarget.action.id,
            payload,
          );
          setDialogTarget(null);
        }}
      />
    </div>
  );
}

function StatusIcon({ status }: { status: ActionStatus }) {
  switch (status) {
    case "done_as_planned":
      return <CheckCircle2 className="h-5 w-5 text-primary" />;
    case "done_with_deviation":
      return <AlertTriangle className="h-5 w-5 text-accent" />;
    case "not_done":
      return <XCircle className="h-5 w-5 text-destructive" />;
    default:
      return (
        <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
      );
  }
}

function StatusBadge({ action }: { action: ActionNode }) {
  if (action.status === "open") return null;
  const map = {
    done_as_planned: { label: "wie geplant", cls: "bg-primary/10 text-primary" },
    done_with_deviation: {
      label: "mit Abweichung",
      cls: "bg-accent/15 text-accent",
    },
    not_done: { label: "nicht durchgeführt", cls: "bg-destructive/10 text-destructive" },
  } as const;
  const m = map[action.status];
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider",
        m.cls,
      )}
    >
      {m.label}
    </span>
  );
}

function ConfirmActionDialog({
  target,
  onClose,
  onConfirm,
}: {
  target: DialogTarget | null;
  onClose: () => void;
  onConfirm: (p: ConfirmPayload) => void;
}) {
  const [mode, setMode] = useState<ActionStatus | null>(null);
  const [actualMinutes, setActualMinutes] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  const open = target !== null;

  // initialize when target changes
  useEffect(() => {
    if (target) {
      setMode(target.action.status === "open" ? null : target.action.status);
      setActualMinutes(
        target.action.actualMinutes != null ? String(target.action.actualMinutes) : "",
      );
      setReason(target.action.reason ?? "");
    }
  }, [target]);

  const handleClose = () => {
    setMode(null);
    setActualMinutes("");
    setReason("");
    onClose();
  };

  const submit = () => {
    if (!target || !mode) return;
    if (mode === "done_as_planned") {
      onConfirm({ status: "done_as_planned" });
    } else if (mode === "done_with_deviation") {
      const min = Number(actualMinutes);
      if (!Number.isFinite(min) || min < 0 || !reason.trim()) return;
      onConfirm({
        status: "done_with_deviation",
        actualMinutes: min,
        reason: reason.trim(),
      });
    } else if (mode === "not_done") {
      if (!reason.trim()) return;
      onConfirm({ status: "not_done", reason: reason.trim() });
    }
    setMode(null);
    setActualMinutes("");
    setReason("");
  };

  const planned = target?.action.plannedMinutes;

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? handleClose() : null)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Massnahme bestätigen</DialogTitle>
          <DialogDescription className="line-clamp-2">
            {target?.action.title || "Massnahme"}
            {planned != null && (
              <span className="ml-2 text-xs">· geplant {planned} Min</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <ChoiceRow
            active={mode === "done_as_planned"}
            onClick={() => setMode("done_as_planned")}
            icon={<CheckCircle2 className="h-5 w-5 text-primary" />}
            title="Erledigt wie geplant"
            description={
              planned != null
                ? `Tatsächliche Zeit = geplante ${planned} Min`
                : "Massnahme wie vorgesehen durchgeführt"
            }
          />
          <ChoiceRow
            active={mode === "done_with_deviation"}
            onClick={() => setMode("done_with_deviation")}
            icon={<AlertTriangle className="h-5 w-5 text-accent" />}
            title="Erledigt mit Abweichung"
            description="Andere tatsächliche Zeit – Begründung erforderlich"
          />
          <ChoiceRow
            active={mode === "not_done"}
            onClick={() => setMode("not_done")}
            icon={<XCircle className="h-5 w-5 text-destructive" />}
            title="Nicht durchgeführt"
            description="Begründung erforderlich"
          />
        </div>

        {mode === "done_with_deviation" && (
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="space-y-1.5">
              <Label htmlFor="actual-min">Tatsächliche Minuten</Label>
              <Input
                id="actual-min"
                type="number"
                min={0}
                step={5}
                value={actualMinutes}
                onChange={(e) => setActualMinutes(e.target.value)}
                placeholder="z. B. 60"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dev-reason">Begründung</Label>
              <Textarea
                id="dev-reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Warum wich die Zeit ab?"
              />
            </div>
          </div>
        )}

        {mode === "not_done" && (
          <div className="space-y-1.5 pt-2 border-t border-border">
            <Label htmlFor="not-reason">Begründung</Label>
            <Textarea
              id="not-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Warum wurde die Massnahme nicht durchgeführt?"
            />
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          {target?.action.status !== "open" ? (
            <Button
              variant="ghost"
              onClick={() => {
                onConfirm({ status: "open" });
                setMode(null);
                setActualMinutes("");
                setReason("");
              }}
              className="gap-1.5"
            >
              <RotateCcw className="h-4 w-4" />
              Zurücksetzen
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Abbrechen
            </Button>
            <Button
              onClick={submit}
              disabled={
                !mode ||
                (mode === "done_with_deviation" &&
                  (actualMinutes === "" || !reason.trim())) ||
                (mode === "not_done" && !reason.trim())
              }
            >
              Bestätigen
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ChoiceRow({
  active,
  onClick,
  icon,
  title,
  description,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 text-left p-3 rounded-sm border transition-colors",
        active
          ? "border-primary bg-primary/5"
          : "border-border hover:bg-secondary/50",
      )}
    >
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
    </button>
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
