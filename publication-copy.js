const clean = (value) => String(value ?? "").trim().replace(/\s+/g, " ");

const sentence = (value) => {
  const text = clean(value);
  if (!text) return "";
  const normalized = text.charAt(0).toUpperCase() + text.slice(1);
  return /[.!?]$/.test(normalized) ? normalized : `${normalized}.`;
};

const truncate = (value, maximum) => {
  const text = clean(value);
  if (text.length <= maximum) return text;
  const shortened = text.slice(0, maximum - 1).replace(/\s+\S*$/, "").replace(/[,:;.!?\s]+$/, "");
  return `${shortened || text.slice(0, maximum - 1)}…`;
};

export function slugifyPublication(value) {
  return clean(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70)
    .replace(/-+$/g, "");
}

export function suggestCategory(device, repair = "") {
  const value = `${device} ${repair}`.toLowerCase();
  if (/datenrett|festplatte|ssd|usb-stick|speicherkarte/.test(value)) return "Datenrettung";
  if (/playstation|xbox|konsole|nintendo|switch/.test(value)) return "Konsole";
  if (/iphone|ipad|smartphone|handy|tablet|samsung galaxy|pixel/.test(value)) return "Smartphone & Tablet";
  if (/pc|computer|laptop|notebook|windows|macbook|imac/.test(value)) return "PC & Laptop";
  return "Sonstiges";
}

export function shortRepair(value) {
  const repair = clean(value).replace(/[.!?]+$/, "");
  return truncate(repair, 72) || "Reparatur dokumentiert";
}

export function buildHashtags(device, repair, category = "") {
  const value = `${device} ${repair} ${category}`.toLowerCase();
  const tags = ["#Augsburg", "#AugsburgLechhausen"];
  if (/iphone|ipad|smartphone|handy|tablet|samsung galaxy|pixel/.test(value)) tags.push("#HandyreparaturAugsburg", "#SmartphoneReparatur");
  else if (/playstation|xbox|konsole|nintendo|switch/.test(value)) tags.push("#KonsolenReparatur");
  else tags.push("#PCServiceAugsburg", "#ComputerReparatur");

  if (/iphone|ipad/.test(value)) tags.push("#iPhoneReparatur");
  else if (/samsung/.test(value)) tags.push("#SamsungReparatur");
  else if (/laptop|notebook|macbook/.test(value)) tags.push("#LaptopReparatur");
  else if (/\bpc\b|computer|windows/.test(value)) tags.push("#PCReparatur");
  else if (/playstation/.test(value)) tags.push("#PlayStationReparatur");
  else if (/xbox/.test(value)) tags.push("#XboxReparatur");

  if (/akku|batterie/.test(value)) tags.push("#Akkutausch");
  if (/display|bildschirm|glas/.test(value)) tags.push("#DisplayReparatur");
  if (/ladebuchse|ladeanschluss|usb[ -]?c/.test(value)) tags.push("#LadebuchsenReparatur");
  if (/datenrett/.test(value)) tags.push("#Datenrettung");
  if (/reinig/.test(value)) tags.push("#PCReinigung");
  if (/diagnos|fehleranalys/.test(value)) tags.push("#Fehlerdiagnose");
  return [...new Set(tags)].slice(0, 9).join(" ");
}

export function buildPublicationDrafts(input) {
  const device = clean(input.device_model);
  const problem = clean(input.problem);
  const diagnosis = clean(input.diagnosis);
  const repair = clean(input.repair);
  const result = clean(input.result);
  const category = input.category || suggestCategory(device, repair);
  const repairLabel = shortRepair(input.repair_type || repair);
  const title = device ? `${device}: ${repairLabel}` : "Reparaturbericht";
  const slug = slugifyPublication(title);
  const reportUrl = `https://www.pc-und-handyservice-augsburg.com/reparaturberichte/${slug}`;
  const summary = truncate(`Bei diesem ${device || "Gerät"} wurde folgendes Fehlerbild untersucht: ${problem} Die Diagnose ergab: ${diagnosis} Anschließend wurde folgende Reparatur durchgeführt: ${repair} Ergebnis: ${result}`, 300);
  const hashtags = buildHashtags(device, repair, category);

  return {
    title,
    slug,
    category,
    repair_type: repairLabel,
    summary,
    facebook_text: `🔧 Reparatur aus unserer Werkstatt in Augsburg\n\nGerät: ${device}\n\nFehlerbild:\n${sentence(problem)}\n\nUnsere Diagnose:\n${sentence(diagnosis)}\n\nDurchgeführt wurde:\n${sentence(repair)}\n\nErgebnis:\n${sentence(result)}\n\nDen ausführlichen Reparaturbericht mit Bildern gibt es hier:\n${reportUrl}\n\nPC & Handyservice Augsburg\nAugsburg-Lechhausen`,
    instagram_text: `🔧 ${device} – ${repairLabel}\n\nFehlerbild:\n${sentence(problem)}\n\nDiagnose:\n${sentence(diagnosis)}\n\nReparatur:\n${sentence(repair)}\n\nErgebnis:\n${sentence(result)}\n\nWeitere Einzelheiten zum Reparaturfall gibt es auf unserer Website:\n${reportUrl}\n\n📍 PC & Handyservice Augsburg · Augsburg-Lechhausen\n\n${hashtags}`,
    google_text: truncate(`Reparaturbericht aus Augsburg: Bei einem ${device} wurde folgendes Problem untersucht: ${problem} Die Diagnose ergab: ${diagnosis} Durchgeführt wurde: ${repair} Ergebnis: ${result}`, 1350) + `\n\nAusführlicher Bericht:\n${reportUrl}`,
  };
}

export function detectSensitiveContent(values) {
  const text = Object.values(values || {}).map(clean).filter(Boolean).join("\n");
  const checks = [
    ["mögliche E-Mail-Adresse", /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i],
    ["mögliche Telefonnummer", /(?:\+|00)\d[\d\s()/.-]{6,}\d|\b0\d[\d\s()/.-]{6,}\d/],
    ["lange Ziffernfolge oder Gerätekennung", /\b\d{8,}\b/],
    ["Hinweis auf Zugangsdaten oder Kennungen", /\b(?:imei|seriennummer|s\/?n|pin|passwort|kennwort|entsperrcode|kundennummer|auftragsnummer|rechnungsnummer)\b/i],
    ["möglicher Personen- oder Herkunftshinweis", /\b(?:herr|frau)\s+[A-ZÄÖÜ][a-zäöüß-]+|\bkunde(?:in)?\s+aus\b/],
    ["mögliche Anschrift", /\b[A-ZÄÖÜ][\p{L}.-]*(?:straße|strasse|weg|platz|allee|gasse)\s+\d+[a-z]?\b/iu],
    ["möglicher privater Datei- oder Kontolink", /https?:\/\/(?:drive\.google\.com|docs\.google\.com|dropbox\.com|icloud\.com|onedrive\.live\.com)\b/i],
  ];
  return checks.filter(([, pattern]) => pattern.test(text)).map(([label]) => label);
}
