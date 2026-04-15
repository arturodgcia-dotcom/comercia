import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { ModuleOnboardingCard } from "../components/ModuleOnboardingCard";
import { PageHeader } from "../components/PageHeader";
import { useAdminContextScope } from "../hooks/useAdminContextScope";
import { api } from "../services/api";
import { AdminUser, ContractTemplate, DistributorEmployee, DistributorProfile, DistributorProfileSummary, SignedContract, Tenant } from "../types/domain";

type DistributorKind = "marca_propia" | "externo";

const ROLES = ["vendedor", "gerente", "supervisor", "repartidor", "administrativo"];

export function DistributorsAdminPage() {
  const { token } = useAuth();
  const { tenantId: scopedTenantId } = useAdminContextScope();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState<number | null>(null);
  const [profiles, setProfiles] = useState<DistributorProfile[]>([]);
  const [summary, setSummary] = useState<DistributorProfileSummary[]>([]);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [signedContracts, setSignedContracts] = useState<SignedContract[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [employees, setEmployees] = useState<DistributorEmployee[]>([]);
  const [brandUsers, setBrandUsers] = useState<AdminUser[]>([]);
  const [pending, setPending] = useState<{ profileId: number; templateId: number; token: string } | null>(null);
  const [form, setForm] = useState({
    kind: "externo" as DistributorKind,
    business_name: "",
    contact_name: "",
    email: "",
    phone: "",
    warehouse_address: "",
    delivery_notes: "",
    custom_contract: false,
    custom_contract_name: "Contrato distribuidor personalizado",
    custom_contract_markdown: "",
  });
  const [signature, setSignature] = useState({
    signed_by_name: "",
    signed_by_email: "",
    mode: "digital",
    signature_text: "",
    accept_terms: false,
  });
  const [employeeForm, setEmployeeForm] = useState({ full_name: "", email: "", phone: "", role_name: "vendedor" });
  const [userForm, setUserForm] = useState({ full_name: "", email: "", role_name: "vendedor", password: "Distribuidor123!", phone: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedProfile = useMemo(() => profiles.find((x) => x.id === selectedProfileId) ?? null, [profiles, selectedProfileId]);
  const selectedSummary = useMemo(() => summary.find((x) => x.distributor_profile_id === selectedProfileId) ?? null, [summary, selectedProfileId]);
  const usersForSelectedProfile = useMemo(() => {
    if (!selectedProfile) return [];
    const emails = new Set([selectedProfile.email.toLowerCase(), ...employees.map((x) => x.email.toLowerCase())]);
    return brandUsers.filter((x) => x.role === "distributor_user" && emails.has(x.email.toLowerCase()));
  }, [brandUsers, employees, selectedProfile]);

  const loadMain = async (currentTenantId: number) => {
    if (!token) return;
    const [p, s, t, sc, bu] = await Promise.all([
      api.getDistributorsByTenant(token, currentTenantId),
      api.getDistributorSummaryByTenant(token, currentTenantId).catch(() => []),
      api.getContractTemplates(token, currentTenantId).catch(() => []),
      api.getSignedContractsByTenant(token, currentTenantId).catch(() => []),
      api.getAdminUsers(token, { scope: "brand", tenant_id: currentTenantId }).catch(() => []),
    ]);
    setProfiles(p);
    setSummary(s);
    setTemplates(t);
    setSignedContracts(sc);
    setBrandUsers(bu);
    setSelectedProfileId((prev) => prev ?? p[0]?.id ?? null);
  };

  useEffect(() => {
    if (!token) return;
    api.getTenants(token).then((rows) => {
      setTenants(rows);
      const first = scopedTenantId && rows.some((x) => x.id === scopedTenantId) ? scopedTenantId : rows[0]?.id ?? null;
      setTenantId((prev) => prev ?? first);
    }).catch(() => setTenants([]));
  }, [scopedTenantId, token]);

  useEffect(() => {
    if (!tenantId) return;
    loadMain(tenantId).catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar distribuidores"));
  }, [tenantId, token]);

  useEffect(() => {
    if (!token || !selectedProfileId) return;
    api.getDistributorEmployees(token, selectedProfileId).then(setEmployees).catch(() => setEmployees([]));
  }, [selectedProfileId, token]);

  const resolveTemplateId = async (currentTenantId: number) => {
    if (!token) throw new Error("Sin sesion");
    if (form.custom_contract) {
      const created = await api.createContractTemplate(token, {
        tenant_id: currentTenantId,
        contract_type: "distributor",
        name: form.custom_contract_name,
        content_markdown: form.custom_contract_markdown || "## Contrato personalizado\n\nTerminos de autorizacion por marca.",
        is_active: true,
      });
      return created.id;
    }
    const current = templates.find((x) => x.is_active) ?? templates[0];
    if (current) return current.id;
    const rows = await api.getContractTemplates(token, currentTenantId);
    return rows[0]?.id;
  };

  const createDistributor = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !tenantId) return;
    try {
      setSaving(true);
      setError("");
      const profile = await api.createDistributorProfile(token, {
        tenant_id: tenantId,
        business_name: form.business_name,
        contact_name: form.contact_name,
        email: form.email.toLowerCase(),
        phone: form.phone,
        warehouse_address: form.warehouse_address || null,
        delivery_notes: form.delivery_notes || null,
        is_authorized: form.kind === "marca_propia",
      });
      if (form.kind === "marca_propia") {
        setMessage("Distribuidor propio registrado. No requiere autorizacion contractual.");
        setPending(null);
      } else {
        const templateId = await resolveTemplateId(tenantId);
        const tokenLink = `firma-${profile.id}-${Math.random().toString(36).slice(2, 10)}`;
        setPending({ profileId: profile.id, templateId, token: tokenLink });
        setMessage(`Distribuidor pendiente de firma. Link temporal: ${window.location.origin}/admin/distributors?sign_token=${tokenLink}`);
      }
      setForm({
        kind: "externo",
        business_name: "",
        contact_name: "",
        email: "",
        phone: "",
        warehouse_address: "",
        delivery_notes: "",
        custom_contract: false,
        custom_contract_name: "Contrato distribuidor personalizado",
        custom_contract_markdown: "",
      });
      await loadMain(tenantId);
      setSelectedProfileId(profile.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible registrar distribuidor.");
    } finally {
      setSaving(false);
    }
  };

  const signAndAuthorize = async () => {
    if (!token || !tenantId || !pending) return;
    if (!signature.accept_terms) {
      setError("Debes aceptar terminos para autorizar.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      await api.signContract({
        tenant_id: tenantId,
        contract_template_id: pending.templateId,
        distributor_profile_id: pending.profileId,
        signed_by_name: signature.signed_by_name,
        signed_by_email: signature.signed_by_email.toLowerCase(),
        signature_text: `${signature.mode === "autografa" ? "AUTOGRAFA" : "DIGITAL"}:${signature.signature_text}`,
        accept_terms: true,
      });
      await api.authorizeDistributorProfile(token, pending.profileId, "Autorizado por firma contractual.");
      setMessage("Distribuidor autorizado y copia enviada por correo al firmante.");
      setPending(null);
      setSignature({ signed_by_name: "", signed_by_email: "", mode: "digital", signature_text: "", accept_terms: false });
      await loadMain(tenantId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible firmar y autorizar.");
    } finally {
      setSaving(false);
    }
  };

  const addEmployee = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !tenantId || !selectedProfileId) return;
    await api.createDistributorEmployee(token, {
      tenant_id: tenantId,
      distributor_profile_id: selectedProfileId,
      full_name: employeeForm.full_name,
      email: employeeForm.email.toLowerCase(),
      phone: employeeForm.phone || undefined,
      role_name: employeeForm.role_name || "vendedor",
      is_active: true,
    });
    setEmployeeForm({ full_name: "", email: "", phone: "", role_name: "vendedor" });
    setEmployees(await api.getDistributorEmployees(token, selectedProfileId));
    await loadMain(tenantId);
  };

  const addDistributorUser = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !tenantId || !selectedProfileId) return;
    await api.createAdminUser(token, { scope: "brand", tenant_id: tenantId }, {
      full_name: userForm.full_name,
      email: userForm.email.toLowerCase(),
      role: "distributor_user",
      password: userForm.password,
      preferred_language: "es",
      is_active: true,
    });
    await api.createDistributorEmployee(token, {
      tenant_id: tenantId,
      distributor_profile_id: selectedProfileId,
      full_name: userForm.full_name,
      email: userForm.email.toLowerCase(),
      phone: userForm.phone || undefined,
      role_name: userForm.role_name,
      is_active: true,
    });
    setUserForm({ full_name: "", email: "", role_name: "vendedor", password: "Distribuidor123!", phone: "" });
    setMessage("Usuario de distribuidor registrado y asociado al control NFC.");
    setEmployees(await api.getDistributorEmployees(token, selectedProfileId));
    await loadMain(tenantId);
  };

  return (
    <section>
      <PageHeader title="Distribuidores" subtitle="Alta con contrato, firma y control de usuarios por distribuidor." />
      <ModuleOnboardingCard
        moduleKey="distributors"
        title="Canal distribuidores"
        whatItDoes="Permite alta, autorizacion contractual y gestion de usuarios de cada distribuidor."
        whyItMatters="Controla trazabilidad legal y operativa por marca."
        whatToCapture={["Datos base", "Tipo de distribuidor", "Contrato/firma", "Usuarios y roles"]}
        impact="Mejora seguridad comercial y control para credenciales NFC."
      />
      {error ? <p className="error">{error}</p> : null}
      {message ? <p>{message}</p> : null}

      <article className="card">
        <h3>Marca</h3>
        <select value={tenantId ?? ""} onChange={(e) => setTenantId(Number(e.target.value))}>
          {tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name}</option>)}
        </select>
      </article>

      <article className="card">
        <h3>Alta de distribuidor</h3>
        <form className="detail-form" onSubmit={createDistributor}>
          <label>Tipo
            <select value={form.kind} onChange={(e) => setForm((p) => ({ ...p, kind: e.target.value as DistributorKind }))}>
              <option value="externo">Externo (requiere autorizacion y contrato)</option>
              <option value="marca_propia">Propio de la marca (sin autorizacion)</option>
            </select>
          </label>
          <label>Nombre comercial<input required value={form.business_name} onChange={(e) => setForm((p) => ({ ...p, business_name: e.target.value }))} /></label>
          <label>Contacto<input required value={form.contact_name} onChange={(e) => setForm((p) => ({ ...p, contact_name: e.target.value }))} /></label>
          <label>Correo<input required type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} /></label>
          <label>Telefono<input required value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} /></label>
          <label>Domicilio (control interno)<textarea value={form.warehouse_address} onChange={(e) => setForm((p) => ({ ...p, warehouse_address: e.target.value }))} /></label>
          <label>Notas de entrega<textarea value={form.delivery_notes} onChange={(e) => setForm((p) => ({ ...p, delivery_notes: e.target.value }))} /></label>
          {form.kind === "externo" ? (
            <article className="card">
              <h4>Contrato</h4>
              <label className="checkbox"><input type="checkbox" checked={form.custom_contract} onChange={(e) => setForm((p) => ({ ...p, custom_contract: e.target.checked }))} />Usar contrato propio de la marca</label>
              {form.custom_contract ? (
                <>
                  <label>Nombre contrato<input value={form.custom_contract_name} onChange={(e) => setForm((p) => ({ ...p, custom_contract_name: e.target.value }))} /></label>
                  <label>Contenido demo<textarea rows={5} value={form.custom_contract_markdown} onChange={(e) => setForm((p) => ({ ...p, custom_contract_markdown: e.target.value }))} /></label>
                </>
              ) : null}
            </article>
          ) : null}
          <button className="button" type="submit" disabled={saving}>{saving ? "Guardando..." : "Registrar distribuidor"}</button>
        </form>
      </article>

      {pending ? (
        <article className="card">
          <h3>Firma contractual</h3>
          <p>Token temporal (un solo uso): {pending.token}</p>
          <div className="detail-form">
            <label>Firmante<input value={signature.signed_by_name} onChange={(e) => setSignature((p) => ({ ...p, signed_by_name: e.target.value }))} /></label>
            <label>Correo firmante<input type="email" value={signature.signed_by_email} onChange={(e) => setSignature((p) => ({ ...p, signed_by_email: e.target.value }))} /></label>
            <label>Modo firma<select value={signature.mode} onChange={(e) => setSignature((p) => ({ ...p, mode: e.target.value }))}><option value="digital">Digital</option><option value="autografa">Autografa</option></select></label>
            <label>Firma<input value={signature.signature_text} onChange={(e) => setSignature((p) => ({ ...p, signature_text: e.target.value }))} /></label>
            <label className="checkbox"><input type="checkbox" checked={signature.accept_terms} onChange={(e) => setSignature((p) => ({ ...p, accept_terms: e.target.checked }))} />Acepto contrato y autorizacion</label>
            <button className="button" type="button" onClick={() => void signAndAuthorize()} disabled={saving}>Firmar y autorizar</button>
          </div>
        </article>
      ) : null}

      <article className="card">
        <h3>Distribuidores por marca (informativo)</h3>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>ID</th><th>Distribuidor</th><th>Autorizacion</th><th>Ventas POS</th><th>Usuarios</th><th>Empleados</th></tr></thead>
            <tbody>
              {profiles.map((profile) => {
                const row = summary.find((x) => x.distributor_profile_id === profile.id);
                return (
                  <tr key={profile.id} onClick={() => setSelectedProfileId(profile.id)} style={{ cursor: "pointer", background: selectedProfileId === profile.id ? "#f4f9ff" : "transparent" }}>
                    <td>{profile.id}</td>
                    <td>{profile.business_name}<br />{profile.contact_name}<br />{profile.email}</td>
                    <td>{profile.is_authorized ? "Autorizado" : "Pendiente"}</td>
                    <td>{row?.pos_sales_count ?? 0} / ${Number(row?.pos_sales_total_mxn ?? 0).toLocaleString("es-MX")}</td>
                    <td>{row?.distributor_users_count ?? 0}</td>
                    <td>{row?.employees_count ?? 0}</td>
                  </tr>
                );
              })}
              {!profiles.length ? <tr><td colSpan={6}>Sin distribuidores registrados.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </article>

      {selectedProfile ? (
        <>
          <article className="card">
            <h3>Detalle de distribuidor</h3>
            <p><strong>Negocio:</strong> {selectedProfile.business_name}</p>
            <p><strong>Domicilio:</strong> {selectedProfile.warehouse_address || "Sin domicilio"}</p>
            <p><strong>Ventas POS:</strong> {selectedSummary?.pos_sales_count ?? 0} operaciones / ${Number(selectedSummary?.pos_sales_total_mxn ?? 0).toLocaleString("es-MX")}</p>
          </article>

          <article className="card">
            <h3>Usuarios de distribuidor (NFC / rol)</h3>
            <form className="inline-form" onSubmit={addDistributorUser}>
              <input required placeholder="Nombre" value={userForm.full_name} onChange={(e) => setUserForm((p) => ({ ...p, full_name: e.target.value }))} />
              <input required type="email" placeholder="Correo" value={userForm.email} onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))} />
              <select value={userForm.role_name} onChange={(e) => setUserForm((p) => ({ ...p, role_name: e.target.value }))}>{ROLES.map((r) => <option key={r} value={r}>{r}</option>)}</select>
              <input placeholder="Telefono" value={userForm.phone} onChange={(e) => setUserForm((p) => ({ ...p, phone: e.target.value }))} />
              <input placeholder="Password temporal" value={userForm.password} onChange={(e) => setUserForm((p) => ({ ...p, password: e.target.value }))} />
              <button className="button" type="submit">Registrar usuario</button>
            </form>
            <div className="table-wrapper">
              <table>
                <thead><tr><th>ID</th><th>Nombre</th><th>Correo</th><th>Rol app</th><th>Estado</th></tr></thead>
                <tbody>
                  {usersForSelectedProfile.map((u) => <tr key={u.id}><td>{u.id}</td><td>{u.full_name}</td><td>{u.email}</td><td>{u.role}</td><td>{u.is_active ? "Activo" : "Inactivo"}</td></tr>)}
                  {!usersForSelectedProfile.length ? <tr><td colSpan={5}>Sin usuarios de distribuidor asociados.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </article>

          <article className="card">
            <h3>Empleados del distribuidor</h3>
            <form className="inline-form" onSubmit={addEmployee}>
              <input required placeholder="Nombre" value={employeeForm.full_name} onChange={(e) => setEmployeeForm((p) => ({ ...p, full_name: e.target.value }))} />
              <input required placeholder="Correo" value={employeeForm.email} onChange={(e) => setEmployeeForm((p) => ({ ...p, email: e.target.value }))} />
              <input placeholder="Telefono" value={employeeForm.phone} onChange={(e) => setEmployeeForm((p) => ({ ...p, phone: e.target.value }))} />
              <select value={employeeForm.role_name} onChange={(e) => setEmployeeForm((p) => ({ ...p, role_name: e.target.value }))}>{ROLES.map((r) => <option key={r} value={r}>{r}</option>)}</select>
              <button className="button" type="submit">Agregar empleado</button>
            </form>
            <div className="table-wrapper">
              <table>
                <thead><tr><th>ID</th><th>Nombre</th><th>Email</th><th>Puesto</th><th>Activo</th></tr></thead>
                <tbody>
                  {employees.map((e) => <tr key={e.id}><td>{e.id}</td><td>{e.full_name}</td><td>{e.email}</td><td>{e.role_name || "-"}</td><td>{e.is_active ? "Si" : "No"}</td></tr>)}
                  {!employees.length ? <tr><td colSpan={5}>Sin empleados.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </article>
        </>
      ) : null}

      <article className="card">
        <h3>Contratos firmados</h3>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Folio</th><th>Distribuidor</th><th>Firmante</th><th>Correo</th><th>Fecha</th></tr></thead>
            <tbody>
              {signedContracts.map((c) => {
                const profile = profiles.find((p) => p.id === c.distributor_profile_id);
                return <tr key={c.id}><td>{c.id}</td><td>{profile?.business_name || "Sin referencia"}</td><td>{c.signed_by_name}</td><td>{c.signed_by_email}</td><td>{new Date(c.signed_at).toLocaleString("es-MX")}</td></tr>;
              })}
              {!signedContracts.length ? <tr><td colSpan={5}>Sin contratos firmados.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
