import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
    <div className="max-w-3xl mx-auto p-8 lg:p-12">
      <div className="mb-2 text-xs uppercase tracking-wider text-accent font-semibold">
        {kindLabel}
      </div>
      <div className="mb-6 text-sm text-muted-foreground">
        {breadcrumbs.map((b, i) => (
          <span key={i}>
            {i > 0 && <span className="mx-2 text-border">/</span>}
            <span className={i === breadcrumbs.length - 1 ? "text-foreground" : ""}>
              {b}
            </span>
          </span>
        ))}
      </div>

      <Input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder={`${kindLabel} title…`}
        className="font-serif text-3xl font-bold border-0 border-b border-border rounded-none px-0 h-auto py-3 focus-visible:ring-0 focus-visible:border-accent shadow-none bg-transparent"
      />

      <div className="mt-8">
        <label className="text-sm font-medium text-muted-foreground block mb-2">
          Notes
        </label>
        <Textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Add detailed observations, criteria, or freetext notes…"
          className="min-h-[300px] bg-card border-border rounded-lg text-base leading-relaxed p-4"
        />
      </div>
    </div>
  );
}
