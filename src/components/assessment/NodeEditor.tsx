import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronRight } from "lucide-react";

interface Props {
  kindLabel: string;
  breadcrumbs: string[];
  title: string;
  notes: string;
  onTitleChange: (v: string) => void;
  onNotesChange: (v: string) => void;
}

export function NodeEditor({
  kindLabel,
  breadcrumbs,
  title,
  notes,
  onTitleChange,
  onNotesChange,
}: Props) {
  return (
    <div className="max-w-3xl">
      {/* Breadcrumb-like row, socialweb style */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        <span className="uppercase tracking-wide font-semibold text-accent">
          {kindLabel}
        </span>
        <span className="text-border">·</span>
        {breadcrumbs.map((b, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <ChevronRight className="h-3 w-3 text-border" />}
            <span
              className={
                i === breadcrumbs.length - 1
                  ? "text-foreground font-medium"
                  : "text-muted-foreground"
              }
            >
              {b}
            </span>
          </span>
        ))}
      </div>

      <Input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder={`${kindLabel} title…`}
        className="text-2xl font-semibold border-0 border-b border-border rounded-none px-0 h-auto py-3 focus-visible:ring-0 focus-visible:border-primary shadow-none bg-transparent"
      />

      <div className="mt-8">
        <label className="text-xs uppercase tracking-wide font-semibold text-muted-foreground block mb-2">
          Freitext / Notizen
        </label>
        <Textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Detaillierte Beobachtungen, Kriterien oder Notizen erfassen…"
          className="min-h-[320px] bg-card border-border rounded-sm text-base leading-relaxed p-4 focus-visible:ring-1 focus-visible:ring-primary"
        />
      </div>
    </div>
  );
}
