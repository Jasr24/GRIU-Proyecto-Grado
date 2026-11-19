import "dotenv/config";
import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

const app = express();
const port = Number(process.env.PORT || 4000);
const required = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];
const missing = required.filter((name) => !process.env[name]);

if (missing.length) {
  console.warn(`Faltan variables de entorno: ${missing.join(", ")}`);
}

const supabaseAuth = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_ANON_KEY || "",
);
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  { auth: { autoRefreshToken: false, persistSession: false } },
);

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "2mb" }));

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Token requerido" });

  const { data, error } = await supabaseAuth.auth.getUser(token);
  if (error || !data.user)
    return res.status(401).json({ error: "Sesión inválida" });
  req.user = data.user;
  next();
}

async function isAdmin(userId) {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return data?.role === "admin";
}

app.get("/health", (_req, res) =>
  res.json({ ok: true, service: "griu-backend" }),
);

app.get("/api/me", requireAuth, async (req, res) => {
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("id,full_name,phone,barrio,role,created_at")
    .eq("id", req.user.id)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!profile)
    return res.status(404).json({ error: "Perfil de usuario no encontrado" });

  res.json({
    user: { id: req.user.id, email: req.user.email },
    profile,
  });
});

app.get("/api/categories", requireAuth, async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from("incident_categories")
    .select("id,name,description")
    .order("id");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get("/api/reports", requireAuth, async (req, res) => {
  const admin = await isAdmin(req.user.id);
  let query = supabaseAdmin
    .from("reports")
    .select(
      "*, incident_categories(name), profiles!reports_reporter_id_fkey(full_name)",
    )
    .order("created_at", { ascending: false });
  if (!admin) query = query.eq("reporter_id", req.user.id);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post("/api/reports", requireAuth, async (req, res) => {
  const {
    category_id,
    title,
    description,
    barrio,
    commune,
    address,
    latitude,
    longitude,
    priority,
  } = req.body;
  if (!category_id || !title || !description || !barrio) {
    return res
      .status(400)
      .json({
        error: "Categoría, título, descripción y barrio son obligatorios",
      });
  }

  const { data, error } = await supabaseAdmin
    .from("reports")
    .insert({
      reporter_id: req.user.id,
      category_id,
      title,
      description,
      barrio,
      commune,
      address,
      latitude,
      longitude,
      priority: priority || "medium",
    })
    .select("*, incident_categories(name)")
    .single();
  if (error) return res.status(500).json({ error: error.message });

  await supabaseAdmin.from("report_updates").insert({
    report_id: data.id,
    changed_by: req.user.id,
    new_status: "submitted",
    note: "Reporte creado por la ciudadanía",
  });
  res.status(201).json(data);
});

app.get("/api/reports/:id", requireAuth, async (req, res) => {
  const admin = await isAdmin(req.user.id);
  const { data: report, error } = await supabaseAdmin
    .from("reports")
    .select(
      "*, incident_categories(name), profiles!reports_reporter_id_fkey(full_name)",
    )
    .eq("id", req.params.id)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!report) return res.status(404).json({ error: "Reporte no encontrado" });
  if (!admin && report.reporter_id !== req.user.id)
    return res.status(403).json({ error: "Acceso denegado" });

  const { data: updates } = await supabaseAdmin
    .from("report_updates")
    .select("*")
    .eq("report_id", req.params.id)
    .order("created_at");
  res.json({ ...report, updates: updates || [] });
});

app.patch("/api/reports/:id", requireAuth, async (req, res) => {
  if (!(await isAdmin(req.user.id)))
    return res.status(403).json({ error: "Solo administradores" });
  const { status, priority, assigned_to, note } = req.body;
  const { data: current, error: currentError } = await supabaseAdmin
    .from("reports")
    .select("status")
    .eq("id", req.params.id)
    .single();
  if (currentError)
    return res.status(404).json({ error: "Reporte no encontrado" });

  const { data, error } = await supabaseAdmin
    .from("reports")
    .update({
      status,
      priority,
      assigned_to,
      updated_at: new Date().toISOString(),
    })
    .eq("id", req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  await supabaseAdmin.from("report_updates").insert({
    report_id: req.params.id,
    changed_by: req.user.id,
    old_status: current.status,
    new_status: status,
    note: note || "Actualización administrativa",
  });
  res.json(data);
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
});

app.listen(port, () =>
  console.log(`GRIU backend activo en http://localhost:${port}`),
);
