/**
 * Kiedyś: blokada przewijania tła przy otwartej szufladzie filtrów (overflow / position na body).
 * Wyłączone — powodowało utratę przewijania kółkiem (m.in. overflow:hidden na html, position:fixed + HMR).
 * Szuflady mają własny scroll (overflow-y-auto); lekkie przewinięcie tła na mobile jest akceptowalne.
 */
export default function useBodyScrollLock() {
  // intentionally empty — call sites zostają dla czytelności (SearchPage, ProvidersPage)
}
