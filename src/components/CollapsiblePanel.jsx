import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useBreakpointMd } from '../hooks/useBreakpointMd';

/**
 * Zwijany panel — domyślnie zwinięty na mobile (< md), rozwinięty na desktopie.
 */
export default function CollapsiblePanel({
  title,
  icon: Icon,
  children,
  storageKey,
  defaultCollapsed = true,
  collapseOnMobileOnly = true,
  summary = null,
  className = '',
  bodyClassName = '',
  headerClassName = '',
}) {
  const isMdUp = useBreakpointMd();
  const canCollapse = collapseOnMobileOnly ? !isMdUp : true;

  const [collapsed, setCollapsed] = useState(() => {
    if (!canCollapse) return false;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw === '0') return false;
      if (raw === '1') return true;
    } catch (_) {}
    return defaultCollapsed;
  });

  useEffect(() => {
    if (!canCollapse) {
      setCollapsed(false);
      return;
    }
    try {
      localStorage.setItem(storageKey, collapsed ? '1' : '0');
    } catch (_) {}
  }, [collapsed, storageKey, canCollapse]);

  if (!canCollapse) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 ${className}`}>
        {title ? (
          <h2 className="text-lg md:text-xl font-semibold mb-4 flex items-center gap-2 text-gray-900">
            {Icon ? <Icon className="w-5 h-5 text-indigo-600 shrink-0" aria-hidden /> : null}
            {title}
          </h2>
        ) : null}
        <div className={bodyClassName}>{children}</div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        aria-expanded={!collapsed}
        className={`w-full px-4 py-3 flex items-center gap-2 text-left hover:bg-gray-50/80 transition-colors ${headerClassName}`}
      >
        {Icon ? <Icon className="w-5 h-5 text-indigo-600 shrink-0" aria-hidden /> : null}
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          {collapsed && summary ? (
            <p className="text-xs text-gray-500 mt-0.5 truncate">{summary}</p>
          ) : null}
        </div>
        <span className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-gray-500">
          {collapsed ? (
            <>
              <span className="sr-only">Rozwiń</span>
              <ChevronDown className="w-4 h-4" aria-hidden />
            </>
          ) : (
            <>
              <span className="sr-only">Zwiń</span>
              <ChevronUp className="w-4 h-4" aria-hidden />
            </>
          )}
        </span>
      </button>
      {!collapsed ? (
        <div className={`px-4 pb-4 pt-0 border-t border-gray-100 ${bodyClassName}`}>
          {children}
        </div>
      ) : null}
    </div>
  );
}
