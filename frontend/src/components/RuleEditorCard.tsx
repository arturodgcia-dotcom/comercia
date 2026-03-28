import { useState } from "react";
import { SecurityRule } from "../types/domain";

interface RuleEditorCardProps {
  rule: SecurityRule;
  onSave: (ruleId: number, payload: Partial<SecurityRule>) => Promise<void>;
  onToggle: (ruleId: number) => Promise<void>;
}

export function RuleEditorCard({ rule, onSave, onToggle }: RuleEditorCardProps) {
  const [thresholdCount, setThresholdCount] = useState(String(rule.threshold_count ?? ""));
  const [thresholdWindow, setThresholdWindow] = useState(String(rule.threshold_window_minutes ?? ""));
  const [actionType, setActionType] = useState(rule.action_type);
  const [severity, setSeverity] = useState(rule.severity);

  return (
    <article className="panel">
      <h3>
        {rule.name} ({rule.code})
      </h3>
      <p>{rule.description}</p>
      <div className="inline-form">
        <label>
          Umbral
          <input value={thresholdCount} onChange={(e) => setThresholdCount(e.target.value)} />
        </label>
        <label>
          Ventana (min)
          <input value={thresholdWindow} onChange={(e) => setThresholdWindow(e.target.value)} />
        </label>
        <label>
          Accion
          <input value={actionType} onChange={(e) => setActionType(e.target.value)} />
        </label>
        <label>
          Severidad
          <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
            <option value="critical">critical</option>
          </select>
        </label>
      </div>
      <div className="inline-form">
        <button
          type="button"
          className="button"
          onClick={() =>
            onSave(rule.id, {
              threshold_count: thresholdCount ? Number(thresholdCount) : null,
              threshold_window_minutes: thresholdWindow ? Number(thresholdWindow) : null,
              action_type: actionType,
              severity
            })
          }
        >
          Guardar regla
        </button>
        <button type="button" className="button button-outline" onClick={() => onToggle(rule.id)}>
          {rule.is_active ? "Desactivar" : "Activar"}
        </button>
      </div>
    </article>
  );
}

