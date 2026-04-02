import { useTranslation } from "react-i18next";

interface PeriodSelectorProps {
  period: string;
  onChange: (value: string) => void;
}

export function PeriodSelector({ period, onChange }: PeriodSelectorProps) {
  const { t } = useTranslation();

  const PERIODS = [
    { value: "day", label: t("period.day") },
    { value: "week", label: t("period.week") },
    { value: "fortnight", label: t("period.fortnight") },
    { value: "month", label: t("period.month") },
    { value: "quarter", label: t("period.quarter") },
    { value: "half_year", label: t("period.halfYear") },
    { value: "year", label: t("period.year") },
    { value: "custom", label: t("period.custom") },
  ];

  return (
    <label>
      {t("period.label")}
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
