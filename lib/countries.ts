/** Nombres en español por código ISO 3166-1 alpha-2 (sin Intl en runtime). */
const CODE_TO_NAME_ES: Record<string, string> = {
  AD: "Andorra", AE: "Emiratos Árabes Unidos", AF: "Afganistán", AG: "Antigua y Barbuda",
  AI: "Anguila", AL: "Albania", AM: "Armenia", AO: "Angola", AQ: "Antártida", AR: "Argentina",
  AS: "Samoa Americana", AT: "Austria", AU: "Australia", AW: "Aruba", AX: "Islas Aland",
  AZ: "Azerbaiyán", BA: "Bosnia y Herzegovina", BB: "Barbados", BD: "Bangladés", BE: "Bélgica",
  BF: "Burkina Faso", BG: "Bulgaria", BH: "Baréin", BI: "Burundi", BJ: "Benín", BL: "San Bartolomé",
  BM: "Bermudas", BN: "Brunéi", BO: "Bolivia", BQ: "Caribe neerlandés", BR: "Brasil", BS: "Bahamas",
  BT: "Bután", BV: "Isla Bouvet", BW: "Botsuana", BY: "Bielorrusia", BZ: "Belice", CA: "Canadá",
  CC: "Islas Cocos", CD: "República Democrática del Congo", CF: "República Centroafricana", CG: "Congo",
  CH: "Suiza", CI: "Côte d’Ivoire", CK: "Islas Cook", CL: "Chile", CM: "Camerún", CN: "China",
  CO: "Colombia", CR: "Costa Rica", CU: "Cuba", CV: "Cabo Verde", CW: "Curazao", CX: "Isla de Navidad",
  CY: "Chipre", CZ: "Chequia", DE: "Alemania", DJ: "Yibuti", DK: "Dinamarca", DM: "Dominica",
  DO: "República Dominicana", DZ: "Argelia", EC: "Ecuador", EE: "Estonia", EG: "Egipto",
  EH: "Sáhara Occidental", ER: "Eritrea", ES: "España", ET: "Etiopía", FI: "Finlandia", FJ: "Fiyi",
  FK: "Islas Malvinas", FM: "Micronesia", FO: "Islas Feroe", FR: "Francia", GA: "Gabón",
  GB: "Reino Unido", GD: "Granada", GE: "Georgia", GF: "Guayana Francesa", GG: "Guernesey",
  GH: "Ghana", GI: "Gibraltar", GL: "Groenlandia", GM: "Gambia", GN: "Guinea", GP: "Guadalupe",
  GQ: "Guinea Ecuatorial", GR: "Grecia", GS: "Islas Georgia del Sur y Sandwich del Sur", GT: "Guatemala",
  GU: "Guam", GW: "Guinea-Bisáu", GY: "Guyana", HK: "RAE de Hong Kong (China)",
  HM: "Islas Heard y McDonald", HN: "Honduras", HR: "Croacia", HT: "Haití", HU: "Hungría",
  ID: "Indonesia", IE: "Irlanda", IL: "Israel", IM: "Isla de Man", IN: "India",
  IO: "Territorio Británico del Océano Índico", IQ: "Irak", IR: "Irán", IS: "Islandia", IT: "Italia",
  JE: "Jersey", JM: "Jamaica", JO: "Jordania", JP: "Japón", KE: "Kenia", KG: "Kirguistán",
  KH: "Camboya", KI: "Kiribati", KM: "Comoras", KN: "San Cristóbal y Nieves", KP: "Corea del Norte",
  KR: "Corea del Sur", KW: "Kuwait", KY: "Islas Caimán", KZ: "Kazajistán", LA: "Laos", LB: "Líbano",
  LC: "Santa Lucía", LI: "Liechtenstein", LK: "Sri Lanka", LR: "Liberia", LS: "Lesoto", LT: "Lituania",
  LU: "Luxemburgo", LV: "Letonia", LY: "Libia", MA: "Marruecos", MC: "Mónaco", MD: "Moldavia",
  ME: "Montenegro", MF: "San Martín", MG: "Madagascar", MH: "Islas Marshall", MK: "Macedonia del Norte",
  ML: "Mali", MM: "Myanmar (Birmania)", MN: "Mongolia", MO: "RAE de Macao (China)",
  MP: "Islas Marianas del Norte", MQ: "Martinica", MR: "Mauritania", MS: "Montserrat", MT: "Malta",
  MU: "Mauricio", MV: "Maldivas", MW: "Malaui", MX: "México", MY: "Malasia", MZ: "Mozambique",
  NA: "Namibia", NC: "Nueva Caledonia", NE: "Níger", NF: "Isla Norfolk", NG: "Nigeria", NI: "Nicaragua",
  NL: "Países Bajos", NO: "Noruega", NP: "Nepal", NR: "Nauru", NU: "Niue", NZ: "Nueva Zelanda",
  OM: "Omán", PA: "Panamá", PE: "Perú", PF: "Polinesia Francesa", PG: "Papúa Nueva Guinea",
  PH: "Filipinas", PK: "Pakistán", PL: "Polonia", PM: "San Pedro y Miquelón", PN: "Islas Pitcairn",
  PR: "Puerto Rico", PS: "Territorios Palestinos", PT: "Portugal", PW: "Palaos", PY: "Paraguay",
  QA: "Catar", RE: "Reunión", RO: "Rumanía", RS: "Serbia", RU: "Rusia", RW: "Ruanda",
  SA: "Arabia Saudí", SB: "Islas Salomón", SC: "Seychelles", SD: "Sudán", SE: "Suecia", SG: "Singapur",
  SH: "Santa Elena", SI: "Eslovenia", SJ: "Svalbard y Jan Mayen", SK: "Eslovaquia", SL: "Sierra Leona",
  SM: "San Marino", SN: "Senegal", SO: "Somalia", SR: "Surinam", SS: "Sudán del Sur",
  ST: "Santo Tomé y Príncipe", SV: "El Salvador", SX: "Sint Maarten", SY: "Siria", SZ: "Esuatini",
  TC: "Islas Turcas y Caicos", TD: "Chad", TF: "Territorios Australes Franceses", TG: "Togo",
  TH: "Tailandia", TJ: "Tayikistán", TK: "Tokelau", TL: "Timor-Leste", TM: "Turkmenistán", TN: "Túnez",
  TO: "Tonga", TR: "Turquía", TT: "Trinidad y Tobago", TV: "Tuvalu", TW: "Taiwán", TZ: "Tanzania",
  UA: "Ucrania", UG: "Uganda", UM: "Islas menores alejadas de EE. UU.", US: "Estados Unidos",
  UY: "Uruguay", UZ: "Uzbekistán", VA: "Ciudad del Vaticano", VC: "San Vicente y las Granadinas",
  VE: "Venezuela", VG: "Islas Vírgenes Británicas", VI: "Islas Vírgenes de EE. UU.", VN: "Vietnam",
  VU: "Vanuatu", WF: "Wallis y Futuna", WS: "Samoa", YE: "Yemen", YT: "Mayotte", ZA: "Sudáfrica",
  ZM: "Zambia", ZW: "Zimbabue",
};

