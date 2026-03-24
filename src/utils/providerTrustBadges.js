/**
 * Zwraca listę badge'ów zaufania / społecznego dowodu na podstawie metadanych wykonawcy.
 * Używane w listach ofert, podglądzie profilu i profilu wykonawcy.
 *
 * @param {{ ratingAvg?: number; ratingCount?: number; completedOrders?: number }} meta
 * @returns {{ key: string; label: string; title: string }[]}
 */
export function getProviderTrustBadges(meta) {
  if (!meta) return [];
  const avg = Number(meta.ratingAvg);
  const count = Number(meta.ratingCount) || 0;
  const completed = Number(meta.completedOrders) || 0;

  const badges = [];

  // Top oceniany: wysoka średnia i minimum 5 opinii
  if (avg >= 4.5 && count >= 5) {
    badges.push({
      key: 'top_rated',
      label: 'Top oceniany',
      title: 'Wysoka średnia ocen i wiele pozytywnych opinii',
    });
  }

  // Nowy wykonawca: mało opinii (mniej niż 3) – zachęta do pierwszych zleceń
  if (count < 3) {
    badges.push({
      key: 'new_provider',
      label: 'Nowy wykonawca',
      title: 'Niedawno dołączył – możesz być jednym z pierwszych klientów',
    });
  }

  // Doświadczony: dużo ukończonych zleceń i przyzwoita liczba ocen
  if (completed >= 20 && count >= 10) {
    badges.push({
      key: 'experienced',
      label: 'Doświadczony',
      title: 'Wiele ukończonych zleceń i dobrych opinii',
    });
  }

  return badges;
}
