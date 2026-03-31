import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { ModuleOnboardingCard } from "../components/ModuleOnboardingCard";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { AutomationEventLog, BotChannelConfig, BotMessageTemplate } from "../types/domain";

const EVENT_LABELS: Record<string, string> = {
  new_plan_lead: "Nuevo lead comercial",
  appointment_created: "Cita creada",
  order_paid: "Pago confirmado",
  logistics_delivered: "Entrega logistica completada",
  followup_required: "Seguimiento comercial pendiente",
};

export function AutomationAdminPage() {
  const { token, user } = useAuth();
  const tenantId = user?.tenant_id ?? undefined;
  const [events, setEvents] = useState<AutomationEventLog[]>([]);
  const [channels, setChannels] = useState<BotChannelConfig[]>([]);
  const [templates, setTemplates] = useState<BotMessageTemplate[]>([]);
  const [channelForm, setChannelForm] = useState({ channel: "whatsapp", is_enabled: false, provider_name: "pending", config_json: "{}" });
  const [templateForm, setTemplateForm] = useState({ event_type: "new_plan_lead", channel: "whatsapp", template_text: "Nuevo lead detectado", is_active: true });

  const load = () => {
    if (!token) return;
    const tenantQuery = tenantId ? `tenant_id=${tenantId}` : "";
    Promise.all([
      api.getAutomationEvents(token, tenantQuery),
      api.getAutomationChannels(token, tenantQuery),
      api.getAutomationTemplates(token, tenantQuery)
    ]).then(([eventsData, channelsData, templatesData]) => {
      setEvents(eventsData);
      setChannels(channelsData);
      setTemplates(templatesData);
    });
  };
  useEffect(() => { load(); }, [token, tenantId]);

  const saveChannel = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    await api.upsertAutomationChannel(token, { tenant_id: tenantId, ...channelForm });
    load();
  };

  const saveTemplate = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    await api.upsertAutomationTemplate(token, { tenant_id: tenantId, ...templateForm });
    load();
  };

  return (
    <section>
      <PageHeader title="Mensajes automaticos" subtitle="Configura seguimiento comercial, recordatorios y avisos de operacion sin complejidad tecnica." />
      <ModuleOnboardingCard
        moduleKey="automation"
        title="Automatizacion"
        whatItDoes="Define canales y mensajes para seguimiento comercial y avisos operativos."
        whyItMatters="Reduce trabajo manual y acelera respuesta en momentos clave del cliente."
        whatToCapture={["Canal (WhatsApp/Webchat)", "Evento disparador", "Plantilla de mensaje", "Estado habilitado"]}
        impact="Mejora conversion y cumplimiento operativo con comunicaciones consistentes."
      />
      <section className="card-grid">
        <article className="card">
          <h3>Que puedes automatizar</h3>
          <ul className="marketing-list">
            <li>Seguimiento comercial a nuevos leads.</li>
            <li>Confirmaciones de cita con fecha, hora e instrucciones.</li>
            <li>Notificaciones de pago confirmado o pendiente.</li>
            <li>Alertas de logistica para entrega y seguimiento.</li>
          </ul>
        </article>
      </section>
      <div className="card-grid">
        <form className="card" onSubmit={saveChannel}>
          <h3>Canal de mensajeria</h3>
          <select value={channelForm.channel} onChange={(e) => setChannelForm((p) => ({ ...p, channel: e.target.value }))}>
            <option value="whatsapp">WhatsApp (base)</option>
            <option value="webchat">Webchat</option>
          </select>
          <input placeholder="Proveedor" value={channelForm.provider_name} onChange={(e) => setChannelForm((p) => ({ ...p, provider_name: e.target.value }))} />
          <textarea placeholder="Configuracion JSON" value={channelForm.config_json} onChange={(e) => setChannelForm((p) => ({ ...p, config_json: e.target.value }))} />
          <label className="checkbox">
            <input type="checkbox" checked={channelForm.is_enabled} onChange={(e) => setChannelForm((p) => ({ ...p, is_enabled: e.target.checked }))} />
            Canal habilitado
          </label>
          <button className="button" type="submit">Guardar canal</button>
        </form>
        <form className="card" onSubmit={saveTemplate}>
          <h3>Mensaje automatico</h3>
          <select value={templateForm.event_type} onChange={(e) => setTemplateForm((p) => ({ ...p, event_type: e.target.value }))}>
            <option value="new_plan_lead">Nuevo lead comercial</option>
            <option value="appointment_created">Confirmacion de cita</option>
            <option value="order_paid">Notificacion de pago</option>
            <option value="logistics_delivered">Entrega logistica</option>
            <option value="followup_required">Recordatorio de seguimiento</option>
          </select>
          <select value={templateForm.channel} onChange={(e) => setTemplateForm((p) => ({ ...p, channel: e.target.value }))}>
            <option value="whatsapp">WhatsApp</option>
            <option value="webchat">Webchat</option>
          </select>
          <textarea value={templateForm.template_text} onChange={(e) => setTemplateForm((p) => ({ ...p, template_text: e.target.value }))} />
          <button className="button" type="submit">Guardar mensaje</button>
        </form>
      </div>
      <section className="card">
        <h3>Canales configurados</h3>
        <table className="table">
          <thead><tr><th>Canal</th><th>Proveedor</th><th>Habilitado</th></tr></thead>
          <tbody>
            {channels.map((channel) => (
              <tr key={channel.id}>
                <td>{channel.channel}</td>
                <td>{channel.provider_name}</td>
                <td>{channel.is_enabled ? "Si" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="card">
        <h3>Mensajes configurados</h3>
        <table className="table">
          <thead><tr><th>Evento</th><th>Canal</th><th>Texto</th></tr></thead>
          <tbody>
            {templates.map((template) => (
              <tr key={template.id}>
                <td>{EVENT_LABELS[template.event_type] ?? template.event_type}</td>
                <td>{template.channel}</td>
                <td>{template.template_text}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="card">
        <h3>Actividad reciente</h3>
        <table className="table">
          <thead><tr><th>Fecha</th><th>Evento</th><th>Entidad</th></tr></thead>
          <tbody>
            {events.slice(0, 20).map((row) => (
              <tr key={row.id}>
                <td>{new Date(row.created_at).toLocaleString("es-MX")}</td>
                <td>{EVENT_LABELS[row.event_type] ?? row.event_type}</td>
                <td>{row.related_entity_type}#{row.related_entity_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </section>
  );
}
