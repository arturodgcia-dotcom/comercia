import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { KpiCard } from "../components/KpiCard";
import { PageHeader } from "../components/PageHeader";
import { SummaryTable } from "../components/SummaryTable";
import { api } from "../services/api";
import { FinanceDashboard } from "../types/domain";

type FinanceViewMode = "resumen" | "detalle";

export function ReinpiaPaymentsPage() {
  const { token, user } = useAuth();
  const [dashboard, setDashboard] = useState<FinanceDashboard | null>(null);
  const [viewMode, setViewMode] = useState<FinanceViewMode>("resumen");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    tenantId: "",
    accountId: "",
    agentId: "",
    dateFrom: "",
    dateTo: "",
  });

  const [tenantOptions, setTenantOptions] = useState<Array<{ id: number; name: string }>>([]);
  const [accountOptions, setAccountOptions] = useState<Array<{ id: number; name: string }>>([]);
  const [agentOptions, setAgentOptions] = useState<Array<{ id: number; name: string }>>([]);

  const canSettleCommissions = user?.role === "reinpia_admin" || user?.role === "super_admin";

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.tenantId) params.set("tenant_id", filters.tenantId);
    if (filters.accountId) params.set("commercial_client_account_id", filters.accountId);
    if (filters.agentId) params.set("commission_agent_id", filters.agentId);
    if (filters.dateFrom) params.set("date_from", `${filters.dateFrom}T00:00:00`);
    if (filters.dateTo) params.set("date_to", `${filters.dateTo}T23:59:59`);
    return params.toString();
  }, [filters]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError("");
    api
      .getReinpiaFinanceDashboard(token, query)
      .then(setDashboard)
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar el tablero contable"))
      .finally(() => setLoading(false));
  }, [token, query]);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      api.getReinpiaFinanceTenantsSummary(token),
      api.getReinpiaFinanceCommercialClientAccounts(token),
      api.getReinpiaFinanceCommissionAgents(token),
    ])
      .then(([tenants, accounts, agents]) => {
        setTenantOptions(tenants.map((row) => ({ id: row.tenant_id, name: row.tenant_name })));
        setAccountOptions(accounts.map((row) => ({ id: row.id, name: row.legal_name })));
        setAgentOptions(agents.map((row) => ({ id: row.id, name: row.full_name })));
      })
      .catch(() => {
        setTenantOptions([]);
        setAccountOptions([]);
        setAgentOptions([]);
      });
  }, [token]);

  const settlementDraft = useMemo(() => {
    if (!dashboard?.comisionistas?.length) return null;
    const topPending = [...dashboard.comisionistas].sort((a, b) => b.comision_pendiente - a.comision_pendiente)[0];
    if (!topPending || Number(topPending.comision_pendiente) <= 0) return null;
    return topPending;
  }, [dashboard?.comisionistas]);

  const registerSettlement = async () => {
    if (!token || !settlementDraft || !canSettleCommissions) return;
    try {
      setLoading(true);
      await api.createReinpiaCommissionSettlement(token, {
        commission_agent_id: settlementDraft.commission_agent_id,
        amount_paid: Number(settlementDraft.comision_pendiente),
        tenant_id: filters.tenantId ? Number(filters.tenantId) : undefined,
        commercial_client_account_id: filters.accountId ? Number(filters.accountId) : undefined,
        notes: "Liquidacion registrada desde panel pagos/contador",
      });
      const refreshed = await api.getReinpiaFinanceDashboard(token, query);
      setDashboard(refreshed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible registrar la liquidacion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <PageHeader
        title="Pagos / Contador"
        subtitle="Vista financiera integral: ventas, comisión REINPIA, comisionistas y conciliación por cliente principal."
      />

      <section className="card">
        <h3>Filtros contables</h3>
        <div className="inline-form">
          <select value={filters.accountId} onChange={(e) => setFilters((prev) => ({ ...prev, accountId: e.target.value }))}>
            <option value="">Todos los clientes</option>
            {accountOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
          <select value={filters.tenantId} onChange={(e) => setFilters((prev) => ({ ...prev, tenantId: e.target.value }))}>
            <option value="">Todas las marcas</option>
            {tenantOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
          <select value={filters.agentId} onChange={(e) => setFilters((prev) => ({ ...prev, agentId: e.target.value }))}>
            <option value="">Todos los comisionistas</option>
            {agentOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
          />
        </div>
        <div className="inline-form">
          <button
            type="button"
            className={viewMode === "resumen" ? "button" : "button button-outline"}
            onClick={() => setViewMode("resumen")}
          >
            Resumen ejecutivo
          </button>
          <button
            type="button"
            className={viewMode === "detalle" ? "button" : "button button-outline"}
            onClick={() => setViewMode("detalle")}
          >
            Detalle por operación
          </button>
        </div>
      </section>

      {error ? <p className="error">{error}</p> : null}
      {loading ? <p>Cargando datos contables...</p> : null}

      {dashboard ? (
        <>
          <div className="card-grid">
            <KpiCard label="Comisiones generadas" value={`$${Number(dashboard.conciliacion.comisiones_generadas).toLocaleString("es-MX")}`} />
            <KpiCard label="Comisiones distribuidas" value={`$${Number(dashboard.conciliacion.comisiones_distribuidas).toLocaleString("es-MX")}`} />
            <KpiCard label="Comisiones pagadas" value={`$${Number(dashboard.conciliacion.comisiones_pagadas).toLocaleString("es-MX")}`} />
            <KpiCard label="Comisiones por pagar" value={`$${Number(dashboard.conciliacion.comisiones_por_pagar).toLocaleString("es-MX")}`} />
          </div>

          {viewMode === "resumen" ? (
            <>
              <section className="card">
                <h3>Por cliente principal</h3>
                <SummaryTable
                  headers={[
                    "Cliente principal",
                    "Ventas totales",
                    "Ventas sujetas a comisión",
                    "Comisión total generada",
                    "Comisión REINPIA",
                    "Comisión distribuida",
                  ]}
                  rows={dashboard.resumen_ejecutivo.map((row) => [
                    row.cliente_principal,
                    `$${Number(row.ventas_totales).toLocaleString("es-MX")}`,
                    `$${Number(row.ventas_sujetas_comision).toLocaleString("es-MX")}`,
                    `$${Number(row.comision_total_generada).toLocaleString("es-MX")}`,
                    `$${Number(row.comision_reinpia).toLocaleString("es-MX")}`,
                    `$${Number(row.comision_distribuida).toLocaleString("es-MX")}`,
                  ])}
                />
              </section>

              <section className="card">
                <h3>Por comisionista</h3>
                <SummaryTable
                  headers={["Nombre", "Marcas asociadas", "Porcentaje", "Generada", "Pendiente", "Pagada"]}
                  rows={dashboard.comisionistas.map((row) => [
                    `${row.nombre} (${row.tipo})`,
                    row.marcas_asociadas.length ? row.marcas_asociadas.join(", ") : "Sin asignación",
                    `${Number(row.porcentaje).toFixed(2)}%`,
                    `$${Number(row.comision_generada).toLocaleString("es-MX")}`,
                    `$${Number(row.comision_pendiente).toLocaleString("es-MX")}`,
                    `$${Number(row.comision_pagada).toLocaleString("es-MX")}`,
                  ])}
                />
              </section>
            </>
          ) : (
            <section className="card">
              <h3>Detalle por operación</h3>
              <SummaryTable
                headers={[
                  "Orden",
                  "Cliente principal",
                  "Marca",
                  "Venta",
                  "Comisión REINPIA",
                  "Comisionista",
                  "%",
                  "Comisión distribuida",
                  "Fecha",
                ]}
                rows={dashboard.detalle_operaciones.map((row) => [
                  row.order_id,
                  row.cliente_principal,
                  row.tenant_name,
                  `$${Number(row.total_venta).toLocaleString("es-MX")}`,
                  `$${Number(row.comision_reinpia).toLocaleString("es-MX")}`,
                  row.comisionista_nombre || "Sin comisionista",
                  `${Number(row.comisionista_porcentaje).toFixed(2)}%`,
                  `$${Number(row.comision_distribuida).toLocaleString("es-MX")}`,
                  new Date(row.created_at).toLocaleString("es-MX"),
                ])}
              />
            </section>
          )}

          <section className="card">
            <h3>Conciliación</h3>
            <p>
              Flujo financiero visible para contador: comisiones generadas, distribuidas y pendientes de pago.
            </p>
            {canSettleCommissions ? (
              <button type="button" className="button" disabled={!settlementDraft || loading} onClick={registerSettlement}>
                {settlementDraft
                  ? `Registrar pago pendiente de ${settlementDraft.nombre}`
                  : "No hay comisiones pendientes para liquidar"}
              </button>
            ) : (
              <p>Tu rol es de lectura. Solo super admin puede registrar liquidaciones.</p>
            )}
          </section>
        </>
      ) : null}
    </section>
  );
}
