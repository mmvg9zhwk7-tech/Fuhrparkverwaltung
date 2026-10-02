import type { FieldType, VehicleValue } from "./fields";

const money = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
const integer = new Intl.NumberFormat("de-DE");

export function formatValue(type: FieldType, value: VehicleValue): string {
  if (value === null || value === undefined || value === "") return "–";
  switch (type) {
    case "money":
      return money.format(Number(value));
    case "int":
      return integer.format(Number(value));
    case "date": {
      const [y, m, d] = String(value).split("-");
      return `${d}.${m}.${y}`;
    }
    default:
      return String(value);
  }
}

// Wert für <input>: Geld mit Komma ("19449,58"), Datum ISO für type=date.
export function inputValue(type: FieldType, value: VehicleValue): string {
  if (value === null || value === undefined) return "";
  if (type === "money") return String(value).replace(".", ",");
  return String(value);
}
