let isInitialized = false;

export function initOneSignal(user) {
  if (!window.OneSignal || !user || isInitialized) return;
  
  // Sprawdź czy już jest zainicjalizowany
  if (window.OneSignal.initialized) {
    console.log('OneSignal already initialized, just setting user ID');
    window.OneSignal.setExternalUserId(String(user._id || user.id));
    return;
  }
  
  window.OneSignal = window.OneSignal || [];
  window.OneSignal.push(function () {
    // Sprawdź czy mamy prawdziwy App ID
    const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;
    if (!appId || appId === "demo-app-id") {
      console.log('OneSignal: Brak konfiguracji App ID, pomijam inicjalizację');
      return;
    }
    
    window.OneSignal.init({ 
      appId: appId
    });
    
    // powiąż subskrypcję z Twoim userId w bazie
    window.OneSignal.setExternalUserId(String(user._id || user.id));
    
    // proponuj subskrypcję po wejściu (tylko jeśli mamy prawdziwy App ID)
    if (appId && appId !== "demo-app-id") {
      window.OneSignal.showSlidedownPrompt();
    }
    
    isInitialized = true;
  });
}
