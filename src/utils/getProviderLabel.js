/**
 * Określa etykietę providera na podstawie jego usług
 * @param {Object} user - Obiekt użytkownika z polem services
 * @param {Array} allServices - Wszystkie dostępne usługi (opcjonalne, dla mapowania)
 * @returns {string} - Etykieta providera (np. "Jan Kowalski - Hydraulik" lub "Jan Kowalski - Złota rączka")
 */
export function getProviderLabel(user, allServices = []) {
  if (!user || !user.name) {
    return user?.name || 'Provider';
  }

  const name = user.name;
  const services = user.services || [];

  // Jeśli nie ma usług, zwróć tylko imię
  if (services.length === 0) {
    return name;
  }

  // Pobierz nazwy usług (obsługa zarówno obiektów jak i stringów)
  const serviceNames = services.map(s => {
    if (typeof s === 'string') {
      // Jeśli to string, może być ID - spróbuj znaleźć w allServices
      const found = allServices.find(svc => svc._id === s || svc.id === s);
      return found ? (found.name_pl || found.name_en || found.name) : s;
    }
    return s.name_pl || s.name_en || s.name || s;
  }).filter(Boolean);

  // Jeśli jedna usługa - pokaż ją
  if (serviceNames.length === 1) {
    return `${name} - ${serviceNames[0]}`;
  }

  // Jeśli kilka usług - określ kategorię
  if (serviceNames.length > 1) {
    // Pobierz kategorie usług (parent_slug)
    const categories = new Set();
    services.forEach(service => {
      const serviceObj = typeof service === 'string' 
        ? allServices.find(s => s._id === service || s.id === service)
        : service;
      
      if (serviceObj && serviceObj.parent_slug) {
        categories.add(serviceObj.parent_slug);
      }
    });

    // Jeśli wszystkie usługi są z jednej kategorii - pokaż kategorię
    if (categories.size === 1) {
      const categorySlug = Array.from(categories)[0];
      const categoryName = getCategoryName(categorySlug);
      return `${name} - ${categoryName}`;
    }

    // Jeśli różne kategorie - pokaż "Złota rączka" lub podobne
    // Sprawdź czy to typowe usługi "złotej rączki"
    const isHandyman = checkIfHandyman(serviceNames, categories);
    if (isHandyman) {
      return `${name} - Złota rączka`;
    }

    // W przeciwnym razie pokaż pierwszą kategorię + "i inne"
    const firstCategory = Array.from(categories)[0];
    const firstCategoryName = getCategoryName(firstCategory);
    return `${name} - ${firstCategoryName} i inne`;
  }

  return name;
}

/**
 * Mapowanie slugów kategorii na nazwy (eksportowane do ProviderProfile)
 */
export function getCategoryName(slug) {
  if (!slug) return '';
  const categoryNames = {
    'hydraulika': 'Hydraulika',
    'elektryka': 'Elektryka',
    'agd': 'AGD i RTV',
    'agd_rtv': 'AGD i RTV',
    'klima_ogrz': 'Klimatyzacja i ogrzewanie',
    'remont': 'Remont i wykończenia',
    'montaz': 'Montaż i stolarka',
    'stol_montaz': 'Montaż i stolarka',
    'slusarz': 'Ślusarz',
    'sprzatanie': 'Sprzątanie',
    'ogrod': 'Ogród',
    'auto_mobilne': 'Auto mobilnie',
    'it_smart': 'IT i Smart home',
    'zdrowie': 'Zdrowie (tele)',
    'teleporada': 'Teleporady',
    'zwierzeta': 'Zwierzęta',
    'pest': 'Dezynsekcja',
    'przeprowadzki': 'Przeprowadzki',
    'gaz': 'Gaz',
    'odpady': 'Wywóz',
    '24h': 'Awaryjne 24/7',
    'okna_drzwi': 'Okna i drzwi',
    'dach_rzyg': 'Dach i rynny',
    'podlogi': 'Podłogi',
    'mal_tap': 'Malowanie',
    'inne': 'Inne'
  };
  return categoryNames[slug] || slug;
}

/**
 * Sprawdza czy usługi kwalifikują się jako "Złota rączka"
 * (różne drobne usługi z różnych kategorii)
 */
function checkIfHandyman(serviceNames, categories) {
  // Jeśli ma więcej niż 3 różne kategorie - prawdopodobnie złota rączka
  if (categories.size >= 3) {
    return true;
  }

  // Jeśli ma usługi z typowych kategorii "złotej rączki"
  const handymanCategories = ['slusarz', 'montaz', 'remont', 'stol_montaz', 'okna_drzwi', 'mal_tap'];
  const hasHandymanCategory = Array.from(categories).some(cat => handymanCategories.includes(cat));
  
  // Jeśli ma kategorię "złotej rączki" i więcej niż 2 usługi
  if (hasHandymanCategory && serviceNames.length >= 3) {
    return true;
  }

  return false;
}

/**
 * Pobiera tylko etykietę usługi (bez imienia)
 */
export function getProviderServiceLabel(user, allServices = []) {
  if (!user) return '';
  
  const services = user.services || [];
  if (services.length === 0) return '';

  const serviceNames = services.map(s => {
    if (typeof s === 'string') {
      const found = allServices.find(svc => svc._id === s || svc.id === s);
      return found ? (found.name_pl || found.name_en || found.name) : s;
    }
    return s.name_pl || s.name_en || s.name || s;
  }).filter(Boolean);

  if (serviceNames.length === 1) {
    return serviceNames[0];
  }

  const categories = new Set();
  services.forEach(service => {
    const serviceObj = typeof service === 'string' 
      ? allServices.find(s => s._id === service || s.id === service)
      : service;
    
    if (serviceObj && serviceObj.parent_slug) {
      categories.add(serviceObj.parent_slug);
    }
  });

  if (categories.size === 1) {
    const categorySlug = Array.from(categories)[0];
    return getCategoryName(categorySlug);
  }

  const isHandyman = checkIfHandyman(serviceNames, categories);
  if (isHandyman) {
    return 'Złota rączka';
  }

  return serviceNames[0] + ' i inne';
}













