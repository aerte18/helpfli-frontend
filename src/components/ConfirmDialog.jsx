import { useEffect } from 'react';
import { X, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Potwierdź",
  cancelLabel = "Anuluj",
  variant = "danger", // 'danger' | 'warning' | 'info'
  confirmButtonClassName = "",
  loading = false,
  requiresInput = false,
  inputPlaceholder = "",
  inputValue = "",
  onInputChange = () => {},
  inputValidation = null // Function that returns true if valid
}) {
  if (!isOpen) return null;

  const iconConfig = {
    danger: { Icon: AlertTriangle, color: "text-red-600", bg: "bg-red-100" },
    warning: { Icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-100" },
    info: { Icon: Info, color: "text-blue-600", bg: "bg-blue-100" },
  };

  const { Icon, color, bg } = iconConfig[variant] || iconConfig.danger;

  const handleConfirm = () => {
    if (requiresInput && inputValidation && !inputValidation(inputValue)) {
      return;
    }
    onConfirm(inputValue);
  };

  // Keyboard: Esc zamyka modal
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, loading, onClose]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        // Zamknij przy kliknięciu w tło
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-start gap-4 p-6 border-b border-slate-200">
          <div className={`w-12 h-12 rounded-full ${bg} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="confirm-dialog-title" className="text-xl font-semibold text-slate-900 mb-1">{title}</h3>
            {message && (
              <p id="confirm-dialog-message" className="text-sm text-slate-600 whitespace-pre-line">{message}</p>
            )}
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0 disabled:opacity-50"
            aria-label="Zamknij"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {requiresInput && (
            <div className="mb-4">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder={inputPlaceholder}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                autoFocus
                disabled={loading}
              />
              {inputValidation && inputValidation(inputValue) === false && (
                <p className="mt-2 text-sm text-red-600">
                  Proszę wprowadzić poprawną wartość
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelLabel}
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading || (requiresInput && inputValidation && !inputValidation(inputValue))}
              className={`px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                variant === 'danger'
                  ? 'bg-red-600 hover:bg-red-700'
                  : variant === 'warning'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              } ${confirmButtonClassName}`}
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
