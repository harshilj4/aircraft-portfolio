/**
 * PROFESSIONAL LINKS — single source of truth.
 * The email address is stored in reversed pieces and assembled at runtime so
 * that basic scrapers reading the source/HTML cannot harvest it directly.
 */

export const links = {
  linkedin: "https://www.linkedin.com/in/harshil-jadawala/",
  github: "https://github.com/harshilj4",
  previousPortfolio: "https://harshilj4.github.io",
  // ADD YOUTUBE CHANNEL URL here when available (leave "" to hide the link):
  youtubeChannel: "",
};

/** Obfuscated email (harshilj4r [at] gmail [dot] com). */
const eParts = ["moc", "liamg", "r4jlihsrah"];
const rev = (s: string) => s.split("").reverse().join("");

export function getEmail(): string {
  return `${rev(eParts[2])}@${rev(eParts[1])}.${rev(eParts[0])}`;
}

export function getMailto(subject?: string): string {
  const base = `mailto:${getEmail()}`;
  return subject ? `${base}?subject=${encodeURIComponent(subject)}` : base;
}
