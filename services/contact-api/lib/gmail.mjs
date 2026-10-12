import { connect } from "node:net";
import nodemailer from "nodemailer";

// Own the underlying socket: Nodemailer's non-pooled close() alone does not
// interrupt an active send. Nodemailer upgrades this socket to verified TLS.
export function createGmailTransport(options) {
  let socket;
  let closed = false;
  let cancelPending;
  const transport = nodemailer.createTransport({
    ...options,
    tls: { servername: options.host, rejectUnauthorized: true, minVersion: "TLSv1.2" },
    getSocket(settings, callback) {
      if (closed) { callback(new Error("Transport closed")); return; }
      socket = connect({ host: settings.host, port: settings.port });
      let settled = false;
      const finish = (error, result) => {
        if (settled) return;
        settled = true;
        socket.removeListener("error", fail);
        callback(error, result);
      };
      const fail = error => finish(error);
      cancelPending = () => finish(new Error("Transport closed"));
      socket.once("error", fail);
      socket.once("connect", () => {
        socket.removeListener("error", fail);
        if (closed) { socket.destroy(); callback(new Error("Transport closed")); return; }
        finish(null, { connection: socket });
      });
    }
  });
  return {
    sendMail: mail => transport.sendMail(mail),
    close() { closed = true; socket?.destroy(); cancelPending?.(); transport.close(); }
  };
}
