import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { InsightCard } from "../components/InsightCard";
import { PageHeader } from "../components/PageHeader";
import { PeriodSelector } from "../components/PeriodSelector";
import { api } from "../services/api";

export function ReinpiaMarketingOpportunitiesPage() {
  const { token } = useAuth();
  const [period, setPeriod] = useState("month");
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [error, setError] = useState("");
  const query = useMemo(() => `period=${period}`, [period]);

  useEffect(() => {
    if (!token) return;
    api
      .getReinpiaReportsMarketingOpportunities(token, query)
      .then((res) => setItems(res.opportunities ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar oportunidades"));
  }, [token, query]);

  if (error) return <p className="error">{error}</p>;

  return (
    <section>
      <PageHeader title="REINPIA Marketing Opportunities" subtitle="Oportunidades comerciales detectadas por reglas." />
      <div className="inline-form">
        <PeriodSelector period={period} onChange={setPeriod} />
      </div>
      <div className="stack">
        {items.map((item, idx) => (
          <InsightCard
            key={`${item.tenant_id ?? "g"}-${idx}`}
            title={`${String(item.tenant_name ?? "Tenant")} - ${String(item.opportunity_type ?? "opportunity")}`}
            message={String(item.message ?? "")}
            recommendation="Priorizar contacto comercial y propuesta de activacion."
          />
        ))}
      </div>
    </section>
  );
}

