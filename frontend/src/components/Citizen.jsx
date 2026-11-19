import React, { useEffect, useState } from 'react';
import Dashboard from './Dashboard';
import { api } from '../services/api';

export default function Citizen({ session, onLogout }) {
  const [categories, setCategories] = useState([]); const [reports, setReports] = useState([]); const [message, setMessage] = useState('');
  const [form, setForm] = useState({ category_id: '', title: '', description: '', barrio: '', commune: '', address: '' });
  const load = async () => { setCategories(await api('/api/categories', {}, session)); setReports(await api('/api/reports', {}, session)); };
  useEffect(() => { load().catch(e => setMessage(e.message)); }, []);
  const submit = async e => { e.preventDefault(); try { const report = await api('/api/reports', { method: 'POST', body: JSON.stringify(form) }, session); setMessage(`Reporte creado: ${report.report_code}`); setForm({ category_id: '', title: '', description: '', barrio: '', commune: '', address: '' }); load(); } catch (error) { setMessage(error.message); } };
  return <Dashboard title="Panel ciudadano" onLogout={onLogout}><div className="grid"><section className="panel"><h2>Crear reporte</h2><form onSubmit={submit} className="stack"><select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} required><option value="">Seleccione una categoría</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><input placeholder="Título del incidente" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /><textarea placeholder="Descripción" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required /><input placeholder="Barrio o comuna" value={form.barrio} onChange={e => setForm({ ...form, barrio: e.target.value })} required /><input placeholder="Dirección o referencia" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /><button>Enviar reporte</button></form>{message && <p className="message">{message}</p>}</section><section className="panel"><h2>Mis reportes</h2>{reports.length === 0 ? <p>Aún no tienes reportes.</p> : reports.map(r => <article className="report" key={r.id}><strong>{r.report_code}</strong><span>{r.title}</span><small>{r.incident_categories?.name} · {r.status}</small></article>)}</section></div></Dashboard>;
}
