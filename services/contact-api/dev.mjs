import { createServer } from "node:http";
import contact from "./api/contact.mjs";

createServer(async (req, res) => {
  if (req.url !== "/api/contact") { res.writeHead(404).end(); return; }
  try {
    const request = new Request(`http://localhost:${process.env.CONTACT_PORT || 4001}${req.url}`, { method: req.method, headers: req.headers, ...(!["GET", "HEAD"].includes(req.method) ? { body: req, duplex: "half" } : {}) });
    const response = await contact.fetch(request);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch { res.writeHead(503, { "Content-Type": "application/json" }).end(JSON.stringify({ ok: false, code: "unavailable", message: "Contact is temporarily unavailable." })); }
}).listen(Number(process.env.CONTACT_PORT || 4001), "localhost", () => console.log("Contact backend: http://localhost:4001/api/contact"));
