export type ContactFields = { name: string; email: string; subject: string; message: string; inquiryType: string; website: string };
export type ContactErrors = Partial<Record<keyof ContactFields, string>>;
export function validateContactFields(fields: ContactFields): ContactErrors;
export function submitContact(fields: ContactFields, source: "dev" | "photography", accessKey: string, token: string, signal?: AbortSignal, fetchImpl?: typeof fetch): Promise<{ ok: boolean; message: string; fieldErrors?: ContactErrors }>;
