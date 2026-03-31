type FilterBarProps = {
  tenantId: string;
  dateFrom: string;
  dateTo: string;
  status: string;
  tenantOptions?: Array<{ id: number; name: string }>;
  tenantLabel?: string;
  onChange: (next: { tenantId: string; dateFrom: string; dateTo: string; status: string }) => void;
};

export function FilterBar({ tenantId, dateFrom, dateTo, status, tenantOptions, tenantLabel = "Marca", onChange }: FilterBarProps) {
  return (
    <section className="store-banner">
      <h3>Filtros</h3>
      <div className="inline-form">
        {tenantOptions?.length ? (
          <label>
            {tenantLabel}
            <select value={tenantId} onChange={(e) => onChange({ tenantId: e.target.value, dateFrom, dateTo, status })}>
              <option value="">Todas</option>
              {tenantOptions.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <input
            placeholder="ID de marca"
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
          <option value="">Todos los estados</option>
          <option value="paid">Pagado</option>
          <option value="failed">Fallido</option>
          <option value="pending">Pendiente</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
        </select>
      </div>
    </section>
  );
}
