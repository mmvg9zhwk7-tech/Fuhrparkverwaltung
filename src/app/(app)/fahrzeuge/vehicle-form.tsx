import { FIELD_GROUPS, VEHICLE_FIELDS, type VehicleInput } from "@/lib/vehicles/fields";
import { inputValue } from "@/lib/vehicles/format";

// Formular für Anlegen und Bearbeiten, gegliedert wie die Detailansicht.
// Geldbeträge als Text mit Komma, damit "19.449,58" einfach eingetippt
// werden kann (vehicleFromForm liest das deutsche Format).
export function VehicleForm({
  action,
  vehicle,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  vehicle?: VehicleInput;
  submitLabel: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-6">
      {FIELD_GROUPS.map((group) => (
        <fieldset key={group.key} className="card">
          <legend className="sr-only">{group.label}</legend>
          <h2 className="mb-4 text-lg font-semibold text-brand">{group.label}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {VEHICLE_FIELDS.filter((f) => f.group === group.key).map((field) => (
              <label key={field.key} className="label">
                {field.label}
                <input
                  name={field.key}
                  type={field.type === "date" ? "date" : "text"}
                  inputMode={
                    field.type === "money" ? "decimal" : field.type === "int" ? "numeric" : undefined
                  }
                  list={field.suggestions ? `list-${field.key}` : undefined}
                  defaultValue={inputValue(field.type, vehicle?.[field.key] ?? null)}
                  placeholder={field.type === "money" ? "0,00 €" : undefined}
                  className="input-field"
                />
                {field.suggestions && (
                  <datalist id={`list-${field.key}`}>
                    {field.suggestions.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                )}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <button type="submit" className="btn-primary self-start">
        {submitLabel}
      </button>
    </form>
  );
}
