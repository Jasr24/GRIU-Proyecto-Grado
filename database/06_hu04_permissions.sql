-- Permisos requeridos para que las políticas de HU-04 puedan validar
-- que el adjunto pertenece a un reporte del ciudadano autenticado.
grant usage on schema public to authenticated;
grant select on public.reports to authenticated;
grant select, insert on public.report_attachments to authenticated;

