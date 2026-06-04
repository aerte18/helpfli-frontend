import {
  Snowflake,
  Fan,
  Thermometer,
  Droplets,
  Leaf,
  Scissors,
  Flame,
  Hammer,
  CloudRain,
  Wrench,
  PlusCircle,
} from "lucide-react";
import { CATEGORY_ICONS, getIconBySlug } from "../components/icons/HelpfliCategoryIcons";

function normalize(text = "") {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

/** Reguły od najbardziej szczegółowych — pierwsze dopasowanie wygrywa. */
const KEYWORD_RULES = [
  { re: /koszenie|trawnik|kosiark/, icon: Scissors },
  { re: /nawadnian/, icon: Droplets },
  { re: /grabienie|lisci|liści/, icon: Leaf },
  { re: /przycinan|krzew/, icon: Scissors },
  { re: /zakladanie|wertykul|aeracj|nasadzen|projekt.*ogrod/, icon: Leaf },
  { re: /czyszczenie.*klim|klim.*czyszczen/, icon: Fan },
  { re: /odgrzyb|nabicie|czynnik/, icon: Snowflake },
  { re: /montaz.*klim|klim.*montaz/, icon: Snowflake },
  { re: /regulacja|termostat|instalacji.*c\.?o/, icon: Thermometer },
  { re: /kominiarz|piec|gaz/, icon: Flame },
  { re: /czyszczenie.*dach/, icon: CloudRain },
  { re: /odsniez|odśnież/, icon: Snowflake },
  { re: /klimatyz|klima[-_]/, icon: Snowflake },
  { re: /ogrod|ogrodnik/, icon: Leaf },
];

/**
 * Ikona Lucide dopasowana do konkretnej usługi sezonowej (nie do sezonu).
 */
export function resolveSeasonalServiceIcon({ slug = "", title = "", parent_slug = "" } = {}) {
  const slugNorm = slug.replace(/_/g, "-");
  const direct =
    CATEGORY_ICONS[slug] ||
    CATEGORY_ICONS[slugNorm] ||
    getIconBySlug(slugNorm);
  if (direct && direct !== Wrench) return direct;

  const hay = normalize(`${slug} ${title} ${parent_slug}`);
  for (const { re, icon } of KEYWORD_RULES) {
    if (re.test(hay)) return icon;
  }

  const parentNorm = normalize(parent_slug).replace(/_/g, "-");
  if (parentNorm && CATEGORY_ICONS[parentNorm]) {
    return CATEGORY_ICONS[parentNorm];
  }

  return PlusCircle;
}
