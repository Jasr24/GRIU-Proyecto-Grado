import React, { useState } from "react";
import { supabase } from "../lib/supabase";

function friendlyAuthError(error) {
  const message = error?.message || "";
  if (
    error?.code === "over_email_send_rate_limit" ||
    message.includes("email rate limit exceeded")
  )
    return "Se alcanzó el límite temporal de correos de confirmación. Espera un momento o desactiva temporalmente la confirmación de correo para las pruebas.";
  if (message.includes("For security purposes"))
    return "Por seguridad, debes esperar 48 segundos antes de solicitar otro correo de confirmación.";
  if (message.includes("User already registered"))
    return "Este correo ya está registrado. Intenta iniciar sesión.";
  if (message.includes("Invalid login credentials"))
    return "El correo o la contraseña no son correctos.";
  if (message.includes("Email not confirmed"))
    return "Debes confirmar tu correo electrónico antes de iniciar sesión.";
  return "No fue posible completar la solicitud. Intenta nuevamente.";
}

export default function Auth({ onAuth }) {
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
  const register = mode === "register";
  const update = (name, value) =>
    setForm((current) => ({ ...current, [name]: value }));

  const submit = async (event) => {
    event.preventDefault();
    if (loading) return;
    setMessage("");
    if (register && !form.consent)
      return setMessage("Debes aceptar el tratamiento de datos personales.");
    if (register && !/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(form.password)) {
      return setMessage(
        "La contraseña debe tener mínimo 8 caracteres, una mayúscula y un número.",
      );
    }
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
      if (register && result.data.user?.identities?.length === 0)
        return setMessage("Este correo ya tiene una cuenta. Inicia sesión.");
      if (register && !result.data.session)
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
          <aside className="auth-intro">
            <span className="intro-pill">GRIU · NEIVA</span>
            <h2>
              {register ? (
                <>
                  Tu ciudad necesita
                  <br />
                  tu mirada.
                </>
              ) : (
                <>
                  Qué bueno
                  <br />
                  volver a verte.
                </>
              )}
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
          <section className="auth-form-panel">
            <p className="eyebrow">
              {register ? "REGISTRO CIUDADANO" : "ACCESO A GRIU"}
            </p>
            <h1>{register ? "Crea tu cuenta ciudadana" : "Iniciar sesión"}</h1>
            <p className="form-lead">
              {register
                ? "Regístrate y empieza a transformar tu entorno."
                : "Accede para gestionar tus reportes."}
            </p>
            <form id="auth-form" onSubmit={submit} className="register-form">
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
                  pattern={register ? "(?=.*[A-Z])(?=.*[0-9]).{8,}" : undefined}
                  title={
                    register
                      ? "Mínimo 8 caracteres, una mayúscula y un número"
                      : undefined
                  }
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
              {!register && (
                <label className="consent">
                  <input type="checkbox" /> <span>Recordarme</span>
                </label>
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
                    : "Entrar a mi cuenta"}
              </button>
            </form>
            {message && <p className="message">{message}</p>}
            {!register && (
              <button
                className="link-button demo-login"
                type="button"
                onClick={() =>
                  setMessage(
                    "La demostración requiere credenciales asignadas por el equipo.",
                  )
                }
              >
                Acceso de demostración
              </button>
            )}
            <button
              className="link-button"
              onClick={() => setMode(register ? "login" : "register")}
            >
              {register
                ? "¿Ya tienes cuenta? Inicia sesión →"
                : "¿Aún no tienes cuenta? Regístrate →"}
            </button>
            {!register && (
              <button
                className="outline-button admin-login"
                type="submit"
                form="auth-form"
                disabled={loading}
              >
                Ingresar como administrador
              </button>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
