import { apiUrl } from '@/lib/apiUrl';

const TARGET_MAX_BYTES = 2 * 1024 * 1024;
const HARD_MAX_BYTES = 10 * 1024 * 1024;
const MAX_DIMENSION = 2048;

export const DOC_LABELS = {
  idFront: 'Dowód – przód',
  idBack: 'Dowód – tył',
  selfie: 'Selfie z dokumentem',
  companyDoc: 'Dokument firmy',
};

function isImageFile(file) {
  return /^image\/(jpeg|jpg|png|webp)$/i.test(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name);
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let w = img.width;
      let h = img.height;
      const scale = Math.min(1, MAX_DIMENSION / Math.max(w, h));
      w = Math.round(w * scale);
      h = Math.round(h * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);

      const attempt = (quality, onDone) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) return onDone(null);
            if (blob.size <= TARGET_MAX_BYTES || quality <= 0.55) {
              onDone(blob);
            } else {
              attempt(Math.max(0.55, quality - 0.1), onDone);
            }
          },
          'image/jpeg',
          quality
        );
      };

      attempt(0.88, (blob) => {
        if (!blob) return reject(new Error('Nie udało się skompresować obrazu'));
        const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
        resolve(new File([blob], name, { type: 'image/jpeg' }));
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Nie udało się wczytać obrazu'));
    };
    img.src = url;
  });
}

/** Zmniejsza duże zdjęcia z telefonu przed wysłaniem (limit proxy ~4–5 MB na żądanie). */
export async function prepareKycFile(file) {
  if (!file) return null;
  if (file.size > HARD_MAX_BYTES) {
    throw new Error(`Plik „${file.name}” jest za duży (max 10 MB). Zrób mniejsze zdjęcie.`);
  }
  if (!isImageFile(file)) return file;
  if (file.size <= TARGET_MAX_BYTES) return file;
  return compressImage(file);
}

async function uploadOneField(token, field, file) {
  const fd = new FormData();
  fd.append(field, file);
  let res;
  try {
    res = await fetch(apiUrl('/api/kyc/upload'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
  } catch {
    throw new Error(
      'Błąd połączenia przy wysyłce pliku. Spróbuj ponownie — zdjęcia są automatycznie zmniejszane przed wysłaniem.'
    );
  }

  let data = {};
  try {
    data = await res.json();
  } catch {
    if (res.status === 413) {
      throw new Error(
        `Plik „${DOC_LABELS[field] || field}” jest za duży dla serwera. Użyj mniejszego zdjęcia (np. zrzut ekranu zamiast oryginału z aparatu).`
      );
    }
    throw new Error(`Błąd uploadu (${res.status})`);
  }

  if (!res.ok) {
    throw new Error(data.message || `Błąd uploadu: ${DOC_LABELS[field] || field}`);
  }
  return data;
}

/** Wysyła każdy dokument osobno (mniejsze żądania, mniejsze ryzyko 413). */
export async function uploadKycDocuments({ token, files, companyType }) {
  const entries = [
    ['idFront', files.idFront],
    ['idBack', files.idBack],
    ['selfie', files.selfie],
    ...(companyType === 'company' ? [['companyDoc', files.companyDoc]] : []),
  ].filter(([, f]) => f);

  let last;
  for (const [field, raw] of entries) {
    const prepared = await prepareKycFile(raw);
    last = await uploadOneField(token, field, prepared);
  }
  return last;
}
