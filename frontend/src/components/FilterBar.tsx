type FilterBarProps = {
  tenantId: string;
  dateFrom: string;
  dateTo: string;
  status: string;
  onChange: (next: { tenantId: string; dateFrom: string; dateTo: string; status: string }) => void;
};

export function FilterBar({ tenantId, dateFrom, dateTo, status, onChange }: FilterBarProps) {
  return (
    <section className="store-banner">
      <h3>Filtros</h3>
      <div className="inline-form">
        <input
          placeholder="Tenant ID"
          value={tenantId}
          onChange={(e) => onChange({ tenantId: e.target.value, dateFrom, dateTo, status })}
        />
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
          <option value="">Todos los estados</option>
          <option value="paid">paid</option>
          <option value="failed">failed</option>
          <option value="pending">pending</option>
          <option value="active">active</option>
          <option value="inactive">inactive</option>
        </select>
      </div>
    </section>
  );
}
