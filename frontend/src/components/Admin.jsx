import React, { useEffect, useState } from "react";
import Dashboard from "./Dashboard";
import { api } from "../services/api";

const statuses = [
  "submitted",
  "in_review",
  "assigned",
  "in_progress",
  "resolved",
  "rejected",
];

export default function Admin({ session, onLogout }) {
  const [reports, setReports] = useState([]);
  const [message, setMessage] = useState("");
  const load = () =>
    api("/api/reports", {}, session)
      .then(setReports)
      .catch((e) => setMessage(e.message));
  useEffect(() => {
    load();
  }, []);
  const update = async (r, status) => {
    try {
      await api(
        `/api/reports/${r.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status,
            priority: r.priority,
            note: `Estado cambiado a ${status}`,
          }),
        },
        session,
      );
      load();
    } catch (e) {
      setMessage(e.message);
    }
  };
  return (
    <Dashboard title="Panel administrativo" onLogout={onLogout}>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">GESTIÓN ADMINISTRATIVA</p>
            <h2>Reportes recibidos</h2>
          </div>
          <button onClick={load}>Actualizar</button>
        </div>
        {message && <p className="message">{message}</p>}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Incidente</th>
                <th>Categoría</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td>{r.report_code}</td>
                  <td>{r.title}</td>
                  <td>{r.incident_categories?.name}</td>
                  <td>
                    <span className="badge">{r.status}</span>
                  </td>
                  <td>
                    <select
                      value={r.status}
                      onChange={(e) => update(r, e.target.value)}
                    >
                      {statuses.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </Dashboard>
  );
}
