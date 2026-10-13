export function assertPublicProfile(profile) {
  if (!profile || typeof profile !== "object") throw Object.assign(new Error("Public profile must be an object."), { statusCode: 400 });
  if (["email", "phone"].some(field => Object.hasOwn(profile, field))) throw Object.assign(new Error("Public profile cannot contain email or phone. Configure the receiving address privately in Web3Forms."), { statusCode: 400 });
  for (const link of [...(Array.isArray(profile.links) ? profile.links : []), ...(Array.isArray(profile.socialLinks) ? profile.socialLinks : [])]) {
    if (/^(mailto|tel):/i.test(String(link?.href || "").trim())) throw Object.assign(new Error("Public profile links cannot expose email or phone."), { statusCode: 400 });
  }
}
