/**
 * Prototype certificates. A path's certificate exists only once the path is complete (every required skill Mastered);
 * it is never issued for lessons viewed or activities attempted. The code is deterministic so the same learner and path
 * always show the same code. It is not a verified credential: there is no issuing service behind it.
 */

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function fnv1a(text: string, seed = 0x811c9dc5): number {
  let h = seed >>> 0;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function chars(n: number, count: number): string {
  let out = "";
  for (let i = 0; i < count; i++) {
    out += ALPHABET[n % ALPHABET.length];
    n = Math.floor(n / ALPHABET.length);
  }
  return out;
}

/** "SB-7K3F-Q9XM" style code from the learner, path and completion time. */
export function certificateCode(learnerId: string, pathId: string, completedAt: string): string {
  const key = `${learnerId}|${pathId}|${completedAt}`;
  return `SB-${chars(fnv1a(key), 4)}-${chars(fnv1a(key, 0x9747b28c), 4)}`;
}

/** Query string for a shareable certificate link: the details travel in the link because there is no server to look them up. */
export function certificateQuery(c: { name: string; date: string; code: string }): string {
  return new URLSearchParams({ n: c.name, d: c.date, c: c.code }).toString();
}

export function readCertificateQuery(search: string): { name: string; date: string; code: string } | undefined {
  const q = new URLSearchParams(search);
  const name = q.get("n")?.trim();
  const date = q.get("d")?.trim();
  const code = q.get("c")?.trim();
  if (!name || !date || !code || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^SB-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/.test(code)) return undefined;
  return { name: name.slice(0, 80), date, code };
}

/** LinkedIn "Add to profile" (certification) and share links. Opening them only pre-fills LinkedIn; the learner confirms there. */
export function shareLinks(input: { url: string; pathTitle: string; org: string; date: string; code: string; text: string }) {
  const [year, month] = input.date.split("-");
  const u = encodeURIComponent(input.url);
  const addToProfile = new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: input.pathTitle,
    organizationName: input.org,
    issueYear: year,
    issueMonth: String(Number(month)),
    certUrl: input.url,
    certId: input.code,
  });
  return {
    linkedinProfile: `https://www.linkedin.com/profile/add?${addToProfile.toString()}`,
    linkedinPost: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
    x: `https://x.com/intent/post?text=${encodeURIComponent(input.text)}&url=${u}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${input.text} ${input.url}`)}`,
  };
}
