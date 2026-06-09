import { useEffect, useRef, useState } from "react";
import { MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MODULES = [
  { label: "Handlungen", active: true, path: "/" },
  { label: "Journal" },
  { label: "Aufgaben" },
  { label: "Termine" },
  { label: "Texte" },
  { label: "Dateien" },
  { label: "Pflege" },
  { label: "Systeme" },
  { label: "Bewertungen" },
  { label: "Kontakte" },
  { label: "Einstellungen", path: "/settings" },
];

export function ModuleNav({ activeLabel }: { activeLabel?: string } = {}) {
  const navigate = useNavigate();
  const navRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);
  const [visibleCount, setVisibleCount] = useState(MODULES.length);

  useEffect(() => {
    const nav = navRef.current;
    const measure = measureRef.current;
    if (!nav || !measure) return;

    const calculate = () => {
      const navWidth = nav.offsetWidth;
      const moreWidth = moreRef.current?.offsetWidth ?? 100;
      const itemEls = Array.from(measure.children) as HTMLElement[];

      const allWidth = itemEls.reduce((s, el) => s + el.offsetWidth, 0);
      if (allWidth <= navWidth) {
        setVisibleCount(MODULES.length);
        return;
      }

      let total = 0;
      let count = 0;
      for (const el of itemEls) {
        total += el.offsetWidth;
        if (total + moreWidth > navWidth) break;
        count++;
      }
      setVisibleCount(count);
    };

    const ro = new ResizeObserver(calculate);
    ro.observe(nav);
    calculate();
    return () => ro.disconnect();
  }, []);

  const visible = MODULES.slice(0, visibleCount);
  const overflow = MODULES.slice(visibleCount);

  return (
    <div ref={navRef} className="flex items-stretch h-full min-w-0 flex-1">
      {/* Hidden measurement row */}
      <div ref={measureRef} className="absolute invisible flex items-stretch h-12 pointer-events-none">
        {MODULES.map((t) => (
          <div
            key={t.label}
            className="px-4 text-xs font-semibold uppercase tracking-wide flex items-center whitespace-nowrap"
          >
            {t.label}
          </div>
        ))}
      </div>

      {visible.map((t) => {
        const isActive = activeLabel ? t.label === activeLabel : t.active;
        return (
          <button
            key={t.label}
            onClick={t.path ? () => navigate(t.path!) : undefined}
            className={
              "px-4 text-xs font-semibold uppercase tracking-wide flex items-center whitespace-nowrap transition-colors " +
              (isActive
                ? (["Handlungen", "Einstellungen"].includes(t.label)
                    ? "text-white"
                    : "bg-topbar-active text-topbar-active-foreground")
                : "hover:bg-[#EDEDED]")
            }
            style={isActive && ["Handlungen", "Einstellungen"].includes(t.label) ? { backgroundColor: "#5D9580" } : undefined}
          >
            {t.label}
          </button>
        );
      })}

      {overflow.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              ref={moreRef}
              type="button"
              className="px-4 text-xs font-semibold uppercase tracking-wide flex items-center gap-2 whitespace-nowrap transition-colors hover:bg-[#EDEDED] focus:outline-none data-[state=open]:bg-[#EDEDED]"
            >
              Weitere
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-48">
            {overflow.map((t) => (
              <DropdownMenuItem key={t.label} onClick={t.path ? () => navigate(t.path!) : undefined}>
                <span className="text-xs font-semibold uppercase tracking-wide">
                  {t.label}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
