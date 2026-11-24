// Generador de carga sin dependencias (Node 18+, fetch nativo).
// Uso: node carga.mjs <README.md> <salida.json> <niveles: 10,25,50> <segundos por nivel>
// Cada usuario virtual repite, sin pausa, la carga del Dashboard: las 7
// llamadas que hace el front en paralelo (store.jsx). Las claves de prueba
// se leen del README y no se imprimen.
import fs from "node:fs";
import { exec } from "node:child_process";

const [readmePath, salida, nivelesTxt = "10,25,50", segTxt = "30"] = process.argv.slice(2);
const readme = fs.readFileSync(readmePath, "utf8");
const clave = (c) => readme.split("\n").find((l) => l.includes("`" + c + "`")).split("|").map((x) => x.trim().replace(/`/g, "")).filter(Boolean).pop();
const API = "http://localhost:3000/api";
const ENDPOINTS = ["/auth/me", "/config", "/companias", "/vehiculos", "/mantenimientos", "/fallas?estado=pendiente,derivado", "/notificaciones"];
const CUENTAS = ["administrador@gmail.com", "inspector.c1@sigmave.cl", "teniente.c1@sigmave.cl", "bombero.c1@sigmave.cl"];

async function login(email) {
  const r = await fetch(API + "/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: clave(email) }) });
  if (!r.ok) throw new Error("login " + email + " " + r.status);
  return r.headers.get("set-cookie").split(";")[0];
}
const pct = (arr, p) => { if (!arr.length) return null; const s = [...arr].sort((a, b) => a - b); return Math.round(s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)]); };
const stats = (arr) => ({ n: arr.length, p50: pct(arr, 50), p95: pct(arr, 95), p99: pct(arr, 99), max: arr.length ? Math.round(Math.max(...arr)) : null });
const dockerStats = () => new Promise((ok) => exec('docker stats --no-stream --format "{{.Name}};{{.CPUPerc}};{{.MemUsage}}" capstone-api-server-1 supabase_db_sigmave', (e, out) => ok(e ? "" : out.trim())));

const cookies = {};
for (const c of CUENTAS) cookies[c] = await login(c);

const resultado = { fecha: new Date().toISOString(), endpoints: ENDPOINTS, cuentas: CUENTAS, niveles: [] };
for (const usuarios of nivelesTxt.split(",").map(Number)) {
  const fin = Date.now() + Number(segTxt) * 1000;
  const dash = [], porEndpoint = Object.fromEntries(ENDPOINTS.map((e) => [e, []]));
  const codigos = {}; let errores = 0, cargas = 0;
  const muestras = [];
  const muestreo = setInterval(async () => muestras.push(await dockerStats()), 5000);
  const vu = async (i) => {
    const ck = cookies[CUENTAS[i % CUENTAS.length]];
    while (Date.now() < fin) {
      const t0 = performance.now();
      await Promise.all(ENDPOINTS.map(async (e) => {
        const t = performance.now();
        try {
          const r = await fetch(API + e, { headers: { Cookie: ck } });
          await r.arrayBuffer();
          porEndpoint[e].push(performance.now() - t);
          codigos[r.status] = (codigos[r.status] || 0) + 1;
          if (r.status >= 500) errores++;
        } catch { errores++; codigos.red = (codigos.red || 0) + 1; }
      }));
      dash.push(performance.now() - t0); cargas++;
    }
  };
  const t0 = Date.now();
  await Promise.all(Array.from({ length: usuarios }, (_, i) => vu(i)));
  clearInterval(muestreo);
  const seg = (Date.now() - t0) / 1000;
  const nivel = {
    usuarios, segundos: Math.round(seg), cargasDashboard: cargas, solicitudes: cargas * ENDPOINTS.length,
    solicitudesPorSegundo: Math.round((cargas * ENDPOINTS.length) / seg), erroresServidorORed: errores, codigos,
    dashboardMs: stats(dash), endpointMs: Object.fromEntries(ENDPOINTS.map((e) => [e, stats(porEndpoint[e])])), docker: muestras.filter(Boolean),
  };
  resultado.niveles.push(nivel);
  console.log(`${usuarios} usuarios: ${cargas} cargas del dashboard, ${nivel.solicitudesPorSegundo} sol/s, errores ${errores}, dashboard p50 ${nivel.dashboardMs.p50} ms p95 ${nivel.dashboardMs.p95} ms max ${nivel.dashboardMs.max} ms, códigos ${JSON.stringify(codigos)}`);
  await new Promise((r) => setTimeout(r, 3000)); // respiro entre niveles
}
fs.writeFileSync(salida, JSON.stringify(resultado, null, 2));
