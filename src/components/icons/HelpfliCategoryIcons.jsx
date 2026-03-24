import React from "react";
import {
  Wrench,
  Zap,
  Monitor,
  Snowflake,
  Paintbrush,
  Hammer,
  Lock,
  Sparkles,
  Leaf,
  Car,
  Laptop,
  Stethoscope,
  PawPrint,
  Bug,
  Truck,
  Flame,
  Trash2,
  Clock,
  ShoppingCart,
  FileText,
  GraduationCap,
  Bike,
  Camera,
  Fish,
  Package,
  Ruler,
  PlusCircle,
  // Nowe ikony dla slugów
  Droplets,
  Plug,
  Lightbulb,
  Thermometer,
  Gauge,
  Cpu,
  Fan,
  Toilet,
  // Dodatkowe ikony dla wszystkich kategorii
  Shield,
  Wifi,
  Cloud,
  Smartphone,
  Scissors,
  Heart,
  Calendar,
  Book,
  Music,
  Mountain,
} from "lucide-react";

// Prosty wrapper (spójny wygląd wszędzie)
export function CategoryIcon({ icon: Icon, className = "w-5 h-5", ...rest }) {
  const Cmp = Icon || PlusCircle;
  return <Cmp className={className} strokeWidth={1.75} {...rest} />;
}

