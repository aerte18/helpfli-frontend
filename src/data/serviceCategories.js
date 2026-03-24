// Kategorie usług pomocowych - zaktualizowany katalog mikro-usług
export const serviceCategories = [
  {
    id: 'hydraulika',
    name: 'Hydraulika',
    icon: '🔧',
    subcategories: [
      { id: 'cieknacy_kran', name: 'Cieknący kran', keywords: ['kran', 'cieknie', 'naprawa'] },
      { id: 'zapchany_zlew', name: 'Zapchany zlew/odpływ', keywords: ['zlew', 'zapchany', 'odpływ'] },
      { id: 'wyciek_pod_zlewem', name: 'Wyciek pod zlewem', keywords: ['wyciek', 'zlew', 'pod'] },
      { id: 'wc_nie_spuszcza', name: 'WC nie spłukuje/przecieka', keywords: ['wc', 'toaleta', 'spłukuje'] },
      { id: 'wymiana_syfonu', name: 'Wymiana syfonu', keywords: ['syfon', 'wymiana', 'zlew'] },
      { id: 'podlaczenie_zmywarki', name: 'Podłączenie zmywarki', keywords: ['zmywarka', 'podłączenie', 'montaż'] },
      { id: 'montaz_kabiny', name: 'Montaż kabiny prysznicowej', keywords: ['kabina', 'prysznic', 'montaż'] },
      { id: 'wymiana_deski_wc', name: 'Wymiana deski WC', keywords: ['deska', 'wc', 'wymiana'] },
      { id: 'bidetka_montaz', name: 'Montaż bidetki/armatury', keywords: ['bidetka', 'armatura', 'montaż'] },
      { id: 'grzejnik_nie_grzeje', name: 'Grzejnik nie grzeje', keywords: ['grzejnik', 'grzeje', 'naprawa'] },
      { id: 'rura_zamarzla', name: 'Zamarznięta rura', keywords: ['rura', 'zamarznięta', 'naprawa'] },
      { id: 'pion_szumi', name: 'Szumiący pion / uderzenia hydrauliczne', keywords: ['pion', 'szumi', 'uderzenia'] },
      { id: 'hydraulika_inne', name: 'Inne', keywords: ['inne', 'hydraulika', 'inny problem'] }
    ]
  },
  {
    id: 'elektryka',
    name: 'Elektryka',
    icon: '⚡',
    subcategories: [
      { id: 'gniazdko_iskrzy', name: 'Iskrzące/luźne gniazdko', keywords: ['gniazdko', 'iskrzy', 'luźne'] },
      { id: 'brak_pradu_pokoj', name: 'Brak prądu w pokoju', keywords: ['prąd', 'brak', 'pokój'] },
      { id: 'montaz_lampy', name: 'Montaż lampy/plafonu', keywords: ['lampa', 'plafon', 'montaż'] },
      { id: 'rcd_wybija', name: 'Różnicówka wybija', keywords: ['różnicówka', 'wybija', 'prąd'] },
      { id: 'gniazdo_dodatkowe', name: 'Montaż dodatkowego gniazda', keywords: ['gniazdko', 'dodatkowe', 'montaż'] },
      { id: 'domofon_naprawa', name: 'Naprawa domofonu/dzwonka', keywords: ['domofon', 'dzwonek', 'naprawa'] },
      { id: 'elektryka_inne', name: 'Inne', keywords: ['inne', 'elektryka', 'inny problem'] }
    ]
  },
  {
    id: 'agd',
    name: 'AGD i RTV',
    icon: '📺',
    subcategories: [
      { id: 'zmywarka_nie_odprowadza', name: 'Zmywarka nie odprowadza', keywords: ['zmywarka', 'odprowadza', 'naprawa'] },
      { id: 'pralka_halas', name: 'Pralka hałasuje', keywords: ['pralka', 'hałasuje', 'naprawa'] },
      { id: 'lodowka_nie_chlodzi', name: 'Lodówka nie chłodzi', keywords: ['lodówka', 'chłodzi', 'naprawa'] },
      { id: 'tv_nie_wlacza', name: 'TV nie włącza / migocze', keywords: ['tv', 'telewizor', 'włącza', 'migocze'] },
      { id: 'soundbar_parowanie', name: 'Parowanie soundbara/TV', keywords: ['soundbar', 'parowanie', 'tv'] },
      { id: 'agd_inne', name: 'Inne', keywords: ['inne', 'agd', 'rtv', 'inny problem'] }
    ]
  },
  {
    id: 'hvac',
    name: 'Klimatyzacja i ogrzewanie (HVAC)',
    icon: '❄️',
    subcategories: [
      { id: 'klima_czyszczenie', name: 'Czyszczenie klimatyzacji', keywords: ['klimatyzacja', 'czyszczenie', 'serwis'] },
      { id: 'piec_przeglad', name: 'Przegląd pieca gazowego', keywords: ['piec', 'gazowy', 'przegląd'] },
      { id: 'termostat_montaz', name: 'Montaż termostatu smart', keywords: ['termostat', 'smart', 'montaż'] },
      { id: 'brak_ogrzewania', name: 'Brak ogrzewania (awaria)', keywords: ['ogrzewanie', 'brak', 'awaria'] },
      { id: 'hvac_inne', name: 'Inne', keywords: ['inne', 'hvac', 'klimatyzacja', 'ogrzewanie'] }
    ]
  },
  {
    id: 'remont',
    name: 'Remont i wykończenia',
    icon: '🎨',
    subcategories: [
      { id: 'regulacja_okien', name: 'Regulacja okien (do 4)', keywords: ['okna', 'regulacja', 'naprawa'] },
      { id: 'uszczelka_okno_wymiana', name: 'Wymiana uszczelki okna (1)', keywords: ['uszczelka', 'okno', 'wymiana'] },
      { id: 'montaz_moskitiery', name: 'Montaż moskitiery (okno)', keywords: ['moskitiera', 'okno', 'montaż'] },
      { id: 'serwis_rolet', name: 'Serwis rolet zewnętrznych', keywords: ['rolety', 'zewnętrzne', 'serwis'] },
      { id: 'panele_10m', name: 'Montaż paneli 10 m²', keywords: ['panele', 'podłoga', 'montaż'] },
      { id: 'listwy_przypodlogowe', name: 'Montaż listew (pokój)', keywords: ['listwy', 'przypodłogowe', 'montaż'] },
      { id: 'cyklinowanie_maly_pokoj', name: 'Cyklinowanie (mały pokój)', keywords: ['cyklinowanie', 'podłoga', 'parkiet'] },
      { id: 'malowanie_pokoju', name: 'Malowanie pokoju do 15 m²', keywords: ['malowanie', 'pokój', 'farba'] },
      { id: 'tapetowanie_sciany', name: 'Tapetowanie ściany', keywords: ['tapeta', 'ściana', 'montaż'] },
      { id: 'naprawy_ubytkow', name: 'Drobne naprawy ścian', keywords: ['ściany', 'ubytki', 'naprawa'] },
      { id: 'remont_inne', name: 'Inne', keywords: ['inne', 'remont', 'wykończenia'] }
    ]
  },
  {
    id: 'montaz',
    name: 'Montaż i stolarka',
    icon: '🔨',
    subcategories: [
      { id: 'meble_ikea_1', name: 'Montaż mebla IKEA (1 szt.)', keywords: ['meble', 'ikea', 'montaż'] },
      { id: 'tv_na_scianie', name: 'TV na ścianie', keywords: ['tv', 'ściana', 'montaż'] },
      { id: 'drzwi_regulacja', name: 'Regulacja drzwi', keywords: ['drzwi', 'regulacja', 'naprawa'] },
      { id: 'rolety_wewn_montaz', name: 'Montaż rolet wewnętrznych (2 szt.)', keywords: ['rolety', 'wewnętrzne', 'montaż'] },
      { id: 'montaz_inne', name: 'Inne', keywords: ['inne', 'montaż', 'stolarka'] }
    ]
  },
  {
    id: 'slusarz',
    name: 'Ślusarz i zabezpieczenia',
    icon: '🔐',
    subcategories: [
      { id: 'awaryjne_otwarcie', name: 'Awaryjne otwarcie drzwi', keywords: ['awaryjne', 'otwarcie', 'drzwi'] },
      { id: 'wymiana_zamka', name: 'Wymiana zamka/cylindra', keywords: ['zamek', 'cylinder', 'wymiana'] },
      { id: 'slusarz_inne', name: 'Inne', keywords: ['inne', 'ślusarz', 'zabezpieczenia'] }
    ]
  },
  {
    id: 'sprzatanie',
    name: 'Sprzątanie',
    icon: '🧹',
    subcategories: [
      { id: 'generalne_mieszkanie', name: 'Sprzątanie generalne mieszkania', keywords: ['sprzątanie', 'generalne', 'mieszkanie'] },
      { id: 'mycie_okien_6', name: 'Mycie okien (do 6)', keywords: ['okna', 'mycie', 'czyszczenie'] },
      { id: 'pranie_tapicerki', name: 'Pranie tapicerki kanapy', keywords: ['tapicerka', 'kanapa', 'pranie'] },
      { id: 'sprzatanie_inne', name: 'Inne', keywords: ['inne', 'sprzątanie', 'czyszczenie'] }
    ]
  },
  {
    id: 'ogrod',
    name: 'Ogród i zew.',
    icon: '🌱',
    subcategories: [
      { id: 'koszenie_300', name: 'Koszenie trawnika (do 300 m²)', keywords: ['koszenie', 'trawnik', 'ogród'] },
      { id: 'przycinka_krzewow', name: 'Przycinanie krzewów', keywords: ['przycinanie', 'krzewy', 'ogród'] },
      { id: 'usuwanie_osy_szerszenie', name: 'Usuwanie gniazd os/szerszeni', keywords: ['osy', 'szerszenie', 'gniazda', 'usuwanie'] },
      { id: 'ogrod_inne', name: 'Inne', keywords: ['inne', 'ogród', 'zewnętrzne'] }
    ]
  },
  {
    id: 'auto',
    name: 'Auto mobilnie',
    icon: '🚗',
    subcategories: [
      { id: 'akumulator_mobilnie', name: 'Mobilna wymiana akumulatora', keywords: ['akumulator', 'mobilnie', 'auto'] },
      { id: 'opona_mobilnie', name: 'Wymiana koła mobilnie', keywords: ['opona', 'koło', 'mobilnie', 'auto'] },
      { id: 'kable_rozruchowe', name: 'Rozruch z kabli', keywords: ['rozruch', 'kable', 'auto'] },
      { id: 'dowoz_paliwa', name: 'Dowóz paliwa', keywords: ['paliwo', 'dowóz', 'auto'] },
      { id: 'auto_inne', name: 'Inne', keywords: ['inne', 'auto', 'mobilnie'] }
    ]
  },
  {
    id: 'it',
    name: 'IT i Smart home',
    icon: '💻',
    subcategories: [
      { id: 'wifi_remote', name: 'Optymalizacja Wi-Fi (zdalnie)', keywords: ['wifi', 'zdalnie', 'optymalizacja'] },
      { id: 'smart_zamek', name: 'Montaż smart zamka', keywords: ['smart', 'zamek', 'montaż'] },
      { id: 'nas_konfiguracja', name: 'Konfiguracja NAS (zdalnie)', keywords: ['nas', 'konfiguracja', 'zdalnie'] },
      { id: 'kamera_montaz', name: 'Montaż kamery Wi-Fi', keywords: ['kamera', 'wifi', 'montaż'] },
      { id: 'it_inne', name: 'Inne', keywords: ['inne', 'it', 'smart home'] }
    ]
  },
  {
    id: 'zdrowie',
    name: 'Zdrowie (tele)',
    icon: '🏥',
    subcategories: [
      { id: 'lekarz_telefon', name: 'Lekarz na telefon (telekonsultacja)', keywords: ['lekarz', 'telefon', 'tele', 'konsultacja'] },
      { id: 'dermatolog_tele', name: 'Dermatolog online (tele)', keywords: ['dermatolog', 'online', 'tele', 'skóra'] },
      { id: 'pediatra_tele', name: 'Pediatra online (tele)', keywords: ['pediatra', 'online', 'tele', 'dziecko'] },
      { id: 'zdrowie_inne', name: 'Inne', keywords: ['inne', 'zdrowie', 'tele', 'konsultacja'] }
    ]
  },
  {
    id: 'zwierzeta',
    name: 'Zwierzęta (tele)',
    icon: '🐕',
    subcategories: [
      { id: 'weterynarz_tele', name: 'Telekonsultacja weterynaryjna', keywords: ['weterynarz', 'tele', 'zwierzę', 'konsultacja'] },
      { id: 'behawiorysta_tele', name: 'Behawiorysta (tele)', keywords: ['behawiorysta', 'tele', 'zwierzę', 'zachowanie'] },
      { id: 'zwierzeta_inne', name: 'Inne', keywords: ['inne', 'zwierzęta', 'tele', 'weterynaria'] }
    ]
  },
  {
    id: 'dezynsekcja',
    name: 'Dezynsekcja / szkodniki',
    icon: '🐛',
    subcategories: [
      { id: 'pluskwy_dezynsekcja', name: 'Zwalczanie pluskiew (mieszkanie)', keywords: ['pluskwy', 'dezynsekcja', 'zwalczanie'] },
      { id: 'mrowki_dezynsekcja', name: 'Mrówki w mieszkaniu', keywords: ['mrówki', 'dezynsekcja', 'zwalczanie'] },
      { id: 'deratyzacja_gryzonie', name: 'Deratyzacja – gryzonie', keywords: ['gryzonie', 'deratyzacja', 'szczury', 'myszy'] },
      { id: 'dezynsekcja_inne', name: 'Inne', keywords: ['inne', 'dezynsekcja', 'szkodniki'] }
    ]
  },
  {
    id: 'transport',
    name: 'Przeprowadzki i transport',
    icon: '🚚',
    subcategories: [
      { id: 'bus_2h', name: 'Bus z kierowcą (2h)', keywords: ['bus', 'kierowca', 'transport'] },
      { id: 'pianino_transport', name: 'Transport pianina (2 os.)', keywords: ['pianino', 'transport', 'dźwig'] },
      { id: 'transport_inne', name: 'Inne', keywords: ['inne', 'transport', 'przeprowadzki'] }
    ]
  },
  {
    id: 'gaz',
    name: 'Gaz / instalacje',
    icon: '⛽',
    subcategories: [
      { id: 'wyciek_gazu_podejrzenie', name: 'Podejrzenie wycieku gazu', keywords: ['gaz', 'wyciek', 'podejrzenie'] },
      { id: 'gaz_inne', name: 'Inne', keywords: ['inne', 'gaz', 'instalacje'] }
    ]
  },
  {
    id: 'wywoz',
    name: 'Wywóz / utylizacja',
    icon: '🗑️',
    subcategories: [
      { id: 'wywoz_gruzu_bigbag', name: 'Wywóz gruzu (Big Bag)', keywords: ['gruz', 'wywóz', 'bigbag'] },
      { id: 'wywoz_mebli', name: 'Wywóz starych mebli', keywords: ['meble', 'wywóz', 'utylizacja'] },
      { id: 'wywoz_inne', name: 'Inne', keywords: ['inne', 'wywóz', 'utylizacja'] }
    ]
  },
  {
    id: 'awaryjne',
    name: 'Awaryjne 24/7',
    icon: '⏰',
    subcategories: [
      { id: 'hydraulik_24', name: 'Hydraulik 24/7 (awaria)', keywords: ['hydraulik', '24/7', 'awaria'] },
      { id: 'elektryk_24', name: 'Elektryk 24/7 (awaria)', keywords: ['elektryk', '24/7', 'awaria'] },
      { id: 'awaryjne_inne', name: 'Inne', keywords: ['inne', 'awaryjne', '24/7'] }
    ]
  },
  {
    id: 'teleporada',
    name: 'Teleporada',
    icon: '📞',
    subcategories: [
      { id: 'teleporada_lekarz', name: 'Lekarz', keywords: ['lekarz', 'konsultacja', 'zdrowie', 'teleporada'] },
      { id: 'teleporada_prawnik', name: 'Prawnik', keywords: ['prawnik', 'porada', 'prawo', 'konsultacja'] },
      { id: 'teleporada_specjalista_it', name: 'Specjalista IT', keywords: ['it', 'specjalista', 'konsultacja', 'technologia'] },
      { id: 'teleporada_doradca_biznesowy', name: 'Doradca biznesowy', keywords: ['biznes', 'doradca', 'konsultacja', 'strategia'] },
      { id: 'teleporada_psycholog', name: 'Psycholog', keywords: ['psycholog', 'terapia', 'konsultacja', 'wsparcie'] },
      { id: 'teleporada_korepetycje', name: 'Korepetycje', keywords: ['korepetycje', 'nauka', 'edukacja', 'konsultacja'] },
      { id: 'teleporada_doradca_nieruchomosci', name: 'Doradca nieruchomości', keywords: ['nieruchomości', 'doradca', 'konsultacja', 'mieszkanie'] },
      { id: 'teleporada_inne', name: 'Inne', keywords: ['inne', 'teleporada', 'konsultacja'] }
    ]
  },
  {
    id: 'webinary_szkolenia',
    name: 'Webinary i szkolenia',
    icon: '🎓',
    subcategories: [
      { id: 'webinary_szkolenie_online', name: 'Szkolenie online', keywords: ['szkolenie', 'online', 'nauka', 'edukacja'] },
      { id: 'webinary_warsztat_grupowy', name: 'Warsztat grupowy online', keywords: ['warsztat', 'grupowy', 'online', 'szkolenie'] },
      { id: 'webinary_webinarium', name: 'Webinarium', keywords: ['webinarium', 'szkolenie', 'online', 'prezentacja'] },
      { id: 'webinary_kurs_online', name: 'Kurs online', keywords: ['kurs', 'online', 'nauka', 'edukacja'] },
      { id: 'webinary_szkolenie_zawodowe', name: 'Szkolenie zawodowe', keywords: ['szkolenie', 'zawodowe', 'profesjonalne', 'kariera'] },
      { id: 'webinary_masterclass', name: 'Masterclass', keywords: ['masterclass', 'zaawansowane', 'ekspert', 'szkolenie'] },
      { id: 'webinary_konsultacja_grupowa', name: 'Konsultacja grupowa', keywords: ['konsultacja', 'grupowa', 'warsztat', 'zespół'] },
      { id: 'webinary_inne', name: 'Inne', keywords: ['inne', 'webinary', 'szkolenia', 'online'] }
    ]
  },
  {
    id: 'inne',
    name: 'Inne / nie na liście',
    icon: '➕',
    subcategories: [
      { id: 'inne_zlecenie', name: 'Inne – opiszę problem', keywords: ['inne', 'problem', 'opiszę'] },
      { id: 'konsultacja_ai', name: 'Konsultacja z AI (zdalnie)', keywords: ['ai', 'konsultacja', 'zdalnie', 'pomoc'] }
    ]
  }
];