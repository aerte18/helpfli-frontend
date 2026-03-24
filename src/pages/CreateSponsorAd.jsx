import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CreateSponsorAd() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Dane firmy
    advertiser: {
      companyName: "",
      email: "",
      phone: "",
      website: "",
      nip: "",
      address: {
        street: "",
        city: "",
        postalCode: "",
        country: "Polska",
      },
    },
    // Reklama
    adType: "parts_store",
    title: "",
    description: "",
    keywords: "",
    serviceCategories: "",
    link: "",
    ctaText: "Sprawdź ofertę",
    mediaType: "image", // image, gif, video
    // Pakiet reklamowy
    package: "custom", // starter, premium, enterprise, custom
    displayLocations: [], // Wybrane pozycje reklamowe
    subscriptionMonths: 1, // Liczba miesięcy subskrypcji (1, 3, 6, 12)
    // Geotargeting
    geotargeting: {
      enabled: false,
      type: 'country', // country, voivodeship, city, district, radius
      voivodeships: [],
      cities: [],
      districts: [],
      radiusTargets: []
    },
    // Kampania
    campaign: {
      budget: "",
      pricingModel: "package", // package, cpc, cpm, cpa, flat
      pricePerClick: "",
      pricePerImpression: "",
      startDate: "",
      endDate: "",
      monthlyLimit: "", // Dla pakietów
    },
  });

  // Definicje pakietów
  const packages = {
    starter: {
      name: "Pakiet Starter",
      price: 299,
      description: "Idealny dla małych firm",
      features: [
        "Banner na stronie głównej",
        "Reklamy w AI Concierge",
        "Do 1000 wyświetleń/miesiąc",
        "Podstawowe statystyki",
        "Geotargeting: Cała Polska"
      ],
      displayLocations: ["landing_page_banner", "ai_concierge"],
      monthlyLimit: 1000,
      priority: 5,
      discounts: {
        3: 0.10, // 10% zniżki za 3 miesiące
        6: 0.15, // 15% zniżki za 6 miesięcy
        12: 0.25 // 25% zniżki za 12 miesięcy
      },
      geotargeting: {
        enabled: true,
        type: 'country', // Cała Polska
        price: 0 // Darmowe
      }
    },
    premium: {
      name: "Pakiet Premium",
      price: 799,
      description: "Rekomendowany dla średnich firm",
      features: [
        "Wszystko z pakietu Starter",
        "Sidebar w wyszukiwaniu",
        "Sidebar w szczegółach zlecenia",
        "Reklamy między zleceniami",
        "Do 5000 wyświetleń/miesiąc",
        "Szczegółowe statystyki",
        "Priorytet w wyświetlaniu",
        "Geotargeting: Województwa (+50 zł/mies.)"
      ],
      displayLocations: ["landing_page_banner", "ai_concierge", "search_results", "order_details", "between_items"],
      monthlyLimit: 5000,
      priority: 7,
      discounts: {
        3: 0.10, // 10% zniżki za 3 miesiące
        6: 0.15, // 15% zniżki za 6 miesięcy
        12: 0.25 // 25% zniżki za 12 miesięcy
      },
      geotargeting: {
        enabled: true,
        type: 'voivodeship', // Województwa
        price: 50 // +50 zł/mies.
      }
    },
    enterprise: {
      name: "Pakiet Enterprise",
      price: 1999,
      description: "Dla dużych firm i sieci",
      features: [
        "Wszystkie pozycje reklamowe",
        "Nieograniczone wyświetlenia",
        "Najwyższy priorytet",
        "Dedykowane wsparcie",
        "Raporty PDF",
        "A/B testing",
        "Geotargeting: Miasta/Dzielnice/Radius (+100 zł/mies.)",
        "Retargeting (+30% ceny)",
        "Aukcje pozycji reklamowych"
      ],
      displayLocations: ["landing_page_banner", "ai_concierge", "search_results", "order_details", "between_items", "provider_list", "my_orders", "available_orders"],
      monthlyLimit: 999999,
      priority: 10,
      discounts: {
        3: 0.10, // 10% zniżki za 3 miesiące
        6: 0.15, // 15% zniżki za 6 miesięcy
        12: 0.25 // 25% zniżki za 12 miesięcy
      },
      geotargeting: {
        enabled: true,
        type: 'city', // Miasta, dzielnice, radius
        price: 100 // +100 zł/mies.
      }
    },
    // Seasonal packages
    seasonal_christmas: {
      name: "Pakiet Świąteczny",
      price: 1499,
      description: "Specjalna oferta na grudzień",
      features: [
        "Wszystkie pozycje reklamowe",
        "Priorytet w okresie świątecznym",
        "Do 10000 wyświetleń",
        "Specjalne świąteczne banery"
      ],
      displayLocations: ["landing_page_banner", "ai_concierge", "search_results"],
      monthlyLimit: 10000,
      priority: 9,
      seasonal: true,
      seasonalPeriod: "december"
    },
    seasonal_summer: {
      name: "Pakiet Wakacyjny",
      price: 1299,
      description: "Specjalna oferta na lato (lipiec-sierpień)",
      features: [
        "Wszystkie pozycje reklamowe",
        "Priorytet w okresie wakacyjnym",
        "Do 8000 wyświetleń",
        "Specjalne wakacyjne banery"
      ],
      displayLocations: ["landing_page_banner", "ai_concierge", "search_results"],
      monthlyLimit: 8000,
      priority: 8,
      seasonal: true,
      seasonalPeriod: "july-august"
    },
    seasonal_spring: {
      name: "Pakiet Remontowy",
      price: 1099,
      description: "Specjalna oferta na wiosnę (marzec-maj)",
      features: [
        "Wszystkie pozycje reklamowe",
        "Priorytet w okresie remontowym",
        "Do 6000 wyświetleń",
        "Specjalne banery remontowe"
      ],
      displayLocations: ["landing_page_banner", "ai_concierge", "search_results"],
      monthlyLimit: 6000,
      priority: 7,
      seasonal: true,
      seasonalPeriod: "march-may"
    },
    free_trial: {
      name: "Darmowa Próba",
      price: 0,
      description: "7 dni za darmo - idealny start!",
      features: [
        "7 dni darmowej reklamy",
        "Do 100 wyświetleń",
        "Banner na stronie głównej",
        "Bez zobowiązań",
        "Po próbie: 20% zniżki na pakiet"
      ],
      displayLocations: ["landing_page_banner"],
      monthlyLimit: 100,
      priority: 1,
      isFreeTrial: true
    },
    custom: {
      name: "Pakiet niestandardowy",
      price: 0,
      description: "Wybierz pozycje i model płatności",
      features: [
        "Elastyczny wybór pozycji",
        "CPC, CPM lub Flat Rate",
        "Dostosowany budżet"
      ],
      displayLocations: [],
      monthlyLimit: 0,
      priority: 3
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const API = import.meta.env.VITE_API_URL || "";
      const formDataToSend = new FormData();

      // Przygotuj dane
      formDataToSend.append("advertiser", JSON.stringify(formData.advertiser));
      formDataToSend.append("adType", formData.adType);
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("keywords", formData.keywords);
      formDataToSend.append("serviceCategories", formData.serviceCategories);
      formDataToSend.append("link", formData.link);
      formDataToSend.append("ctaText", formData.ctaText);
      formDataToSend.append("mediaType", formData.mediaType || 'image');
      formDataToSend.append("package", formData.package || 'custom');
      formDataToSend.append("displayLocations", JSON.stringify(formData.displayLocations || []));
      formDataToSend.append("isFreeTrial", (formData.package === 'free_trial').toString());
      formDataToSend.append("priority", packages[formData.package]?.priority?.toString() || '0');
      
      // Oblicz cenę z uwzględnieniem zniżki długoterminowej
      const monthlyPrice = packages[formData.package]?.price || 0;
      const discount = packages[formData.package]?.discounts?.[formData.subscriptionMonths] || 0;
      const totalPrice = monthlyPrice * formData.subscriptionMonths;
      const discountAmount = totalPrice * discount;
      const finalPrice = totalPrice - discountAmount;
      
      formDataToSend.append("subscriptionMonths", formData.subscriptionMonths.toString());
      formDataToSend.append("geotargeting", JSON.stringify(formData.geotargeting));
      formDataToSend.append("campaign", JSON.stringify({
        ...formData.campaign,
        budget: formData.package !== 'free_trial' ? Math.round(finalPrice * 100) : 0, // Konwersja na grosze z uwzględnieniem zniżki
        originalPrice: formData.package !== 'free_trial' ? Math.round(totalPrice * 100) : 0, // Oryginalna cena przed zniżką
        discountApplied: Math.round(discount * 100), // Zniżka w %
        pricePerClick: parseFloat(formData.campaign.pricePerClick) * 100 || 0,
        pricePerImpression: parseFloat(formData.campaign.pricePerImpression) * 100 || 0,
        startDate: new Date(formData.campaign.startDate),
        endDate: new Date(formData.campaign.endDate),
        subscriptionMonths: formData.subscriptionMonths
      }));

      // Dodaj obrazy jeśli są
      const imageInput = document.getElementById("image");
      const logoInput = document.getElementById("logo");
      if (imageInput?.files[0]) {
        formDataToSend.append("image", imageInput.files[0]);
      }
      if (logoInput?.files[0]) {
        formDataToSend.append("logo", logoInput.files[0]);
      }

      const res = await fetch(`${API}/api/sponsor-ads`, {
        method: "POST",
        body: formDataToSend,
      });

      const data = await res.json();

      if (res.ok) {
        if (data.isFreeTrial) {
          alert(
            "🎉 Darmowa próba została aktywowana! Twoja reklama będzie widoczna przez 7 dni lub do wyczerpania 100 wyświetleń. Po próbie otrzymasz specjalną ofertę z 20% zniżką!"
          );
        } else {
          alert(
            "Reklama została utworzona! Otrzymasz email z informacją o akceptacji."
          );
        }
        navigate("/");
      } else {
        alert(`Błąd: ${data.message || "Nie udało się utworzyć reklamy"}`);
      }
    } catch (error) {
      console.error("Error creating ad:", error);
      alert("Błąd tworzenia reklamy");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dodaj reklamę sponsorowaną
        </h1>
        <p className="text-gray-600">
          Wyświetlaj swoją reklamę w odpowiedziach AI Concierge, gdy użytkownicy
          szukają usług związanych z Twoją ofertą.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Dane firmy */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Dane firmy</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nazwa firmy *
              </label>
              <input
                type="text"
                required
                value={formData.advertiser.companyName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    advertiser: {
                      ...formData.advertiser,
                      companyName: e.target.value,
                    },
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.advertiser.email}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    advertiser: {
                      ...formData.advertiser,
                      email: e.target.value,
                    },
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefon
              </label>
              <input
                type="tel"
                value={formData.advertiser.phone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    advertiser: {
                      ...formData.advertiser,
                      phone: e.target.value,
                    },
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Strona WWW
              </label>
              <input
                type="url"
                value={formData.advertiser.website}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    advertiser: {
                      ...formData.advertiser,
                      website: e.target.value,
                    },
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                NIP
              </label>
              <input
                type="text"
                value={formData.advertiser.nip}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    advertiser: {
                      ...formData.advertiser,
                      nip: e.target.value,
                    },
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Miasto
              </label>
              <input
                type="text"
                value={formData.advertiser.address.city}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    advertiser: {
                      ...formData.advertiser,
                      address: {
                        ...formData.advertiser.address,
                        city: e.target.value,
                      },
                    },
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
          </div>
        </div>

        {/* Szczegóły reklamy */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Szczegóły reklamy</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Typ reklamy *
              </label>
              <select
                required
                value={formData.adType}
                onChange={(e) =>
                  setFormData({ ...formData, adType: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="parts_store">Sklep z częściami</option>
                <option value="equipment_rental">Wypożyczalnia sprzętu</option>
                <option value="tool_rental">Wypożyczalnia narzędzi</option>
                <option value="service_provider">Dodatkowe usługi</option>
                <option value="supplier">Dostawca materiałów</option>
                <option value="other">Inne</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tytuł reklamy *
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="np. Sklep z częściami AGD - Warszawa"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Opis reklamy *
              </label>
              <textarea
                required
                maxLength={500}
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="Krótki opis Twojej oferty..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Słowa kluczowe (oddzielone przecinkami)
              </label>
              <input
                type="text"
                value={formData.keywords}
                onChange={(e) =>
                  setFormData({ ...formData, keywords: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="np. pralka, AGD, części, naprawa"
              />
              <p className="text-xs text-gray-500 mt-1">
                Kiedy użytkownik użyje tych słów, Twoja reklama może się
                pojawić
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kategorie usług (oddzielone przecinkami)
              </label>
              <input
                type="text"
                value={formData.serviceCategories}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    serviceCategories: e.target.value,
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="np. hydraulik, elektryk, AGD"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link do strony *
              </label>
              <input
                type="url"
                required
                value={formData.link}
                onChange={(e) =>
                  setFormData({ ...formData, link: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="https://twoja-strona.pl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tekst przycisku
              </label>
              <input
                type="text"
                value={formData.ctaText}
                onChange={(e) =>
                  setFormData({ ...formData, ctaText: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="Sprawdź ofertę"
              />
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Typ reklamy
                </label>
                <select
                  value={formData.mediaType || 'image'}
                  onChange={(e) => setFormData({ ...formData, mediaType: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                >
                  <option value="image">Obraz statyczny (JPG, PNG, WebP)</option>
                  <option value="gif">Obraz animowany (GIF)</option>
                  <option value="video">Wideo (MP4, WebM)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.mediaType === 'gif' && 'GIF animowany będzie się odtwarzał automatycznie'}
                  {formData.mediaType === 'video' && 'Wideo będzie się odtwarzać w pętli (autoplay, loop, muted)'}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.mediaType === 'video' ? 'Wideo reklamy' : 'Obraz reklamy'} *
                  </label>
                  <input
                    type="file"
                    id="image"
                    accept={formData.mediaType === 'video' ? 'video/*' : 'image/*'}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maksymalny rozmiar: 20MB
                    {formData.mediaType === 'gif' && ' • GIF animowany jest obsługiwany'}
                    {formData.mediaType === 'video' && ' • Format: MP4, WebM, OGG'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logo firmy
                  </label>
                  <input
                    type="file"
                    id="logo"
                    accept="image/*"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Opcjonalnie - logo wyświetlane obok reklamy
                  </p>
                </div>
              </div>
              
              {formData.mediaType === 'video' && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>💡 Wskazówka:</strong> Wideo będzie odtwarzane automatycznie, w pętli, bez dźwięku (zgodnie z najlepszymi praktykami reklam online).
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pakiet reklamowy */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Wybierz pakiet reklamowy</h2>
          
          {/* Banner darmowej próby */}
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="text-3xl">🎁</div>
              <div className="flex-1">
                <h3 className="font-bold text-green-900 mb-1">Wypróbuj za darmo przez 7 dni!</h3>
                <p className="text-sm text-green-700 mb-3">
                  Nowi reklamodawcy otrzymują 7 dni darmowej reklamy z limitem 100 wyświetleń. 
                  Po próbie otrzymasz 20% zniżki na wybrany pakiet!
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      package: 'free_trial',
                      displayLocations: packages.free_trial.displayLocations,
                      campaign: {
                        ...formData.campaign,
                        pricingModel: 'package',
                        budget: '0',
                        monthlyLimit: packages.free_trial.monthlyLimit.toString(),
                      },
                    });
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
                >
                  Wybierz darmową próbę →
                </button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {Object.entries(packages).filter(([key]) => key !== 'free_trial').map(([key, pkg]) => (
              <div
                key={key}
                onClick={() => {
                  setFormData({
                    ...formData,
                    package: key,
                    displayLocations: pkg.displayLocations,
                    campaign: {
                      ...formData.campaign,
                      pricingModel: key === 'custom' ? 'cpc' : 'package',
                      budget: key === 'custom' ? formData.campaign.budget : (pkg.price * 100).toString(),
                      monthlyLimit: pkg.monthlyLimit.toString(),
                    },
                  });
                }}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.package === key
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <div className="font-semibold text-lg mb-1">{pkg.name}</div>
                <div className="text-2xl font-bold text-indigo-600 mb-2">
                  {pkg.price > 0 ? `${pkg.price} zł/mies.` : 'Niestandardowy'}
                </div>
                <div className="text-sm text-gray-600 mb-3">{pkg.description}</div>
                <ul className="text-xs space-y-1 text-gray-700">
                  {pkg.features.slice(0, 3).map((feature, i) => (
                    <li key={i}>✓ {feature}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Wybór pozycji reklamowych (dla custom) */}
          {formData.package === 'custom' && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Wybierz pozycje reklamowe *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: 'landing_page_banner', label: 'Banner główny', price: 500 },
                  { value: 'ai_concierge', label: 'AI Concierge', price: 400 },
                  { value: 'search_results', label: 'Wyszukiwanie', price: 300 },
                  { value: 'order_details', label: 'Szczegóły zlecenia', price: 250 },
                  { value: 'between_items', label: 'Między zleceniami', price: 200 },
                  { value: 'provider_list', label: 'Lista wykonawców', price: 350 },
                  { value: 'my_orders', label: 'Moje zlecenia', price: 150 },
                  { value: 'available_orders', label: 'Dostępne zlecenia', price: 150 },
                ].map((location) => (
                  <label
                    key={location.value}
                    className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-100"
                  >
                    <input
                      type="checkbox"
                      checked={formData.displayLocations.includes(location.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            displayLocations: [...formData.displayLocations, location.value],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            displayLocations: formData.displayLocations.filter(
                              (loc) => loc !== location.value
                            ),
                          });
                        }
                      }}
                      className="rounded"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{location.label}</div>
                      <div className="text-xs text-gray-500">{location.price} zł/mies.</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Kampania */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Kampania reklamowa</h2>
          <div className="space-y-4">
            {formData.package === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budżet kampanii (zł) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.campaign.budget}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      campaign: {
                        ...formData.campaign,
                        budget: e.target.value,
                      },
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
            )}
            {formData.package === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model płatności *
                </label>
                <select
                  required
                  value={formData.campaign.pricingModel}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      campaign: {
                        ...formData.campaign,
                        pricingModel: e.target.value,
                      },
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                >
                  <option value="cpc">CPC - Płatność za kliknięcie</option>
                  <option value="cpm">CPM - Płatność za 1000 wyświetleń</option>
                  <option value="flat">Stała opłata</option>
                </select>
              </div>
            )}
            {formData.package !== 'custom' && (
              <div className={`p-4 rounded-lg ${formData.package === 'free_trial' ? 'bg-green-50 border-2 border-green-200' : 'bg-indigo-50'}`}>
                <div className={`font-semibold mb-2 ${formData.package === 'free_trial' ? 'text-green-900' : 'text-indigo-900'}`}>
                  Pakiet: {packages[formData.package].name}
                  {formData.package === 'free_trial' && <span className="ml-2 text-green-600">🎁 DARMOWA PRÓBA</span>}
                </div>
                {formData.package === 'free_trial' ? (
                  <div className="text-sm text-green-700 space-y-1">
                    <div><strong>7 dni za darmo</strong> - bez zobowiązań!</div>
                    <div>Limit: <strong>100 wyświetleń</strong> (tylko banner na stronie głównej)</div>
                    <div className="mt-2 text-xs text-green-600">Po próbie otrzymasz 20% zniżki na wybrany pakiet!</div>
                  </div>
                ) : (
                  <>
                    {/* Wybór długości subskrypcji */}
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Okres subskrypcji:
                      </label>
                      <div className="flex gap-2">
                        {[1, 3, 6, 12].map(months => {
                          const discount = packages[formData.package]?.discounts?.[months] || 0;
                          const monthlyPrice = packages[formData.package].price;
                          const totalPrice = monthlyPrice * months;
                          const discountAmount = totalPrice * discount;
                          const finalPrice = totalPrice - discountAmount;
                          
                          return (
                            <button
                              key={months}
                              type="button"
                              onClick={() => setFormData({ ...formData, subscriptionMonths: months })}
                              className={`flex-1 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                                formData.subscriptionMonths === months
                                  ? 'border-indigo-600 bg-indigo-100 text-indigo-900'
                                  : 'border-gray-300 bg-white text-gray-700 hover:border-indigo-300'
                              }`}
                            >
                              <div className="font-semibold">{months} {months === 1 ? 'miesiąc' : 'miesiące'}</div>
                              {discount > 0 && (
                                <div className="text-xs text-green-600 mt-0.5">
                                  -{Math.round(discount * 100)}% oszczędności
                                </div>
                              )}
                              <div className="text-xs text-gray-600 mt-0.5">
                                {Math.round(finalPrice)} zł
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Podsumowanie ceny */}
                    {(() => {
                      const monthlyPrice = packages[formData.package].price;
                      const discount = packages[formData.package]?.discounts?.[formData.subscriptionMonths] || 0;
                      const totalPrice = monthlyPrice * formData.subscriptionMonths;
                      const discountAmount = totalPrice * discount;
                      const finalPrice = totalPrice - discountAmount;
                      
                      return (
                        <div className="text-sm space-y-1">
                          <div className="text-indigo-700">
                            Cena miesięczna: <strong>{monthlyPrice} zł</strong>
                          </div>
                          <div className="text-indigo-700">
                            Okres: <strong>{formData.subscriptionMonths} {formData.subscriptionMonths === 1 ? 'miesiąc' : 'miesięcy'}</strong>
                          </div>
                          {discount > 0 && (
                            <>
                              <div className="text-gray-600 line-through">
                                Cena bez zniżki: {Math.round(totalPrice)} zł
                              </div>
                              <div className="text-green-600 font-semibold">
                                Zniżka: -{Math.round(discountAmount)} zł ({Math.round(discount * 100)}%)
                              </div>
                              <div className="text-indigo-900 font-bold text-base">
                                Cena końcowa: {Math.round(finalPrice)} zł
                              </div>
                            </>
                          )}
                          {discount === 0 && (
                            <div className="text-indigo-900 font-bold text-base">
                              Cena końcowa: {Math.round(finalPrice)} zł
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            Limit: {packages[formData.package].monthlyLimit.toLocaleString()} wyświetleń/miesiąc
                          </div>
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            )}
            {formData.campaign.pricingModel === "cpc" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cena za kliknięcie (zł)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.campaign.pricePerClick}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      campaign: {
                        ...formData.campaign,
                        pricePerClick: e.target.value,
                      },
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
            )}
            {formData.campaign.pricingModel === "cpm" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cena za 1000 wyświetleń (zł)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.campaign.pricePerImpression}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      campaign: {
                        ...formData.campaign,
                        pricePerImpression: e.target.value,
                      },
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data rozpoczęcia *
                </label>
                <input
                  type="date"
                  required
                  value={formData.campaign.startDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      campaign: {
                        ...formData.campaign,
                        startDate: e.target.value,
                      },
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data zakończenia *
                </label>
                <input
                  type="date"
                  required
                  value={formData.campaign.endDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      campaign: {
                        ...formData.campaign,
                        endDate: e.target.value,
                      },
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Informacja */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Ważne:</strong> Po utworzeniu reklamy, administrator
            przejrzy ją i zatwierdzi. Otrzymasz email z informacją o statusie
            reklamy. Reklama pojawi się w systemie dopiero po akceptacji.
          </p>
        </div>

        {/* Przyciski */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Anuluj
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Tworzenie..." : "Utwórz reklamę"}
          </button>
        </div>
      </form>
    </div>
  );
}

