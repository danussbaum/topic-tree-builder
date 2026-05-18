import { useMemo, useRef, useState } from "react";
import { ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ACTION_PLAN_AUTHORIZED_ROLE_OPTIONS } from "@/lib/action-plan-disciplines";
import { cn } from "@/lib/utils";

interface AuthorizedRolesMultiSelectProps {
  value: string[];
  onChange: (roleIds: string[]) => void;
}

export const AuthorizedRolesMultiSelect = ({
  value,
  onChange,
}: AuthorizedRolesMultiSelectProps) => {
  const [roleQuery, setRoleQuery] = useState("");
  const [isRoleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [activeRoleIndex, setActiveRoleIndex] = useState(0);
  const roleInputRef = useRef<HTMLInputElement | null>(null);

  const selectedAuthorizedRoles = useMemo(
    () =>
      value
        .map((roleId) =>
          ACTION_PLAN_AUTHORIZED_ROLE_OPTIONS.find(
            (role) => role.id === roleId,
          ),
        )
        .filter(
          (
            role,
          ): role is (typeof ACTION_PLAN_AUTHORIZED_ROLE_OPTIONS)[number] =>
            Boolean(role),
        ),
    [value],
  );

  const filteredAuthorizedRoles = useMemo(() => {
    const query = roleQuery.trim().toLocaleLowerCase("de");
    return ACTION_PLAN_AUTHORIZED_ROLE_OPTIONS.filter(
      (role) =>
        !value.includes(role.id) &&
        (!query || role.label.toLocaleLowerCase("de").includes(query)),
    );
  }, [value, roleQuery]);

  const hasRoleFilterInput =
    roleQuery.trim().length > 0 || filteredAuthorizedRoles.length > 0;

  const selectAuthorizedRole = (roleId: string) => {
    onChange(value.includes(roleId) ? value : [...value, roleId]);
    setRoleQuery("");
    setActiveRoleIndex(0);
    requestAnimationFrame(() => roleInputRef.current?.focus());
  };

  const removeAuthorizedRole = (roleId: string) => {
    onChange(value.filter((id) => id !== roleId));
    setRoleDropdownOpen(true);
    requestAnimationFrame(() => roleInputRef.current?.focus());
  };

  return (
    <div className="min-h-10 rounded-md border border-input bg-background shadow-sm">
      <div className="flex items-start gap-2 px-3 py-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1">
            {selectedAuthorizedRoles.map((role) => (
              <Badge
                key={role.id}
                variant="secondary"
                className="h-6 gap-1 rounded-sm border border-border/60 bg-secondary/40 px-1.5 font-normal text-foreground/90"
              >
                {role.label}
                <button
                  type="button"
                  className="text-xs leading-none text-muted-foreground hover:text-foreground"
                  onClick={() => removeAuthorizedRole(role.id)}
                  aria-label={`${role.label} entfernen`}
                >
                  ×
                </button>
              </Badge>
            ))}
            <Input
              ref={roleInputRef}
              value={roleQuery}
              onChange={(event) => {
                setRoleQuery(event.target.value);
                setRoleDropdownOpen(true);
                setActiveRoleIndex(0);
              }}
              onFocus={() => setRoleDropdownOpen(true)}
              onKeyDown={(event) => {
                if (
                  !isRoleDropdownOpen &&
                  (event.key === "ArrowDown" || event.key === "ArrowUp")
                ) {
                  event.preventDefault();
                  setRoleDropdownOpen(true);
                  return;
                }
                if (
                  !isRoleDropdownOpen ||
                  !hasRoleFilterInput ||
                  filteredAuthorizedRoles.length === 0
                )
                  return;
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setActiveRoleIndex(
                    (prev) => (prev + 1) % filteredAuthorizedRoles.length,
                  );
                  return;
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setActiveRoleIndex(
                    (prev) =>
                      (prev - 1 + filteredAuthorizedRoles.length) %
                      filteredAuthorizedRoles.length,
                  );
                  return;
                }
                if (event.key === "Enter") {
                  event.preventDefault();
                  const activeRole = filteredAuthorizedRoles[activeRoleIndex];
                  if (activeRole) selectAuthorizedRole(activeRole.id);
                  return;
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  setRoleDropdownOpen(false);
                }
              }}
              placeholder="Berechtigte Rollen suchen..."
              className="h-6 min-w-[16rem] border-0 bg-transparent px-0 py-0 text-sm shadow-none focus-visible:ring-0"
            />
          </div>
        </div>
        <button
          type="button"
          className="mt-0.5 rounded p-1 text-muted-foreground hover:bg-secondary/70"
          onClick={() => setRoleDropdownOpen((prev) => !prev)}
          aria-label="Berechtigte Rollen anzeigen"
        >
          <ChevronUp
            className={cn(
              "h-4 w-4 transition-transform",
              !isRoleDropdownOpen && "rotate-180",
            )}
          />
        </button>
      </div>
      {isRoleDropdownOpen && hasRoleFilterInput && (
        <div className="max-h-56 overflow-y-auto border-t border-border/70 p-1.5">
          {filteredAuthorizedRoles.map((role, roleIndex) => (
            <button
              key={role.id}
              type="button"
              onClick={() => selectAuthorizedRole(role.id)}
              onMouseEnter={() => setActiveRoleIndex(roleIndex)}
              className={cn(
                "flex w-full items-center rounded-sm px-2 py-1 text-left text-sm hover:bg-secondary/40",
                activeRoleIndex === roleIndex && "bg-primary/10 text-primary",
              )}
            >
              <span className="truncate">{role.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
