import React, { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
const statuses = [
  "submitted",
  "in_review",
  "assigned",
  "in_progress",
  "resolved",
  "rejected",
];

async function api(path, options = {}, session) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      ...(options.headers || {}),
    },
  });
  const body = await response.json();
  if (!response.ok)
    throw new Error(body.error || "No fue posible completar la solicitud");
  return body;
}

function friendlyAuthError(error) {
  const message = error?.message || "";
  if (
    error?.code === "over_email_send_rate_limit" ||
    message.includes("email rate limit exceeded")
  ) {
    return "Se alcanzó el límite temporal de correos de confirmación. Espera un momento o desactiva temporalmente la confirmación de correo para las pruebas.";
  }
  if (message.includes("For security purposes")) {
    return "Por seguridad, debes esperar 48 segundos antes de solicitar otro correo de confirmación.";
  }
  if (message.includes("User already registered")) {
    return "Este correo ya está registrado. Intenta iniciar sesión.";
  }
  if (message.includes("Invalid login credentials")) {
    return "El correo o la contraseña no son correctos.";
  }
  if (message.includes("Email not confirmed")) {
    return "Debes confirmar tu correo electrónico antes de iniciar sesión.";
  }
  return "No fue posible completar la solicitud. Intenta nuevamente.";
}

