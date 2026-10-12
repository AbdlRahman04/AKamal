import { createContactHandler } from "../lib/contact.mjs";
import { createGmailTransport } from "../lib/gmail.mjs";

const contact = { fetch: createContactHandler({ env: process.env, createTransport: createGmailTransport }) };
export default contact;