const LOCALE = "es";

function sortCountryNames(names: string[]): string[] {
  try {
    return [...names].sort((a, b) => a.localeCompare(b, LOCALE, { sensitivity: "base" }));
  } catch {
    return [...names].sort();
  }
}

/** Nombres de países en español, ordenados alfabéticamente. */
export const COUNTRY_OPTIONS: string[] = sortCountryNames(Object.values(CODE_TO_NAME_ES));

function countryCodeToName(code: string): string {
  const normalized = code.trim().toUpperCase();
  if (normalized.length !== 2) return code.trim();
  return CODE_TO_NAME_ES[normalized] ?? normalized;
}

/** Código ISO 3166-1 alpha-2 inferido del locale del navegador/sistema. */
export function getBrowserCountryCode(): string {
  const sources = [
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().locale
      : "",
    typeof navigator !== "undefined" ? navigator.language : "",
    ...(typeof navigator !== "undefined" ? (navigator.languages ?? []) : []),
  ];
  for (const locale of sources) {
    const match = locale.match(/[-_]([A-Za-z]{2})\b/);
    if (match) {
      const code = match[1].toUpperCase();
      if (code.length === 2) return code;
    }
  }
  return "";
}

/** Nombre del país del navegador/sistema en español. */
export function getBrowserCountry(): string {
  const code = getBrowserCountryCode();
  return code ? countryCodeToName(code) : "";
}

function normalizeStoredCountry(country?: string | null): string {
  const trimmed = country?.trim();
  if (!trimmed) return "";

  if (/^[A-Za-z]{2}$/.test(trimmed)) {
    return countryCodeToName(trimmed);
  }

  const exact = COUNTRY_OPTIONS.find((name) => name === trimmed);
  if (exact) return exact;

  const insensitive = COUNTRY_OPTIONS.find(
    (name) => name.toLowerCase() === trimmed.toLowerCase()
  );
  return insensitive ?? trimmed;
}

/** Usa el país guardado o, si está vacío, el del navegador. */
export function resolveDefaultCountry(country?: string | null): string {
  const normalized = normalizeStoredCountry(country);
  if (normalized) return normalized;
  return getBrowserCountry();
}
