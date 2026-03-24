import React, { useState } from "react";
import { Check, X } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

export default function PricingTable({ plans = [], onSelect, currentSubscription = null, onStartTrial = null }) {
	const [requestInvoice, setRequestInvoice] = useState(false);
	// Sortuj plany po cenie (FREE -> STANDARD -> PRO)
	const sortedPlans = [...plans].sort((a, b) => (a.priceMonthly || 0) - (b.priceMonthly || 0));

	// Określ typ audiencji na podstawie pierwszego planu
	const getAudienceType = () => {
		if (sortedPlans.length === 0) return 'client';
		const firstKey = sortedPlans[0].key || '';
		if (firstKey.startsWith('BUSINESS_')) return 'business';
		if (firstKey.startsWith('PROV_')) return 'provider';
		return 'client';
	};

	const audienceType = getAudienceType();

	// Kompletna lista funkcji dla każdego typu (jedna linia na funkcję)
	const getAllFeatures = () => {
		if (audienceType === 'client') {
			return [
				'Podstawowy dostęp',
				'Asystent AI',
				'AI Camera Assistant',
				'Pilne zlecenia bezpłatne',
				'Darmowe boosty ofert',
				'Priorytet do top wykonawców',
				'Zniżka na wyróżnionych',
				'Opłata platformowa'
			];
		} else if (audienceType === 'provider') {
			return [
				'Odpowiedzi na zlecenia',
				'Asystent AI',
				'Profil',
				'Statystyki',
				'Priorytet w wynikach',
				'Badge Helpfli PRO',
				'Raporty PDF',
				'Opłata platformowa'
			];
		} else { // business
			return [
				'Odpowiedzi na zlecenia (wspólna pula)',
				'Asystent AI (wspólna pula)',
				'Pilne zlecenia bezpłatne',
				'Podbicie ofert bezpłatne',
				'Zarądzanie zespołem',
				'Portfel firmowy i faktury',
				'Automatyzacja workflow',
				'Role i uprawnienia',
				'Audit log',
				'Analityka zespołu',
				'Zaawansowane statystyki i analityka',
				'Priorytet w wynikach wyszukiwania',
				'Analityka wydajności zespołu',
				'Raporty i eksport danych',
				'API access dla integracji',
				'White-label opcje',
				'Dedicated support 24/7',
				'Custom integrations',
				'Opłata platformowa'
			];
		}
	};

	// Pobierz wartość funkcji dla danego planu (np. "10/mies", "50/mies", "nielimitowane")
	const getFeatureValue = (plan, feature) => {
		const perks = plan.perks || plan.benefits || [];
		const perksText = perks.join(' ').toLowerCase();
		const planKey = (plan.key || '').toUpperCase();
		const featureLower = feature.toLowerCase();
		
		// Odpowiedzi na zlecenia (provider)
		if (featureLower.includes('odpowiedzi na zlecenia') && audienceType === 'provider') {
			if (perksText.includes('odpowiedzi: nielimitowane') || (perksText.includes('nielimitowane') && perksText.includes('odpowiedzi'))) {
				return 'Nielimitowane';
			}
			if (perksText.includes('odpowiedzi: 100')) {
				return '100/mies.';
			}
			if (perksText.includes('odpowiedzi: 50')) {
				return '50/mies.';
			}
			if (perksText.includes('odpowiedzi: 10')) {
				return '10/mies.';
			}
			return null;
		}
		
		// Odpowiedzi na zlecenia (business)
		if (featureLower.includes('odpowiedzi na zlecenia') && audienceType === 'business') {
			if (perksText.includes('odpowiedzi: nielimitowane') || (perksText.includes('nielimitowane') && perksText.includes('odpowiedzi'))) {
				return 'Nielimitowane';
			}
			if (perksText.includes('odpowiedzi: 200')) {
				return '200/mies.';
			}
			if (perksText.includes('odpowiedzi: 20')) {
				return '20/mies.';
			}
			return null;
		}
		
		// Asystent AI (provider)
		if (featureLower.includes('ai chat') && audienceType === 'provider') {
			if (planKey === 'PROV_STD' || planKey === 'PROV_STD_PLUS' || planKey === 'PROV_PRO') {
				return 'Nielimitowane';
			}
			if (planKey === 'PROV_FREE') {
				return '20 zapytań/mies.';
			}
			return null;
		}
		
		// Asystent AI (client)
		if ((featureLower.includes('ai concierge') || featureLower.includes('asystent ai')) && audienceType === 'client') {
			if (perksText.includes('ai nielimit') || perksText.includes('nielimitowane')) {
				return 'Nielimitowane';
			}
			if (perksText.includes('50 zapytań')) {
				return '50 zapytań/mies.';
			}
			return null;
		}
		
		// Asystent AI (business)
		if ((featureLower.includes('ai concierge') || featureLower.includes('asystent ai')) && audienceType === 'business') {
			if (
				perksText.includes('ai concierge: nielimitowane') ||
				perksText.includes('asystent ai: nielimitowane') ||
				(perksText.includes('nielimitowane') && (perksText.includes('ai concierge') || perksText.includes('asystent ai')))
			) {
				return 'Nielimitowane';
			}
			if (perksText.includes('ai concierge: 1000') || perksText.includes('asystent ai: 1000')) {
				return '1000 zapytań/mies.';
			}
			if (perksText.includes('ai concierge: 100') || perksText.includes('asystent ai: 100')) {
				return '100 zapytań/mies.';
			}
			return null;
		}
		
		// AI Camera Assistant
		if (featureLower.includes('ai camera assistant')) {
			if (perksText.includes('wszystkie funkcje')) {
				return 'Wszystkie funkcje';
			}
			if (perksText.includes('streaming') || perksText.includes('ar')) {
				return 'Streaming, AR';
			}
			// Dla FREE - podstawowy AI Camera Assistant
			if (perksText.includes('ai camera assistant') || planKey === 'CLIENT_FREE') {
				return 'Podstawowy';
			}
			return null;
		}
		
		// Darmowe boosty ofert
		if (featureLower.includes('darmowe boosty ofert') || featureLower.includes('podbicie ofert bezpłatne')) {
			// Sprawdź czy plan ma freeBoostsPerMonth
			if (plan.freeBoostsPerMonth && plan.freeBoostsPerMonth > 0) {
				return `${plan.freeBoostsPerMonth}/mies.`;
			}
			// Fallback do perks
			if (perksText.includes('darmowe boosty') || perksText.includes('podbicie ofert bezpłatne')) {
				// Wyciągnij liczbę z perks jeśli jest
				const match = perksText.match(/(\d+)\s*darmowe\s*boosty/i);
				if (match) {
					return `${match[1]}/mies.`;
				}
				return 'Tak';
			}
			return null;
		}
		
		// Priorytet do top wykonawców (client)
		if (featureLower.includes('priorytet do top wykonawców')) {
			if (perksText.includes('priorytet') && perksText.includes('top wykonawców')) {
				return 'Tak';
			}
			return null;
		}
		
		// Profil
		if (featureLower.includes('profil')) {
			// PRO i STD_PLUS mają automatycznie profil rozszerzony
			if (planKey === 'PROV_PRO' || planKey === 'PROV_STD_PLUS') {
				return 'Rozszerzony';
			}
			if (perksText.includes('profil rozszerzony')) {
				return 'Rozszerzony';
			}
			if (perksText.includes('profil podstawowy')) {
				return 'Podstawowy';
			}
			return null;
		}
		
		// Statystyki
		if (featureLower.includes('statystyki') && !featureLower.includes('zaawansowane statystyki i analityka')) {
			if (perksText.includes('zaawansowane statystyki') || planKey === 'PROV_PRO') {
				return 'Zaawansowane';
			}
			if (perksText.includes('statystyki zaawansowane') || planKey === 'PROV_STD_PLUS') {
				return 'Zaawansowane';
			}
			if (perksText.includes('statystyki')) {
				return 'Podstawowe';
			}
			return null;
		}
		
		// Zarządzanie zespołem
		if (featureLower.includes('zarądzanie zespołem')) {
			if (perksText.includes('do 20 użytkowników')) {
				return 'Do 20 użytkowników';
			}
			if (perksText.includes('do 10 użytkowników')) {
				return 'Do 10 użytkowników';
			}
			if (perksText.includes('do 3 użytkowników')) {
				return 'Do 3 użytkowników';
			}
			return null;
		}
		
		// Opłata platformowa (Platform fee) - zawsze pokazuj wartość
		if (featureLower.includes('opłata platformowa') || featureLower.includes('platform fee')) {
			// Sprawdź planKey jako główne źródło (zawsze dostępne)
			if (planKey === 'PROV_PRO' || planKey === 'CLIENT_PRO' || planKey === 'BUSINESS_PRO') {
				return '0%';
			}
			if (planKey === 'PROV_STD_PLUS') {
				return '7%';
			}
			if (planKey === 'PROV_STD' || planKey === 'CLIENT_STD' || planKey === 'BUSINESS_STANDARD') {
				return '8%';
			}
			// Sprawdź perks jako fallback
			if (perksText.includes('5%') || perksText.includes('najniższe platform fee')) {
				return '0%';
			}
			if (perksText.includes('7%')) {
				return '7%';
			}
			if (perksText.includes('8%') || perksText.includes('niższe platform fee')) {
				return '8%';
			}
			// Domyślnie 15% dla FREE i wszystkich innych
			return '15%';
		}
		
		// Zniżka na wyróżnionych
		if (featureLower.includes('zniżka na wyróżnionych')) {
			// PRO: wyróżnienia/boosty za darmo (lepsze niż zniżka procentowa)
			if (
				planKey === 'CLIENT_PRO' || 
				planKey === 'BUSINESS_PRO' || 
				perksText.includes('podbicie ofert bezpłatne') || 
				perksText.includes('darmowe boosty')
			) {
				return 'Za darmo';
			}
			if (perksText.includes('-15%') || perksText.includes('15%')) {
				return '-15%';
			}
			if (perksText.includes('-10%') || perksText.includes('10%')) {
				return '-10%';
			}
			return null;
		}
		
		// Dla pozostałych funkcji - sprawdź czy są dostępne
		const featureKeywords = {
			'podstawowy dostęp': ['podstawowy dostęp', 'dostęp'],
			'pilne zlecenia bezpłatne': ['pilne zlecenia', 'pilne'],
			'darmowe boosty ofert': ['darmowe boosty', 'podbicie ofert bezpłatne', 'podbicie'],
			'podbicie ofert bezpłatne': ['darmowe boosty', 'podbicie ofert bezpłatne', 'podbicie'],
			'priorytet do top wykonawców': ['priorytet', 'top wykonawców'],
			'priorytet w wynikach': ['priorytet w wynikach', 'priorytet'],
			'priorytet w wynikach wyszukiwania': ['priorytet w wynikach', 'priorytet'],
			'badge helpfli pro': ['badge helpfli pro', 'badge'],
			'raporty pdf': ['raporty pdf', 'raporty'],
			'portfel firmowy i faktury': ['portfel firmowy', 'faktury'],
			'automatyzacja workflow': ['automatyzacja workflow', 'workflow'],
			'role i uprawnienia': ['role i uprawnienia', 'role'],
			'audit log': ['audit log'],
			'analityka zespołu': ['analityka zespołu', 'analityka'],
			'zaawansowane statystyki i analityka': ['zaawansowane statystyki', 'analityka'],
			'analityka wydajności zespołu': ['analityka wydajności', 'zespołu'],
			'raporty i eksport danych': ['raporty', 'eksport danych'],
			'api access dla integracji': ['api access', 'api'],
			'white-label opcje': ['white-label', 'white label'],
			'dedicated support 24/7': ['dedicated support', 'support 24/7'],
			'custom integrations': ['custom integrations', 'integrations'],
			'opłata platformowa': ['platform fee', 'opłata platformowa', '15%', '8%', '0%']
		};
		
		const keywords = featureKeywords[featureLower] || [featureLower];
		const hasFeature = keywords.some(keyword => perksText.includes(keyword.toLowerCase()));
		
		if (hasFeature) {
			return 'Tak';
		}
		
		return null;
	};
	
	// Sprawdź czy funkcja jest dostępna w planie
	const hasFeature = (plan, feature) => {
		const value = getFeatureValue(plan, feature);
		return value !== null;
	};

	// Kolory gradientów dla każdego planu
	const getGradientColors = (index) => {
		const gradients = [
			"from-purple-500 to-pink-500",      // FREE
			"from-blue-400 to-cyan-400",        // BASIC/STANDARD
			"from-orange-400 to-red-500",       // PRO
			"from-green-400 to-emerald-600"     // ULTIMATE
		];
		return gradients[index % gradients.length];
	};

	// Sprawdź czy plan to FREE (cena = 0)
	const isFreePlan = (plan) => plan.priceMonthly === 0;

	// Sprawdź czy plan to PRO (nazwa zawiera "PRO")
	const isProPlan = (plan) => {
		const name = (plan.name || plan.title || "").toUpperCase();
		const key = (plan.key || "").toUpperCase();
		return name.includes("PRO") || key.includes("_PRO");
	};

	// Sprawdź czy plan jest aktualnie aktywny
	const isCurrentPlan = (plan) => {
		if (!currentSubscription) return false;
		return currentSubscription.planKey === plan.key;
	};

	const allFeatures = getAllFeatures();
	
	// Funkcja zwracająca funkcje do wyświetlenia dla danego planu
	const getFeaturesForPlan = (plan, planIndex) => {
		const features = [];
		const freePlan = sortedPlans[0];
		const standardPlan = sortedPlans.length > 1 ? sortedPlans[1] : null;
		const proPlan = sortedPlans.length > 2 ? sortedPlans[2] : null;
		
		// FREE: pokaż tylko funkcje dostępne w FREE (podstawowe, z limitami)
		if (planIndex === 0) {
			for (const feature of allFeatures) {
				const hasInThisPlan = hasFeature(plan, feature);
				if (hasInThisPlan) {
					const value = getFeatureValue(plan, feature);
					features.push({ 
						feature, 
						available: true, 
						missingFrom: null, 
						value,
						isBasic: true // Oznacz jako podstawowe
					});
				}
			}
		}
		// STANDARD: pokaż TYLKO funkcje które są lepsze niż w FREE lub których nie ma w FREE
		else if (planIndex === 1) {
			for (const feature of allFeatures) {
				const hasInFree = hasFeature(freePlan, feature);
				const hasInThisPlan = hasFeature(plan, feature);
				
				if (hasInThisPlan) {
					const value = getFeatureValue(plan, feature);
					const freeValue = hasInFree ? getFeatureValue(freePlan, feature) : null;
					
					// Sprawdź czy STANDARD ma więcej niż FREE
					let hasMoreThanFree = false;
					if (!hasInFree) {
						// STANDARD ma funkcję której nie ma FREE
						hasMoreThanFree = true;
					} else if (value && freeValue) {
						// Porównaj wartości
						const valueLower = value.toLowerCase();
						const freeValueLower = freeValue.toLowerCase();
						
						if (valueLower.includes('nielimitowane') && !freeValueLower.includes('nielimitowane')) {
							hasMoreThanFree = true;
						} else if (valueLower.includes('rozszerzony') && freeValueLower.includes('podstawowy')) {
							hasMoreThanFree = true;
						} else if (valueLower.includes('zaawansowane') && freeValueLower.includes('podstawowe')) {
							hasMoreThanFree = true;
						} else if (valueLower.includes('wszystkie funkcje') && !freeValueLower.includes('wszystkie funkcje')) {
							hasMoreThanFree = true;
						} else if (valueLower.includes('streaming') && !freeValueLower.includes('streaming')) {
							hasMoreThanFree = true;
						} else {
							// Spróbuj wyciągnąć liczby
							const valueNum = parseInt(value);
							const freeNum = parseInt(freeValue);
							if (!isNaN(valueNum) && !isNaN(freeNum) && valueNum > freeNum) {
								hasMoreThanFree = true;
							} else if (value !== freeValue && !valueLower.includes('podstawowy') && !valueLower.includes('podstawowe')) {
								// Jeśli wartości są różne i STANDARD nie ma "podstawowy"
								hasMoreThanFree = true;
							}
						}
					}
					
					// Pokaż tylko jeśli ma więcej niż FREE
					if (hasMoreThanFree) {
						features.push({ 
							feature, 
							available: true, 
							missingFrom: null,
							value,
							hasMoreThanFree: true
						});
					}
				}
			}
		}
		// PRO: pokaż TYLKO funkcje które są lepsze niż w STANDARD lub których nie ma w STANDARD
		else if (planIndex >= 2) {
			for (const feature of allFeatures) {
				const hasInStandard = standardPlan ? hasFeature(standardPlan, feature) : false;
				const hasInThisPlan = hasFeature(plan, feature);
				
				if (hasInThisPlan) {
					const value = getFeatureValue(plan, feature);
					const standardValue = hasInStandard ? getFeatureValue(standardPlan, feature) : null;
					
					// Sprawdź czy PRO ma więcej niż STANDARD
					let hasMoreThanStandard = false;
					if (!hasInStandard) {
						// PRO ma funkcję której nie ma STANDARD
						hasMoreThanStandard = true;
					} else if (value && standardValue) {
						// Porównaj wartości
						const valueLower = value.toLowerCase();
						const standardValueLower = standardValue.toLowerCase();
						
						if (valueLower.includes('nielimitowane') && !standardValueLower.includes('nielimitowane')) {
							hasMoreThanStandard = true;
						} else if (valueLower.includes('wszystkie funkcje') && !standardValueLower.includes('wszystkie funkcje')) {
							hasMoreThanStandard = true;
						} else if (valueLower.includes('zaawansowane') && standardValueLower.includes('podstawowe')) {
							hasMoreThanStandard = true;
						} else {
							// Spróbuj wyciągnąć liczby
							const valueNum = parseInt(value);
							const standardNum = parseInt(standardValue);
							if (!isNaN(valueNum) && !isNaN(standardNum) && valueNum > standardNum) {
								hasMoreThanStandard = true;
							} else if (value !== standardValue && !valueLower.includes('podstawowy') && !valueLower.includes('podstawowe')) {
								// Jeśli wartości są różne
								hasMoreThanStandard = true;
							}
						}
					}
					
					// Pokaż tylko jeśli ma więcej niż STANDARD
					if (hasMoreThanStandard) {
						const isUnlimited = value && (value.toLowerCase().includes('nielimitowane') || value.toLowerCase().includes('unlimited'));
						features.push({ 
							feature, 
							available: true, 
							missingFrom: null, 
							value,
							isUnlimited: isUnlimited,
							isPro: true // Oznacz jako PRO
						});
					}
				}
			}
		}
		
		return features;
	};

	return (
		<div className="space-y-16">
			<ScrollReveal direction="up" delay={0}>
				<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
				{sortedPlans.map((p, index) => {
				const isStandard = index === 1 && sortedPlans.length > 1;
				const isPro = index >= 2;
				const freePlan = sortedPlans[0];
				const standardPlan = sortedPlans.length > 1 ? sortedPlans[1] : null;
				
				return (
				<div 
					key={p.key || p.code} 
					className={`relative rounded-2xl shadow-lg p-8 border-2 bg-white hover:shadow-xl transition-all duration-300 flex flex-col ${
						isCurrentPlan(p) ? 'ring-4 ring-green-400 ring-opacity-70 bg-green-50' : 
						isStandard ? 'border-blue-500' :
						isPro ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-orange-100/50' : 
						'border-gray-200'
					}`}
				>
					{/* Badge dla STANDARD i PRO */}
					{isStandard && (
						<div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-lg flex items-center gap-1">
							<span>⬆️</span> Najpopularniejszy
						</div>
					)}
					{isPro && (
						<div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-lg flex items-center gap-1">
							<span>⭐</span> Wszystko bez limitów
						</div>
					)}
					{isCurrentPlan(p) && (
						<div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium z-10">
							AKTYWNY
						</div>
					)}
					
					{/* Tytuł i opis planu */}
					<div className="mb-6">
						<h3 className="text-2xl font-bold text-gray-900 mb-2">
							{p.name || p.title}
						</h3>
						<p className="text-sm text-gray-500">
							{index === 0 ? 'Idealny na start' : 
							 index === 1 ? 'Dla rozwijających się' : 
							 'Maksymalna moc'}
						</p>
					</div>
					
					{/* Cena */}
					<div className="mb-6">
						<div className="flex items-baseline gap-2">
							<span className="text-5xl font-bold text-gray-900">
								{p.priceMonthly === 0 ? "0" : p.priceMonthly}
							</span>
							<span className="text-2xl font-semibold text-gray-500">zł</span>
						</div>
						<p className="text-sm text-gray-500 mt-1">
							{p.priceMonthly === 0 ? 'na zawsze' : 'miesięcznie'}
						</p>
					</div>
					
					{/* Przycisk */}
					<div className="mb-6">
						{isFreePlan(p) ? (
							<button 
								onClick={() => onSelect(p)} 
								className="w-full border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
							>
								Rozpocznij za darmo
							</button>
						) : isCurrentPlan(p) ? (
							<div className="w-full bg-green-500 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2">
								<Check className="w-4 h-4" />
								AKTYWNY
							</div>
						) : (
							<div className="space-y-2">
								<label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
									<input
										type="checkbox"
										checked={requestInvoice}
										onChange={(e) => setRequestInvoice(e.target.checked)}
										className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
									/>
									<span>Chcę fakturę VAT</span>
								</label>
								{isProPlan(p) && onStartTrial && !currentSubscription?.isTrial && (
									<button 
										onClick={() => onStartTrial(p.key)} 
										className={`w-full text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 ${
											isPro ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'
										}`}
									>
										Rozpocznij {isPro ? '7-dniowy' : '14-dniowy'} trial
									</button>
								)}
								<button 
									onClick={() => onSelect(p, requestInvoice)} 
									className={`w-full text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 ${
										isPro ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'
									}`}
								>
									Kup teraz
								</button>
							</div>
						)}
					</div>

					{/* Funkcjonalności */}
					<div className="pt-6 border-t space-y-4">
						{/* Nagłówek sekcji */}
						<p className="font-semibold text-sm text-gray-500 uppercase tracking-wide">
							{index === 0 ? 'Podstawowe funkcje' :
							 index === 1 ? 'Wszystko z Free, plus:' :
							 'Wszystko z Standard, plus:'}
						</p>
						
						<ul className="space-y-3">
							{getFeaturesForPlan(p, index).map((item, i) => {
								const { feature, available, missingFrom, value, hasMoreThanFree, isUnlimited, isPro, isBasic } = item;
								
								return (
									<li key={i} className="flex items-start gap-3">
										<div className="mt-0.5 flex-shrink-0">
											{available ? (
												<div className={`w-5 h-5 rounded-full flex items-center justify-center ${
													isPro ? 'bg-orange-100' : 
													hasMoreThanFree ? 'bg-blue-100' : 
													'bg-green-100'
												}`}>
													<Check className={`w-3 h-3 ${
														isPro ? 'text-orange-600' : 
														hasMoreThanFree ? 'text-blue-600' : 
														'text-green-600'
													}`} />
												</div>
											) : (
												<div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
													<X className="w-3 h-3 text-red-600" />
												</div>
											)}
										</div>
										<span className={`text-sm flex-1 ${
											available 
												? isPro || isUnlimited
													? 'font-semibold text-gray-900' 
													: 'text-gray-700'
												: 'text-gray-500'
										}`}>
											{feature}{value ? `: ${value}` : ''}
											{isUnlimited && (
												<span className="ml-2 text-orange-600 font-bold">
													(bez limitów)
												</span>
											)}
										</span>
									</li>
								);
							})}
						</ul>
					</div>
				</div>
				);
			})}
				</div>
			</ScrollReveal>
		
		{/* Szczegółowe porównanie funkcji */}
		<ScrollReveal direction="up" delay={200}>
			<div className="mt-16 max-w-7xl mx-auto">
			<div className="text-center mb-12">
				<h2 className="text-3xl font-bold mb-4">Szczegółowe porównanie funkcji</h2>
				<p className="text-gray-600">Zobacz wszystkie funkcje dostępne w każdym planie</p>
			</div>

			<div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead>
							<tr className="border-b bg-gray-50">
								<th className="text-left p-4 font-semibold text-gray-900">Funkcja</th>
								{sortedPlans.map((p, idx) => (
									<th 
										key={p.key || p.code} 
										className={`text-center p-4 font-semibold ${
											idx === 0 ? 'text-gray-900' :
											idx === 1 ? 'bg-blue-50 text-blue-900' :
											'bg-orange-50 text-orange-900'
										}`}
									>
										{p.name || p.title}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{allFeatures.map((feature, index) => (
								<tr 
									key={index} 
									className={`border-b last:border-b-0 hover:bg-gray-50 transition-colors ${
										index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
									}`}
								>
									<td className="p-4 text-sm font-medium text-gray-900">{feature}</td>
									{sortedPlans.map((p, planIdx) => {
										const value = getFeatureValue(p, feature);
										const hasFeatureInPlan = value !== null;
										return (
											<td 
												key={p.key || p.code} 
												className={`p-4 text-center text-sm ${
													planIdx === 1 ? 'bg-blue-50/50' :
													planIdx >= 2 ? 'bg-orange-50/50' : ''
												}`}
											>
												{hasFeatureInPlan ? (
													value === false ? (
														<X className="w-5 h-5 text-red-500 mx-auto" />
													) : value === true ? (
														<Check className="w-5 h-5 text-green-600 mx-auto" />
													) : (
														<span className={`${
															planIdx >= 2 ? 'font-semibold text-orange-600' :
															planIdx === 1 ? 'font-medium text-blue-700' :
															'text-gray-700'
														}`}>
															{value}
														</span>
													)
												) : (
													<X className="w-5 h-5 text-red-500 mx-auto" />
												)}
											</td>
										);
									})}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
			</div>
		</ScrollReveal>

		{/* CTA Section */}
		<ScrollReveal direction="up" delay={400}>
			<div className="mt-16 max-w-4xl mx-auto">
			<div className="bg-gradient-to-r from-blue-50 to-orange-50 dark:from-blue-950/20 dark:to-orange-950/20 border-2 border-gray-200 rounded-2xl p-12 text-center">
				<h2 className="text-3xl font-bold mb-4 text-gray-900">
					Nie jesteś pewien którego planu potrzebujesz?
				</h2>
				<p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
					Skontaktuj się z naszym zespołem, aby omówić Twoje potrzeby i znaleźć najlepsze rozwiązanie dla Twojego biznesu.
				</p>
				<button 
					onClick={() => window.location.href = '/contact'}
					className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-xl transition-colors duration-200"
				>
					Skontaktuj się z nami
				</button>
			</div>
			</div>
		</ScrollReveal>
	</div>
	);
}