function Auth({ onAuth }) {
  const [mode, setMode] = useState("register");
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    document_type: "Cédula de ciudadanía",
    document_number: "",
    email: "",
    phone: "",
    password: "",
    consent: false,
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    if (loading) return;
    setMessage("");
    if (mode === "register" && !form.consent)
      return setMessage("Debes aceptar el tratamiento de datos personales.");
    setLoading(true);
    const startedAt = Date.now();
    try {
      const result =
        mode === "login"
          ? await supabase.auth.signInWithPassword({
              email: form.email,
              password: form.password,
            })
          : await supabase.auth.signUp({
              email: form.email,
              password: form.password,
              options: {
                data: {
                  full_name: `${form.first_name} ${form.last_name}`.trim(),
                  first_name: form.first_name,
                  last_name: form.last_name,
                  document_type: form.document_type,
                  document_number: form.document_number,
                  phone: form.phone,
                  consent_accepted: true,
                },
              },
            });
      if (result.error) throw result.error;
      if (mode === "register" && result.data.user?.identities?.length === 0) {
        return setMessage("Este correo ya tiene una cuenta. Inicia sesión.");
      }
      if (mode === "register" && !result.data.session)
        return setMessage("Revisa tu correo para confirmar la cuenta.");
      await onAuth(result.data.session);
    } catch (error) {
      setMessage(friendlyAuthError(error));
    } finally {
      const remaining = 450 - (Date.now() - startedAt);
      if (remaining > 0)
        await new Promise((resolve) => setTimeout(resolve, remaining));
      setLoading(false);
    }
  };
  const register = mode === "register";
  const update = (name, value) =>
    setForm((current) => ({ ...current, [name]: value }));
  return (
    <main className="auth-page">
      <section className="auth-shell">
        <header className="auth-nav">
          <div className="brand">
            <strong>GRIU</strong>
            <small>
              NEIVA
              <br />
              <span>Gestión de incidentes urbanos</span>
            </small>
          </div>
          <span className="nav-tag">Una ciudad que escucha</span>
          <div className="nav-actions">
            <button className="outline-button" onClick={() => setMode("login")}>
              Iniciar sesión
            </button>
            <button className="nav-primary" onClick={() => setMode("register")}>
              Registrarse
            </button>
          </div>
        </header>
        <div className="auth-content">
          {register && (
            <aside className="auth-intro">
              <span className="intro-pill">GRIU · NEIVA</span>
              <h2>
                Tu ciudad necesita
                <br />
                tu mirada.
              </h2>
              <p>
                Un solo lugar para reportar, consultar y hacer seguimiento a lo
                que importa en tu barrio.
              </p>
              <ul>
                <li>
                  <b>01</b> Reporta en pocos pasos
                </li>
                <li>
                  <b>02</b> Recibe actualizaciones claras
                </li>
                <li>
                  <b>03</b> Construyamos una mejor Neiva
                </li>
              </ul>
              <small>Si hay una emergencia, comunícate al 123.</small>
            </aside>
          )}
          <section className="auth-form-panel">
            <p className="eyebrow">
              {register ? "REGISTRO CIUDADANO" : "ACCESO A GRIU"}
            </p>
            <h1>{register ? "Crea tu cuenta ciudadana" : "Iniciar sesión"}</h1>
            <p className="form-lead">
              {register
                ? "Regístrate y empieza a transformar tu entorno."
                : "Ingresa para consultar y gestionar tus reportes."}
            </p>
            <form onSubmit={submit} className="register-form">
              {register && (
                <>
                  <div className="field-grid">
                    <label>
                      Nombres *
                      <input
                        placeholder="María Fernanda"
                        value={form.first_name}
                        onChange={(e) => update("first_name", e.target.value)}
                        required
                      />
                    </label>
                    <label>
                      Apellidos *
                      <input
                        placeholder="Rojas"
                        value={form.last_name}
                        onChange={(e) => update("last_name", e.target.value)}
                        required
                      />
                    </label>
                  </div>
                  <div className="field-grid">
                    <label>
                      Tipo de documento *
                      <select
                        value={form.document_type}
                        onChange={(e) =>
                          update("document_type", e.target.value)
                        }
                      >
                        <option>Cédula de ciudadanía</option>
                        <option>Tarjeta de identidad</option>
                        <option>Cédula de extranjería</option>
                      </select>
                    </label>
                    <label>
                      Número de documento *
                      <input
                        value={form.document_number}
                        onChange={(e) =>
                          update("document_number", e.target.value)
                        }
                        required
                      />
                    </label>
                  </div>
                </>
              )}
              <label>
                Correo electrónico *
                <input
                  type="email"
                  placeholder="maria.rojas@correo.co"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  required
                />
              </label>
              {register && (
                <label>
                  Celular *
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    maxLength="10"
                    placeholder="3105550148"
                    value={form.phone}
                    onChange={(e) =>
                      update(
                        "phone",
                        e.target.value.replace(/\D/g, "").slice(0, 10),
                      )
                    }
                    title="Ingresa exactamente 10 números"
                    required
                  />
                  <small className="hint">
                    Solo números, exactamente 10 dígitos.
                  </small>
                </label>
              )}
              <label>
                Contraseña *
                <input
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  required
                  minLength="8"
                />
              </label>
              {register && (
                <>
                  <small className="hint">
                    Mínimo 8 caracteres, una mayúscula y un número.
                  </small>
                  <label className="consent">
                    <input
                      type="checkbox"
                      checked={form.consent}
                      onChange={(e) => update("consent", e.target.checked)}
                    />{" "}
                    <span>
                      Acepto los términos de uso y autorizo el tratamiento de
                      mis datos personales conforme a la Ley 1581 de 2012.
                    </span>
                  </label>
                </>
              )}
              <button
                className="submit-button"
                disabled={loading}
                aria-busy={loading}
              >
                {loading && <span className="spinner" aria-hidden="true" />}
                {loading
                  ? register
                    ? "Creando cuenta..."
                    : "Ingresando..."
                  : register
                    ? "Crear cuenta y continuar"
                    : "Ingresar"}
              </button>
            </form>
            {message && <p className="message">{message}</p>}
            <button
              className="link-button"
              onClick={() => setMode(register ? "login" : "register")}
            >
              {register
                ? "¿Ya tienes cuenta? Inicia sesión →"
                : "¿No tienes cuenta? Regístrate →"}
            </button>
            {register && (
              <small className="demo-note">
                Datos de ejemplo para explorar el recorrido.
              </small>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function Citizen({ session, onLogout }) {
  const [categories, setCategories] = useState([]);
  const [reports, setReports] = useState([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    category_id: "",
    title: "",
    description: "",
    barrio: "",
    commune: "",
    address: "",
  });
  const load = async () => {
    setCategories(await api("/api/categories", {}, session));
    setReports(await api("/api/reports", {}, session));
  };
  useEffect(() => {
    load().catch((e) => setMessage(e.message));
  }, []);
  const submit = async (e) => {
    e.preventDefault();
    try {
      const report = await api(
        "/api/reports",
        { method: "POST", body: JSON.stringify(form) },
        session,
      );
      setMessage(`Reporte creado: ${report.report_code}`);
      setForm({
        category_id: "",
        title: "",
        description: "",
        barrio: "",
        commune: "",
        address: "",
      });
      load();
    } catch (error) {
      setMessage(error.message);
    }
  };
  return (
    <Dashboard title="Panel ciudadano" onLogout={onLogout}>
      <div className="grid">
        <section className="panel">
          <h2>Crear reporte</h2>
          <form onSubmit={submit} className="stack">
            <select
              value={form.category_id}
              onChange={(e) =>
                setForm({ ...form, category_id: e.target.value })
              }
              required
            >
              <option value="">Seleccione una categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              placeholder="Título del incidente"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <textarea
              placeholder="Descripción"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              required
            />
            <input
              placeholder="Barrio o comuna"
              value={form.barrio}
              onChange={(e) => setForm({ ...form, barrio: e.target.value })}
              required
            />
            <input
              placeholder="Dirección o referencia"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <button>Enviar reporte</button>
          </form>
          {message && <p className="message">{message}</p>}
        </section>
        <section className="panel">
          <h2>Mis reportes</h2>
          {reports.length === 0 ? (
            <p>Aún no tienes reportes.</p>
          ) : (
            reports.map((r) => (
              <article className="report" key={r.id}>
                <strong>{r.report_code}</strong>
                <span>{r.title}</span>
                <small>
                  {r.incident_categories?.name} · {r.status}
                </small>
              </article>
            ))
          )}
        </section>
      </div>
    </Dashboard>
  );
}

function Admin({ session, onLogout }) {
  const [reports, setReports] = useState([]);
  const [message, setMessage] = useState("");
  const load = () =>
    api("/api/reports", {}, session)
      .then(setReports)
      .catch((e) => setMessage(e.message));
  useEffect(load, []);
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

function Dashboard({ title, onLogout, children }) {
  return (
    <>
      <header className="topbar">
        <div>
          <strong>GRIU</strong>
          <span>Gestión de incidentes urbanos · Neiva</span>
        </div>
        <button className="link-button" onClick={onLogout}>
          Cerrar sesión
        </button>
      </header>
      <main className="page">
        <p className="eyebrow">PARTICIPACIÓN CIUDADANA</p>
        <h1>{title}</h1>
        {children}
      </main>
    </>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.session.user.id)
          .single();
        setRole(profile?.role || "citizen");
      }
      setLoading(false);
    });
  }, []);
  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setRole(null);
  };
  if (loading) return <div className="loading">Cargando GRIU...</div>;
  if (!session)
    return (
      <Auth
        onAuth={async (s) => {
          setSession(s);
          const { data } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", s.user.id)
            .single();
          setRole(data?.role || "citizen");
        }}
      />
    );
  return role === "admin" ? (
    <Admin session={session} onLogout={logout} />
  ) : (
    <Citizen session={session} onLogout={logout} />
  );
}
