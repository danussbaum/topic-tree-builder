import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getActionServiceTypeLabel } from "@/lib/action-plan-templates";
import type { ActionServiceType, ConfirmedOptionalService } from "@/types/assessment";

/**
 * Erfassung der optionalen Leistungsarten einer Handlung mit Anzahl.
 * Rendert bewusst nichts — auch keine Überschrift — wenn die Vorlage keine hinterlegt hat.
 */
export function OptionalServiceQuantities({
  serviceTypes,
  values,
  onChange,
  disabled,
}: {
  serviceTypes?: ActionServiceType[];
  values: ConfirmedOptionalService[];
  onChange: (next: ConfirmedOptionalService[]) => void;
  disabled?: boolean;
}) {
  if (!serviceTypes || serviceTypes.length === 0) return null;

  const quantityFor = (serviceType: ActionServiceType) =>
    values.find((entry) => entry.serviceType === serviceType)?.quantity;

  const setQuantity = (serviceType: ActionServiceType, raw: string) => {
    const rest = values.filter((entry) => entry.serviceType !== serviceType);
    const parsed = raw === "" ? NaN : Number(raw.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      onChange(rest);
      return;
    }
    // Reihenfolge der Vorlage beibehalten, damit die Anzeige stabil bleibt.
    const next = [...rest, { serviceType, quantity: parsed }];
    onChange(
      next.sort((left, right) => serviceTypes.indexOf(left.serviceType) - serviceTypes.indexOf(right.serviceType)),
    );
  };

  return (
    <div className="space-y-2 pt-2 border-t border-border">
      <div className="space-y-0.5">
        <Label>Optionale Leistungen</Label>
        <p className="text-xs text-muted-foreground">
          Nur ausfüllen, wenn zusätzlicher Aufwand angefallen ist. Leer bedeutet «nicht angefallen».
        </p>
      </div>
      {/* Anzahl links, Leistungsart rechts — liest sich als «Anzahl × Leistungsart». */}
      {serviceTypes.map((serviceType) => (
        <div key={serviceType} className="flex items-center gap-2">
          <Input
            id={`optional-service-${serviceType}`}
            type="number"
            min={0}
            step="any"
            inputMode="decimal"
            disabled={disabled}
            placeholder="Anzahl"
            value={quantityFor(serviceType) ?? ""}
            onChange={(event) => setQuantity(serviceType, event.target.value)}
            className="w-24 shrink-0 bg-background"
          />
          <Label htmlFor={`optional-service-${serviceType}`} className="min-w-0 flex-1 text-xs font-normal">
            {getActionServiceTypeLabel(serviceType)}
          </Label>
        </div>
      ))}
    </div>
  );
}
