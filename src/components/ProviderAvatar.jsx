import { useEffect, useState } from "react";
import { getNameInitials, resolveProviderPhotoUrl } from "../utils/providerAvatar";

/**
 * Zdjęcie profilowe lub inicjały (np. AK), gdy brak pliku / błąd ładowania / placeholder z API.
 */
export default function ProviderAvatar({
  name,
  photoUrl,
  className = "",
  fallbackTextClassName = "text-sm",
  style,
}) {
  const resolved = resolveProviderPhotoUrl(photoUrl);
  const [broken, setBroken] = useState(false);
  const initials = getNameInitials(name || "?");
  const showImg = Boolean(resolved && !broken);

  useEffect(() => {
    setBroken(false);
  }, [photoUrl]);

  if (!showImg) {
    return (
      <div
        className={`flex items-center justify-center shrink-0 rounded-full font-semibold text-white bg-indigo-600 ${className}`}
        style={style}
        aria-hidden
      >
        <span className={`select-none leading-none ${fallbackTextClassName}`}>{initials}</span>
      </div>
    );
  }
  return (
    <img
      src={resolved}
      alt=""
      className={className}
      style={style}
      onError={() => setBroken(true)}
    />
  );
}
