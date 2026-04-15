import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { useAdminContextScope } from "../hooks/useAdminContextScope";
import { api } from "../services/api";
import { BrandResponsesConfig, TenantCommercialUsage } from "../types/domain";

const EMPTY_FORM = {
  tono_atencion: "cercano",
  saludo_inicial: "",
  speech_comercial_base: "",
  preguntas_frecuentes: "",
  objeciones_frecuentes: "",
  restricciones_respuesta: "",
  horario_atencion: "",
  mensajes_cierre: "",
  estilo_deseado: "consultivo",
  notas_adicionales: "",
  documento_base: "",
};

export function BrandResponsesAttentionPage() {
  const { token } = useAuth();
  const { tenantId: scopedTenantId } = useAdminContextScope();
  const [usage, setUsage] = useState<TenantCommercialUsage | null>(null);
  const [savedConfig, setSavedConfig] = useState<BrandResponsesConfig | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async (tenantId: number) => {
    if (!token) return;
    const [usageData, configData] = await Promise.all([
      api.getTenantCommercialUsage(token, tenantId).catch(() => null),
      api.getBrandResponsesConfig(token, tenantId).catch(() => null),
    ]);
    setUsage(usageData);
    setSavedConfig(configData);
    if (configData) {
      setForm({
        tono_atencion: configData.tono_atencion,
        saludo_inicial: configData.saludo_inicial,
        speech_comercial_base: configData.speech_comercial_base,
        preguntas_frecuentes: configData.preguntas_frecuentes,
        objeciones_frecuentes: configData.objeciones_frecuentes,
        restricciones_respuesta: configData.restricciones_respuesta,
        horario_atencion: configData.horario_atencion,
        mensajes_cierre: configData.mensajes_cierre,
        estilo_deseado: configData.estilo_deseado,
        notas_adicionales: configData.notas_adicionales || "",
        documento_base: configData.documento_base || "",
      });
    }
  };

  useEffect(() => {
    if (!scopedTenantId) return;
    load(scopedTenantId).catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar configuración."));
  }, [scopedTenantId, token]);

  const onUploadTextFile = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    setForm((prev) => ({ ...prev, documento_base: text.slice(0, 20000) }));
    setMessage(`Documento base cargado: ${file.name}`);
  };

  const saveConfig = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !scopedTenantId) return;
    try {
      setSaving(true);
      setError("");
      const data = await api.saveBrandResponsesConfig(token, scopedTenantId, {
        tenant_id: scopedTenantId,
        ...form,
      });
      setSavedConfig(data);
      setMessage("Configuración guardada. Aún falta enviarla a soporte para aplicación.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible guardar configuración.");
    } finally {
      setSaving(false);
    }
  };

  const submitToSupport = async () => {
    if (!token || !scopedTenantId) return;
    try {
      setSaving(true);
      setError("");
      const response = await api.submitBrandResponsesConfig(token, scopedTenantId);
      setMessage(response.message);
      await load(scopedTenantId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible enviar solicitud a soporte.");
    } finally {
      setSaving(false);
    }
  };

  const activeAgentsCount = savedConfig?.active_agents_count ?? usage?.ai_agents_used ?? 0;

  return (
    <section>
      <PageHeader
        title="Respuestas y atención"
        subtitle="Captura tu speech y estilo; REINPIA aplicará esta configuración en tus agentes activos vía soporte."
      />
      {error ? <p className="error">{error}</p> : null}
      {message ? <p>{message}</p> : null}
      {!scopedTenantId ? <p className="error">Selecciona una marca activa para configurar respuestas y atención.</p> : null}

      <article className="card">
        <h3>Contexto actual</h3>
        <p><strong>Agentes activos:</strong> {activeAgentsCount}</p>
        <p><strong>Configuración pendiente:</strong> {savedConfig?.pending_apply ? "Sí" : "No"}</p>
        <p><strong>Última actualización:</strong> {savedConfig?.last_updated_at ? new Date(savedConfig.last_updated_at).toLocaleString("es-MX") : "Sin actualización"}</p>
        {activeAgentsCount <= 0 ? (
          <p>
            No tienes agentes activos en este momento. Puedes adquirir add-on y luego enviar configuración.
            {" "}
            <Link to="/admin/capacity-expand">Ir a Expandir capacidad</Link>
          </p>
        ) : null}
      </article>

      <form className="detail-form card" onSubmit={saveConfig}>
        <h3>Speech y atención</h3>
        <label>Tono de atención<input value={form.tono_atencion} onChange={(e) => setForm((p) => ({ ...p, tono_atencion: e.target.value }))} /></label>
        <label>Saludo inicial<textarea rows={2} value={form.saludo_inicial} onChange={(e) => setForm((p) => ({ ...p, saludo_inicial: e.target.value }))} /></label>
        <label>Speech comercial base<textarea rows={4} value={form.speech_comercial_base} onChange={(e) => setForm((p) => ({ ...p, speech_comercial_base: e.target.value }))} /></label>
        <label>Preguntas frecuentes<textarea rows={4} value={form.preguntas_frecuentes} onChange={(e) => setForm((p) => ({ ...p, preguntas_frecuentes: e.target.value }))} /></label>
        <label>Objeciones frecuentes<textarea rows={4} value={form.objeciones_frecuentes} onChange={(e) => setForm((p) => ({ ...p, objeciones_frecuentes: e.target.value }))} /></label>
        <label>Restricciones de respuesta<textarea rows={3} value={form.restricciones_respuesta} onChange={(e) => setForm((p) => ({ ...p, restricciones_respuesta: e.target.value }))} /></label>
        <label>Horario de atención<textarea rows={2} value={form.horario_atencion} onChange={(e) => setForm((p) => ({ ...p, horario_atencion: e.target.value }))} /></label>
        <label>Mensajes de cierre<textarea rows={2} value={form.mensajes_cierre} onChange={(e) => setForm((p) => ({ ...p, mensajes_cierre: e.target.value }))} /></label>
        <label>Estilo deseado
          <select value={form.estilo_deseado} onChange={(e) => setForm((p) => ({ ...p, estilo_deseado: e.target.value }))}>
            <option value="formal">Formal</option>
            <option value="cercano">Cercano</option>
            <option value="consultivo">Consultivo</option>
            <option value="ventas">Ventas</option>
          </select>
        </label>
        <label>Notas adicionales<textarea rows={3} value={form.notas_adicionales} onChange={(e) => setForm((p) => ({ ...p, notas_adicionales: e.target.value }))} /></label>
        <label>Documento base (texto largo)<textarea rows={5} value={form.documento_base} onChange={(e) => setForm((p) => ({ ...p, documento_base: e.target.value }))} /></label>
        <label>Cargar documento base (.txt/.md)
          <input type="file" accept=".txt,.md" onChange={(e) => void onUploadTextFile(e.target.files?.[0] ?? null)} />
        </label>
        <div className="row-gap">
          <button className="button" type="submit" disabled={saving}>Guardar configuración</button>
          <button className="button button-outline" type="button" onClick={submitToSupport} disabled={saving}>Enviar solicitud a soporte</button>
        </div>
      </form>

      <article className="card">
        <p><strong>Nuestro equipo aplicará esta configuración en tus agentes activos.</strong></p>
      </article>
    </section>
  );
}
