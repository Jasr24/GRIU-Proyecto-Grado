import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const statuses = ['submitted', 'in_review', 'assigned', 'in_progress', 'resolved', 'rejected'];

async function api(path, options = {}, session) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}`, ...(options.headers || {}) }
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'No fue posible completar la solicitud');
  return body;
}

function Auth({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', full_name: '' });
  const [message, setMessage] = useState('');
  const submit = async (event) => {
    event.preventDefault(); setMessage('');
    const result = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
      : await supabase.auth.signUp({ email: form.email, password: form.password, options: { data: { full_name: form.full_name } } });
    if (result.error) return setMessage(result.error.message);
    if (mode === 'register' && !result.data.session) return setMessage('Revisa tu correo para confirmar la cuenta.');
    onAuth(result.data.session);
  };
  return <main className="auth-page"><section className="auth-card"><p className="eyebrow">GRIU · NEIVA</p><h1>{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</h1><p>Gestión de reportes de incidentes urbanos.</p><form onSubmit={submit}>{mode === 'register' && <input placeholder="Nombre completo" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required />}<input type="email" placeholder="Correo electrónico" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /><input type="password" placeholder="Contraseña" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength="6" /><button>{mode === 'login' ? 'Entrar' : 'Registrarme'}</button></form>{message && <p className="message">{message}</p>}<button className="link-button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Crear una cuenta' : 'Ya tengo una cuenta'}</button></section></main>;
}

function Citizen({ session, onLogout }) {
  const [categories, setCategories] = useState([]); const [reports, setReports] = useState([]); const [message, setMessage] = useState('');
  const [form, setForm] = useState({ category_id: '', title: '', description: '', barrio: '', commune: '', address: '' });
  const load = async () => { setCategories(await api('/api/categories', {}, session)); setReports(await api('/api/reports', {}, session)); };
  useEffect(() => { load().catch(e => setMessage(e.message)); }, []);
  const submit = async e => { e.preventDefault(); try { const report = await api('/api/reports', { method: 'POST', body: JSON.stringify(form) }, session); setMessage(`Reporte creado: ${report.report_code}`); setForm({ category_id: '', title: '', description: '', barrio: '', commune: '', address: '' }); load(); } catch (error) { setMessage(error.message); } };
  return <Dashboard title="Panel ciudadano" onLogout={onLogout}><div className="grid"><section className="panel"><h2>Crear reporte</h2><form onSubmit={submit} className="stack"><select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} required><option value="">Seleccione una categoría</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><input placeholder="Título del incidente" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /><textarea placeholder="Descripción" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required /><input placeholder="Barrio o comuna" value={form.barrio} onChange={e => setForm({ ...form, barrio: e.target.value })} required /><input placeholder="Dirección o referencia" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /><button>Enviar reporte</button></form>{message && <p className="message">{message}</p>}</section><section className="panel"><h2>Mis reportes</h2>{reports.length === 0 ? <p>Aún no tienes reportes.</p> : reports.map(r => <article className="report" key={r.id}><strong>{r.report_code}</strong><span>{r.title}</span><small>{r.incident_categories?.name} · {r.status}</small></article>)}</section></div></Dashboard>;
}

function Admin({ session, onLogout }) {
  const [reports, setReports] = useState([]); const [message, setMessage] = useState('');
  const load = () => api('/api/reports', {}, session).then(setReports).catch(e => setMessage(e.message));
  useEffect(load, []);
  const update = async (r, status) => { try { await api(`/api/reports/${r.id}`, { method: 'PATCH', body: JSON.stringify({ status, priority: r.priority, note: `Estado cambiado a ${status}` }) }, session); load(); } catch (e) { setMessage(e.message); } };
  return <Dashboard title="Panel administrativo" onLogout={onLogout}><section className="panel"><div className="panel-heading"><div><p className="eyebrow">GESTIÓN ADMINISTRATIVA</p><h2>Reportes recibidos</h2></div><button onClick={load}>Actualizar</button></div>{message && <p className="message">{message}</p>}<div className="table-wrap"><table><thead><tr><th>Código</th><th>Incidente</th><th>Categoría</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{reports.map(r => <tr key={r.id}><td>{r.report_code}</td><td>{r.title}</td><td>{r.incident_categories?.name}</td><td><span className="badge">{r.status}</span></td><td><select value={r.status} onChange={e => update(r, e.target.value)}>{statuses.map(s => <option key={s}>{s}</option>)}</select></td></tr>)}</tbody></table></div></section></Dashboard>;
}

function Dashboard({ title, onLogout, children }) { return <><header className="topbar"><div><strong>GRIU</strong><span>Gestión de incidentes urbanos · Neiva</span></div><button className="link-button" onClick={onLogout}>Cerrar sesión</button></header><main className="page"><p className="eyebrow">PARTICIPACIÓN CIUDADANA</p><h1>{title}</h1>{children}</main></>; }

export default function App() {
  const [session, setSession] = useState(null); const [role, setRole] = useState(null); const [loading, setLoading] = useState(true);
  useEffect(() => { supabase.auth.getSession().then(async ({ data }) => { setSession(data.session); if (data.session) { const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.session.user.id).single(); setRole(profile?.role || 'citizen'); } setLoading(false); }); }, []);
  const logout = async () => { await supabase.auth.signOut(); setSession(null); setRole(null); };
  if (loading) return <div className="loading">Cargando GRIU...</div>;
  if (!session) return <Auth onAuth={async s => { setSession(s); const { data } = await supabase.from('profiles').select('role').eq('id', s.user.id).single(); setRole(data?.role || 'citizen'); }} />;
  return role === 'admin' ? <Admin session={session} onLogout={logout} /> : <Citizen session={session} onLogout={logout} />;
}
