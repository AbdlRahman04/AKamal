import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:net";
import { once } from "node:events";
import { createGmailTransport } from "../lib/gmail.mjs";

test("closing the transport destroys an active stalled SMTP socket", async () => {
  let peer;
  const server = createServer(socket => { peer = socket; socket.on("data", () => {}); });
  server.listen(0, "127.0.0.1"); await once(server, "listening");
  const transport = createGmailTransport({ host: "127.0.0.1", port: server.address().port, secure: true, connectionTimeout: 1000, greetingTimeout: 1000, socketTimeout: 1000 });
  try {
    const connected = once(server, "connection");
    const result = transport.sendMail({ from: "sender@example.com", to: "recipient@example.com", text: "Never delivered" }).catch(error => error);
    await connected;
    const closed = once(peer, "close"); transport.close();
    await closed; assert.equal(peer.destroyed, true); assert.ok(await result instanceof Error);
  } finally { transport.close(); peer?.destroy(); await new Promise(resolve => server.close(resolve)); }
});