// Mapowanie po slugach - pewne, bo unikalne
export const CATEGORY_ICONS = {
  // Hydraulika
  "hydraulika-udraznianie-odplywow": Wrench,
  "hydraulika-naprawa-wycieku": Droplets,
  "hydraulika-bialy-montaz": Wrench,
  "hydraulika-wymiana-wc": Toilet,
  "hydraulika-lokalizacja-wyciekow": Camera,
  "hydraulika-co-odpowietrzanie": Thermometer,
  "hydraulika-serwis-grzejnikow": Thermometer,
  "hydraulika-inne": Wrench,

  // Elektryka
  "elektryka-montaz-oswietlenia": Lightbulb,
  "elektryka-wymiana-bezpiecznikow": Plug,
  "elektryka-pomiary": Gauge,
  "elektryka-smart-home": Cpu,
  "elektryka-stacje-ladowania": Car,
  "elektryka-rtv-sat": Monitor,
  "elektryka-inne": Zap,

  // AGD i RTV
  "agd-montaz-tv": Monitor,
  "agd-konfiguracja-smart": Cpu,
  "agd-instalacja-okapu": Fan,
  "agd-naprawa": Wrench,
  "agd-naprawa-rtv": Monitor,
  "agd-inne": Wrench,

  // Klimatyzacja i ogrzewanie
  "klima-montaz": Snowflake,
  "klima-nabicie-czynnika": Snowflake,
  "klima-serwis-pomp": Thermometer,
  "klima-regulacja-co": Thermometer,
  "klima-kominiarz": Flame,
  "klima-inne": Snowflake,

  // Remont i wykończenia
  "remont-malowanie": Paintbrush,
  "remont-gladzie": Paintbrush,
  "remont-zabudowy-gk": Hammer,
  "remont-tynki": Hammer,
  "remont-montaz-drzwi": Hammer,
  "remont-silikonowanie": Wrench,
  "remont-cyklinowanie": Hammer,
  "remont-posadzki": Hammer,
  "remont-montaz-paneli": Hammer,
  "remont-glazura": Hammer,
  "remont-naprawa-okien": Hammer,
  "remont-tapetowanie": Paintbrush,
  "remont-montaz-listew": Hammer,
  "remont-inne": Hammer,

  // Stolarstwo i montaż
  "stolarstwo-skladanie-mebli": Hammer,
  "stolarstwo-naprawa-drzwi": Hammer,
  "stolarstwo-blaty": Ruler,
  "stolarstwo-zabudowy": Hammer,
  "stolarstwo-listwy": Hammer,
  "stolarstwo-karnisze": Hammer,
  "stolarstwo-inne": Hammer,

  // Ślusarz i zabezpieczenia
  "slusarz-otwieranie-drzwi": Lock,
  "slusarz-wymiana-zamka": Lock,
  "slusarz-zamki-antywlamaniowe": Lock,
  "slusarz-wizjery": Camera,
  "slusarz-sejfy": Lock,
  "slusarz-naprawa-rolet": Lock,
  "slusarz-inne": Lock,

  // Sprzątanie
  "sprzatanie-mieszkanie": Sparkles,
  "sprzatanie-po-remoncie": Sparkles,
  "sprzatanie-biura": Sparkles,
  "sprzatanie-pranie-dywanow": Sparkles,
  "sprzatanie-mycie-okien": Sparkles,
  "sprzatanie-pranie-tapicerki": Sparkles,
  "sprzatanie-piwnice-strychy": Sparkles,
  "sprzatanie-inne": Sparkles,

  // Dom i ogród
  "ogrod-pielegnacja": Leaf,
  "ogrod-projekt": Leaf,
  "ogrod-mala-architektura": Ruler,
  "ogrod-nawadnianie": Droplets,
  "ogrod-trawnik": Leaf,
  "ogrod-systemy-nawadniania": Droplets,
  "ogrod-ogrodzenia": Hammer,
  "ogrod-altany": Hammer,
  "ogrod-odśnieżanie": Snowflake,
  "ogrod-koszenie": Leaf,
  "ogrod-przycinanie": Leaf,
  "ogrod-usuwanie-gniazd": Bug,
  "ogrod-czyszczenie-pieca": Flame,
  "ogrod-czyszczenie-dachu": Hammer,
  "ogrod-grabienie-lisci": Leaf,
  "ogrod-moskitiery": Hammer,
  "ogrod-inne": Leaf,

  // Auto mobilne
  "auto-wymiana-akumulatora": Car,
  "auto-wymiana-kola": Car,
  "auto-wymiana-opon": Car,
  "auto-rozruch": Car,
  "auto-holowanie": Truck,
  "auto-diagnostyka": Monitor,
  "auto-wymiana-czesci": Car,
  "auto-myjnia": Droplets,
  "auto-dowoz-paliwa": Car,
  "auto-inne": Car,

  // IT
  "it-naprawa-laptopow": Laptop,
  "it-instalacja-systemu": Laptop,
  "it-usuwanie-wirusow": Shield,
  "it-konfiguracja-wifi": Wifi,
  "it-backup": Cloud,
  "it-konfiguracja-telefonu": Smartphone,
  "it-smart-home-konfiguracja": Cpu,
  "it-inne": Laptop,

  // Zdrowie
  "zdrowie-telekonsultacja": Stethoscope,
  "zdrowie-wizyty-domowe": Stethoscope,
  "zdrowie-wizyty-pielegniarskie": Stethoscope,
  "zdrowie-fizjoterapeuta": Heart,
  "zdrowie-asystent-seniora": Heart,
  "zdrowie-inne": Stethoscope,

  // Zwierzęta
  "zwierzeta-konsultacja-weterynaryjna": PawPrint,
  "zwierzeta-wyprowadzanie-psa": PawPrint,
  "zwierzeta-opieka-dzienna": PawPrint,
  "zwierzeta-wizyty-karmienie": PawPrint,
  "zwierzeta-transport": Truck,
  "zwierzeta-groomer": Scissors,
  "zwierzeta-behawiorysta": PawPrint,
  "zwierzeta-weterynarz-domowy": Stethoscope,
  "zwierzeta-inne": PawPrint,

  // Dezynsekcja/szkodniki
  "dezynsekcja-pluskwy": Bug,
  "dezynsekcja-mrowki": Bug,
  "dezynsekcja-osy": Bug,
  "dezynsekcja-deratyzacja": Bug,
  "dezynsekcja-zabezpieczenia": Shield,
  "dezynsekcja-inne": Bug,

  // Przeprowadzki i transport
  "przeprowadzki-taxi-bagazowe": Truck,
  "przeprowadzki-transport-gabarytow": Truck,
  "przeprowadzki-demontaz-montaz": Hammer,
  "przeprowadzki-wnoszenie-znoszenie": Truck,
  "przeprowadzki-kurier-miejski": Truck,
  "przeprowadzki-inne": Truck,

  // Gaz
  "gaz-przeglad": Flame,
  "gaz-wyciek": Flame,
  "gaz-montaz-kuchenki": Flame,
  "gaz-wymiana-reduktorow": Wrench,
  "gaz-proby-szczelnosci": Gauge,
  "gaz-inne": Flame,

  // Wywóz/utylizacja
  "wywoz-gruz": Trash2,
  "wywoz-gabaryty": Trash2,
  "wywoz-elektrosmieci": Trash2,
  "wywoz-zielen": Trash2,
  "wywoz-czyszczenie-piwnic": Trash2,
  "wywoz-zlom": Trash2,
  "wywoz-fekalia": Trash2,
  "wywoz-inne": Trash2,

  // Pomoc 24/7
  "pomoc-awaria-hydrauliczna": Droplets,
  "pomoc-awaria-elektryczna": Zap,
  "pomoc-otwieranie-drzwi": Lock,
  "pomoc-pomoc-drogowa": Car,
  "pomoc-zabezpieczenie-po-zalaniu": Droplets,
  "pomoc-inne": Clock,

  // Złota rączka
  "zlota-raczka-montaz-tv": Hammer,
  "zlota-raczka-drobne-naprawy": Wrench,
  "zlota-raczka-silikonowanie": Wrench,
  "zlota-raczka-skrecanie-mebli": Hammer,
  "zlota-raczka-godzina-domu": Clock,
  "zlota-raczka-inne": Wrench,

  // Codzienne sprawy
  "codzienne-zakupy": ShoppingCart,
  "codzienne-odbior-paczek": Package,
  "codzienne-pomoc-przeprowadzce": Package,
  "codzienne-drobne-porzadki": Sparkles,
  "codzienne-inne": ShoppingCart,

  // Urzędy i formalności
  "urzedy-wypelnianie-wnioskow": FileText,
  "urzedy-rejestracja-auta": FileText,
  "urzedy-tlumaczenie": FileText,
  "urzedy-umawianie-wizyt": Calendar,
  "urzedy-inne": FileText,

  // Edukacja i korepetycje
  "edukacja-matematyka": GraduationCap,
  "edukacja-nauka-komputera": Laptop,
  "edukacja-zadania-domowe": Book,
  "edukacja-kursy-krotkie": Laptop,
  "edukacja-inne": GraduationCap,

  // Rower / hulajnoga
  "rower-serwis": Bike,
  "rower-wymiana-detki": Bike,
  "rower-konserwacja-hulajnogi": Bike,
  "rower-inne": Bike,

  // Monitoring i alarmy
  "monitoring-montaz-kamer": Camera,
  "monitoring-konfiguracja-alarmu": Shield,
  "monitoring-inne": Camera,

  // Akwarystyka
  "akwarystyka-zakladanie": Fish,
  "akwarystyka-aranzacja": Fish,
  "akwarystyka-podmiany-wody": Droplets,
  "akwarystyka-inne": Fish,

  // Wynajem
  "wynajem-przyczepy": Truck,
  "wynajem-maszyny-budowlane": Hammer,
  "wynajem-narzedzia": Wrench,
  "wynajem-foto-video": Camera,
  "wynajem-sprzet-eventowy": Music,
  "wynajem-sport-outdoor": Mountain,
  "wynajem-samochod": Car,
  "wynajem-inne": Package,

  // Architektura
  "architektura-konsultacje": Ruler,
  "architektura-projekt-koncepcyjny": Ruler,
  "architektura-wizualizacje": Monitor,
  "architektura-inwentaryzacja": Ruler,
  "architektura-audyt": Ruler,
  "architektura-projekt-budowlany": Ruler,
  "architektura-inne": Ruler,

  // Inne
  "inne-opisz-problem": PlusCircle,

  // Stare mapowanie (dla kompatybilności)
  hydraulika: Wrench,
  elektryka: Zap,
  agd_rtv: Monitor,
  "agd-rtv": Monitor, // Nowe ID z myślnikami
  // nowe ID kategorii nadrzędnych (spójne z servicesCatalog)
  klimatyzacja_ogrzewanie: Snowflake,
  "klimatyzacja-ogrzewanie": Snowflake, // Nowe ID z myślnikami
  "remont_wykończenia": Paintbrush,
  "remont-wykonczenia": Paintbrush, // Nowe ID z myślnikami
  stolarstwo_montaz: Hammer,
  "stolarstwo-montaz": Hammer, // Nowe ID z myślnikami
  slusarz_zabezpieczenia: Lock,
  "slusarz-zabezpieczenia": Lock, // Nowe ID z myślnikami
  sprzatanie: Sparkles,
  klima_ogrz: Snowflake,
  remont: Paintbrush,
  stol_montaz: Hammer,
  slusarz: Lock,
  dom_ogrod: Leaf,
  "dom-ogrod": Leaf, // Nowe ID z myślnikami
  auto_mobilne: Car,
  "auto-mobilne": Car, // Nowe ID z myślnikami
  it: Laptop,
  zdrowie: Stethoscope,
  zwierzeta: PawPrint,
  dezynsekcja_szkodniki: Bug,
  "dezynsekcja-szkodniki": Bug, // Nowe ID z myślnikami
  przeprowadzki_transport: Truck,
  "przeprowadzki-transport": Truck, // Nowe ID z myślnikami
  it_smart: Laptop,
  wywoz_utylizacja: Trash2,
  "wywoz-utylizacja": Trash2, // Nowe ID z myślnikami
  pomoc_24h: Clock,
  "pomoc-24-7": Clock, // Nowe ID z myślnikami
  codzienne_sprawy: ShoppingCart,
  "codzienne-sprawy": ShoppingCart, // Nowe ID z myślnikami
  urzedy_formalnosci: FileText,
  "urzedy-formalnosci": FileText, // Nowe ID z myślnikami
  edukacja_korepetycje: GraduationCap,
  "edukacja-korepetycje": GraduationCap, // Nowe ID z myślnikami
  monitoring_alarmy: Camera,
  "monitoring-alarms": Camera, // Nowe ID z myślnikami
  wynajem: Package,
  architektura: Ruler,
  pest: Bug,
  przeprowadzki: Truck,
  gaz: Flame,
  odpady: Trash2,
  "24h": Clock,
  zlota_raczka: Wrench,
  "zlota-raczka": Wrench, // Nowe ID z myślnikami
  urzedy: FileText,
  edukacja: GraduationCap,
  rower_hulajnoga: Bike,
  "rower-hulajnoga": Bike, // Nowe ID z myślnikami
  monitoring: Camera,
  akwarystyka: Fish,
  piec: Flame,
  klima: Snowflake,
  lekarz: Stethoscope,
  teleporada: Smartphone, // Nowa kategoria
  inne: PlusCircle,
};

// Wygodne API: <IconByCategory id="hydraulika" />
export function IconByCategory({ id, className, ...rest }) {
  const Icon = CATEGORY_ICONS[id] || PlusCircle;
  return <CategoryIcon icon={Icon} className={className} {...rest} />;
}

// Helper: zwróć komponent ikony lub fallback
export function getIconBySlug(slug) {
  return CATEGORY_ICONS[slug] || Wrench;
}

export default CATEGORY_ICONS;