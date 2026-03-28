interface PeriodSelectorProps {
  period: string;
  onChange: (value: string) => void;
}

const PERIODS = [
  { value: "day", label: "Dia" },
  { value: "week", label: "Semana" },
  { value: "fortnight", label: "Quincena" },
  { value: "month", label: "Mes" },
  { value: "quarter", label: "3 meses" },
  { value: "half_year", label: "6 meses" },
  { value: "year", label: "12 meses" },
  { value: "custom", label: "Personalizado" }
];

export function PeriodSelector({ period, onChange }: PeriodSelectorProps) {
  return (
    <label>
      Periodo
      <select value={period} onChange={(e) => onChange(e.target.value)}>
        {PERIODS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

