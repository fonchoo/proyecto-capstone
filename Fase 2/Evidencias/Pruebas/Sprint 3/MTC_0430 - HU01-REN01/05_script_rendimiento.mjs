// Tiempo de respuesta de GET /api/vehiculos (listado de la flota).
// Uso: node rendimiento.mjs <README.md> <etiqueta> <salida.json>
// Sesión de administrador con "Todas las compañías" (ve todos los vehículos):
// 5 solicitudes de calentamiento y 100 medidas, una tras otra.
import fs from "node:fs";
const [readmePath, etiqueta, salida] = process.argv.slice(2);
const readme = fs.readFileSync(readmePath, "utf8");
const clave = (c) => readme.split("\n").find((l) => l.includes("`" + c + "`")).split("|").map((x) => x.trim().replace(/`/g, "")).filter(Boolean).pop();
const API = "http://localhost:3000/api";
const r = await fetch(API + "/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "administrador@gmail.com", password: clave("administrador@gmail.com") }) });
const ck = r.headers.get("set-cookie").split(";")[0];
const pct = (arr, p) => { const s = [...arr].sort((a, b) => a - b); return Math.round(s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)]); };
let filas = 0, bytes = 0;
for (let i = 0; i < 5; i++) await (await fetch(API + "/vehiculos", { headers: { Cookie: ck } })).arrayBuffer();
const t = [];
for (let i = 0; i < 100; i++) {
  const t0 = performance.now();
  const x = await fetch(API + "/vehiculos", { headers: { Cookie: ck } });
  const buf = await x.arrayBuffer();
  t.push(performance.now() - t0);
  if (i === 0) { bytes = buf.byteLength; filas = JSON.parse(Buffer.from(buf).toString()).length; if (x.status !== 200) throw new Error("HTTP " + x.status); }
}
const res = { etiqueta, vehiculos: filas, bytes, n: t.length, p50: pct(t, 50), p95: pct(t, 95), p99: pct(t, 99), max: Math.round(Math.max(...t)), min: Math.round(Math.min(...t)) };
const previo = fs.existsSync(salida) ? JSON.parse(fs.readFileSync(salida, "utf8")) : [];
fs.writeFileSync(salida, JSON.stringify([...previo, res], null, 2));
console.log(JSON.stringify(res));
