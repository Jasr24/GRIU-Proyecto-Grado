import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";

export default function CreateReport({ session }) {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    category_id: "",
    title: "",
    description: "",
    barrio: "",
    commune: "",
    address: "",
  });
  useEffect(() => {
    api("/api/categories", {}, session)
      .then(setCategories)
      .catch((e) => setMessage(e.message));
  }, []);
  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const report = await api(
        "/api/reports",
        { method: "POST", body: JSON.stringify(form) },
        session,
      );
      navigate(`/ciudadano/seguimiento/${report.id}`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <section className="page-panel">
      <div className="page-panel-heading">
        <div>
          <p className="eyebrow">NUEVO REPORTE</p>
          <h1>Crear reporte</h1>
          <p>Cuéntanos qué está ocurriendo en tu barrio.</p>
        </div>
        <Link className="link-button" to="/ciudadano">
          ← Volver al inicio
        </Link>
      </div>
      <form onSubmit={submit} className="report-form">
        <label>
          Categoría *
          <select
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            required
          >
            <option value="">Seleccione una categoría</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Título del incidente *
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Ejemplo: Hueco en la vía"
            required
          />
        </label>
        <label>
          Descripción *
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe lo que ocurre"
            required
          />
        </label>
        <div className="field-grid">
          <label>
            Barrio o comuna *
            <input
              value={form.barrio}
              onChange={(e) => setForm({ ...form, barrio: e.target.value })}
              required
            />
          </label>
          <label>
            Dirección o referencia
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </label>
        </div>
        <button className="submit-button" disabled={loading}>
          {loading ? "Enviando reporte..." : "Enviar reporte"}
        </button>
        {message && <p className="message">{message}</p>}
      </form>
    </section>
  );
}
