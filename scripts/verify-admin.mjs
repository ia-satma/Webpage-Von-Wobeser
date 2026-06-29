import "dotenv/config";
import bcrypt from "bcrypt";
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);
const BASE = "http://localhost:5050";
const PW = "VonWobeser2026!";

// 1) Fijar contraseña conocida para admin@vonwobeser.com
const hash = await bcrypt.hash(PW, 12);
await sql`update admin_users set password_hash=${hash} where email='admin@vonwobeser.com'`;
console.log("1) Contraseña fijada para admin@vonwobeser.com");

// 2) Login por API
const lr = await fetch(BASE + "/api/admin/login", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ username: "admin@vonwobeser.com", password: PW }),
});
const lj = await lr.json();
console.log("2) Login HTTP", lr.status, "| campos:", Object.keys(lj).join(", "));
const token = lj.token || lj.sessionToken || lj.accessToken || (lj.session && lj.session.token);
console.log("   token:", token ? token.slice(0, 18) + "…" : "(no encontrado) " + JSON.stringify(lj).slice(0, 150));
if (!token) process.exit(1);

// 3) Editar un abogado por el API admin
const [m] = await sql`select id, slug, title from team_members where slug='rodrigo-barradas'`;
const orig = m.title;
const NEW = "Founding Partner (EDITADO DESDE ADMIN)";
const er = await fetch(BASE + `/api/admin/team/${m.id}`, {
  method: "PUT",
  headers: { "content-type": "application/json", authorization: "Bearer " + token },
  body: JSON.stringify({ title: NEW }),
});
console.log("3) Edit HTTP", er.status, "(", orig, "→", NEW, ")");

// 4) Confirmar el cambio en la página pública del sitio (espejo dinámico)
const page = await (await fetch(BASE + "/lawyer/rodrigo-barradas")).text();
const shown = (page.match(/attorney__meta--role">([^<]*)/) || [])[1];
console.log("4) En el sitio /lawyer/rodrigo-barradas → rol mostrado:", JSON.stringify(shown));
console.log("   ¿Refleja la edición?", shown === NEW ? "✅ SÍ" : "❌ no");

// 5) Revertir
await fetch(BASE + `/api/admin/team/${m.id}`, {
  method: "PUT",
  headers: { "content-type": "application/json", authorization: "Bearer " + token },
  body: JSON.stringify({ title: orig }),
});
console.log("5) Revertido a:", orig);
