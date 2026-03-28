import { useEffect, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { RuleEditorCard } from "../components/RuleEditorCard";
import { api } from "../services/api";
import { SecurityRule } from "../types/domain";

export function ReinpiaSecurityRulesPage() {
  const { token } = useAuth();
  const [rules, setRules] = useState<SecurityRule[]>([]);
  const [error, setError] = useState("");

  const load = async () => {
    if (!token) return;
    setRules(await api.getSecurityRules(token));
  };

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar reglas"));
  }, [token]);

  const onSave = async (ruleId: number, payload: Partial<SecurityRule>) => {
    if (!token) return;
    await api.updateSecurityRule(token, ruleId, payload);
    await load();
  };

  const onToggle = async (ruleId: number) => {
    if (!token) return;
    await api.toggleSecurityRule(token, ruleId);
    await load();
  };

  return (
    <section>
      <PageHeader title="Security Rules" subtitle="Configuracion operativa de umbrales y acciones del centinela." />
      {error ? <p className="error">{error}</p> : null}
      <div className="stack">
        {rules.map((rule) => (
          <RuleEditorCard key={rule.id} rule={rule} onSave={onSave} onToggle={onToggle} />
        ))}
      </div>
    </section>
  );
}

