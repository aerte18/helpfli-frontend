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

    // UWAGA: nie wywołujemy showSlidedownPrompt() przy starcie. Zgoda na
    // powiadomienia idzie przez nasz SoftAskNotifications (permissionManager),
    // który najpierw pyta delikatnie ("po co"), a dopiero potem odpala
    // natywny prompt przeglądarki. Dzięki temu nie marnujemy jedynej szansy
    // na "Allow" w przeglądarce — jeśli user kliknie Block raz, nie da się
    // już zapytać ponownie bez resetu uprawnień ręcznie przez usera.

    isInitialized = true;
  });
}
