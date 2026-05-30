import { FileText } from 'lucide-react';
import { isPlatformInvoicingEnabled } from '../utils/platformInvoicing';

/**
 * Checkbox „Chcę fakturę VAT” przy płatnościach na rzecz Helpfli (subskrypcje, boosty).
 * Gdy fakturowanie platformy wyłączone — wyszarzone z komunikatem.
 */
export default function PlatformInvoiceCheckbox({ checked, onChange, className = '' }) {
  const enabled = isPlatformInvoicingEnabled();

  if (!enabled) {
    return (
      <label
        className={`flex items-start gap-2 text-sm text-gray-400 cursor-not-allowed opacity-70 ${className}`}
        title="Faktury VAT od Helpfli będą dostępne wkrótce"
      >
        <input type="checkbox" disabled checked={false} className="mt-0.5 rounded border-gray-300" />
        <FileText className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
        <span>
          <span className="font-medium">Chcę fakturę VAT</span>
          <span className="block text-xs text-gray-400 mt-0.5">
            Wkrótce — po uruchomieniu fakturowania Helpfli (obecnie niedostępne).
          </span>
        </span>
      </label>
    );
  }

  return (
    <label className={`flex items-center gap-2 text-sm text-gray-700 cursor-pointer ${className}`}>
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange?.(e.target.checked)}
        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
      />
      <FileText className="w-4 h-4 shrink-0 text-purple-600" aria-hidden />
      <span>Chcę fakturę VAT od Helpfli</span>
    </label>
  );
}
