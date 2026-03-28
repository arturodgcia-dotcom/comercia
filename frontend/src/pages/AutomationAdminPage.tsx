import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { AutomationEventLog, BotChannelConfig, BotMessageTemplate } from "../types/domain";

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
      <PageHeader title="Automation Base" subtitle="Base de eventos y plantillas para futura integracion bots/WhatsApp." />
      <div className="card-grid">
        <form className="card" onSubmit={saveChannel}>
          <h3>Canal</h3>
          <select value={channelForm.channel} onChange={(e) => setChannelForm((p) => ({ ...p, channel: e.target.value }))}>
            <option value="whatsapp">whatsapp</option>
            <option value="webchat">webchat</option>
          </select>
          <input value={channelForm.provider_name} onChange={(e) => setChannelForm((p) => ({ ...p, provider_name: e.target.value }))} />
          <textarea value={channelForm.config_json} onChange={(e) => setChannelForm((p) => ({ ...p, config_json: e.target.value }))} />
          <label className="checkbox">
            <input type="checkbox" checked={channelForm.is_enabled} onChange={(e) => setChannelForm((p) => ({ ...p, is_enabled: e.target.checked }))} />
            Habilitado
          </label>
          <button className="button" type="submit">Guardar canal</button>
        </form>
        <form className="card" onSubmit={saveTemplate}>
          <h3>Template</h3>
          <select value={templateForm.event_type} onChange={(e) => setTemplateForm((p) => ({ ...p, event_type: e.target.value }))}>
            <option value="new_plan_lead">new_plan_lead</option>
            <option value="appointment_created">appointment_created</option>
            <option value="order_paid">order_paid</option>
            <option value="logistics_delivered">logistics_delivered</option>
            <option value="followup_required">followup_required</option>
          </select>
          <select value={templateForm.channel} onChange={(e) => setTemplateForm((p) => ({ ...p, channel: e.target.value }))}>
            <option value="whatsapp">whatsapp</option>
            <option value="webchat">webchat</option>
          </select>
          <textarea value={templateForm.template_text} onChange={(e) => setTemplateForm((p) => ({ ...p, template_text: e.target.value }))} />
          <button className="button" type="submit">Guardar template</button>
        </form>
      </div>
      <section className="card">
        <h3>Canales configurados</h3>
        <table className="table">
          <thead><tr><th>Canal</th><th>Provider</th><th>Enabled</th></tr></thead>
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
        <h3>Templates</h3>
        <table className="table">
          <thead><tr><th>Evento</th><th>Canal</th><th>Texto</th></tr></thead>
          <tbody>
            {templates.map((template) => (
              <tr key={template.id}>
                <td>{template.event_type}</td>
                <td>{template.channel}</td>
                <td>{template.template_text}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="card">
        <h3>Eventos internos</h3>
        <table className="table">
          <thead><tr><th>Fecha</th><th>Evento</th><th>Entidad</th></tr></thead>
          <tbody>
            {events.slice(0, 20).map((row) => (
              <tr key={row.id}>
                <td>{new Date(row.created_at).toLocaleString()}</td>
                <td>{row.event_type}</td>
                <td>{row.related_entity_type}#{row.related_entity_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </section>
  );
}
