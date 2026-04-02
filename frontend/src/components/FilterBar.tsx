import { useTranslation } from "react-i18next";

type FilterBarProps = {
  tenantId: string;
  dateFrom: string;
  dateTo: string;
  status: string;
  tenantOptions?: Array<{ id: number; name: string }>;
  tenantLabel?: string;
  onChange: (next: { tenantId: string; dateFrom: string; dateTo: string; status: string }) => void;
};

export function FilterBar({ tenantId, dateFrom, dateTo, status, tenantOptions, tenantLabel, onChange }: FilterBarProps) {
  const { t } = useTranslation();
  const label = tenantLabel ?? t("filter.brand");

  return (
    <section className="store-banner">
      <h3>{t("filter.title")}</h3>
      <div className="inline-form">
        {tenantOptions?.length ? (
          <label>
            {label}
            <select value={tenantId} onChange={(e) => onChange({ tenantId: e.target.value, dateFrom, dateTo, status })}>
              <option value="">{t("filter.allBrands")}</option>
              {tenantOptions.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <input
            placeholder={t("filter.brandId")}
            value={tenantId}
            onChange={(e) => onChange({ tenantId: e.target.value, dateFrom, dateTo, status })}
          />
        )}
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => onChange({ tenantId, dateFrom: e.target.value, dateTo, status })}
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => onChange({ tenantId, dateFrom, dateTo: e.target.value, status })}
        />
        <select value={status} onChange={(e) => onChange({ tenantId, dateFrom, dateTo, status: e.target.value })}>
          <option value="">{t("filter.allStatuses")}</option>
          <option value="paid">{t("filter.paid")}</option>
          <option value="failed">{t("filter.failed")}</option>
          <option value="pending">{t("filter.pending")}</option>
          <option value="active">{t("filter.active")}</option>
          <option value="inactive">{t("filter.inactive")}</option>
        </select>
      </div>
    </section>
  );
}
