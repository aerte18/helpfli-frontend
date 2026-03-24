import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DAYS_OF_WEEK = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb'];
const MONTHS = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
];

export default function CalendarView({ 
  selectedDates = [], 
  onDateSelect, 
  onRangeSelect,
  mode = 'single', // 'single' | 'range'
  minDate,
  maxDate,
  dateInfo = {} // { dateString: { timeSlots: [{ startTime, endTime }] } }
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [rangeStart, setRangeStart] = useState(null);
  const [rangeEnd, setRangeEnd] = useState(null); // Dla podświetlania podczas przeciągania
  const [isSelectingRange, setIsSelectingRange] = useState(false);
  const [hoveredDate, setHoveredDate] = useState(null); // Data nad którą jest kursor podczas przeciągania

  // Konwertuj selectedDates na Set dla szybkiego sprawdzania
  const selectedDatesSet = useMemo(() => {
    return new Set(selectedDates.map(d => {
      const date = new Date(d);
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    }));
  }, [selectedDates]);

  // Sprawdź czy data jest w zakresie (dla trybu range) - podczas wyboru
  const isInRange = (date) => {
    if (mode !== 'range' || !rangeStart) return false;
    
    // Normalizuj daty do początku dnia dla porównań
    const normalizeDate = (d) => {
      const normalized = new Date(d);
      normalized.setHours(0, 0, 0, 0);
      return normalized;
    };
    
    const normalizedDate = normalizeDate(date);
    const normalizedStart = normalizeDate(rangeStart);
    
    // Jeśli przeciągamy, sprawdź zakres od rangeStart do hoveredDate
    if (isSelectingRange && hoveredDate) {
      const normalizedEnd = normalizeDate(hoveredDate);
      const start = normalizedStart < normalizedEnd ? normalizedStart : normalizedEnd;
      const end = normalizedStart < normalizedEnd ? normalizedEnd : normalizedStart;
      return normalizedDate >= start && normalizedDate <= end;
    }
    
    // Jeśli mamy już wybrany zakres (rangeEnd), pokaż go
    if (rangeEnd) {
      const normalizedEnd = normalizeDate(rangeEnd);
      const start = normalizedStart < normalizedEnd ? normalizedStart : normalizedEnd;
      const end = normalizedStart < normalizedEnd ? normalizedEnd : normalizedStart;
      return normalizedDate >= start && normalizedDate <= end;
    }
    
    return false;
  };

  // Sprawdź czy data jest dostępna (zaznaczona)
  const isDateSelected = (date) => {
    const dateStr = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return selectedDatesSet.has(dateStr);
  };

  // Pobierz informacje o godzinach dla danej daty
  const getDateInfo = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return dateInfo[dateStr] || null;
  };

  // Sprawdź czy data jest w przeszłości
  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Sprawdź czy data jest w dozwolonym zakresie
  const isDateAllowed = (date) => {
    if (minDate && date < new Date(minDate)) return false;
    if (maxDate && date > new Date(maxDate)) return false;
    return true;
  };

  // Pobierz wszystkie dni w miesiącu
  const getDaysInMonth = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Dni z poprzedniego miesiąca (dla wypełnienia)
    for (let i = 0; i < startingDayOfWeek; i++) {
      const date = new Date(currentYear, currentMonth, -i);
      days.unshift({ date, isCurrentMonth: false });
    }
    
    // Dni bieżącego miesiąca
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      days.push({ date, isCurrentMonth: true });
    }
    
    // Dni z następnego miesiąca (dla wypełnienia do 6 tygodni)
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(currentYear, currentMonth + 1, day);
      days.push({ date, isCurrentMonth: false });
    }
    
    return days;
  };

  const handleDateClick = (date) => {
    if (!isDateAllowed(date) || isPastDate(date)) return;

    if (mode === 'range') {
      if (!rangeStart) {
        // Rozpocznij wybór zakresu
        setRangeStart(date);
        setIsSelectingRange(true);
      } else {
        // Zakończ wybór zakresu
        const start = rangeStart < date ? rangeStart : date;
        const end = rangeStart < date ? date : rangeStart;
        
        if (onRangeSelect) {
          onRangeSelect(start, end);
        }
        
        setRangeStart(null);
        setRangeEnd(null);
        setHoveredDate(null);
        setIsSelectingRange(false);
      }
    } else {
      // Tryb pojedynczych dat
      if (onDateSelect) {
        onDateSelect(date);
      }
    }
  };

  // Obsługa najechania myszką na datę podczas wyboru zakresu
  const handleDateMouseEnter = (date) => {
    if (mode === 'range' && isSelectingRange && rangeStart) {
      setHoveredDate(date);
    }
  };

  // Obsługa opuszczenia myszki
  const handleDateMouseLeave = () => {
    // Nie resetuj hoveredDate, żeby zakres był widoczny
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const days = getDaysInMonth();

  return (
    <div className="qs-card p-6">
      {/* Nagłówek z miesiącem i nawigacją */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Poprzedni miesiąc"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <h3 className="text-lg font-semibold">
          {MONTHS[currentMonth]} {currentYear}
        </h3>
        
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Następny miesiąc"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Dni tygodnia */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS_OF_WEEK.map((day, index) => (
          <div
            key={index}
            className="text-center text-sm font-medium text-slate-600 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Kalendarz */}
      <div 
        className="grid grid-cols-7 gap-1"
        onMouseLeave={() => {
          // Resetuj hoveredDate gdy myszka opuści kalendarz
          if (mode === 'range' && isSelectingRange) {
            setHoveredDate(null);
          }
        }}
      >
        {days.map((day, index) => {
          const isSelected = isDateSelected(day.date);
          const isPast = isPastDate(day.date);
          const isAllowed = isDateAllowed(day.date);
          const isInCurrentMonth = day.isCurrentMonth;
          const info = getDateInfo(day.date);
          const hasTimeSlots = info?.timeSlots && info.timeSlots.length > 0;
          const inRange = isInRange(day.date);
          // Porównaj daty normalizując je do początku dnia
          const normalizeDate = (d) => {
            const normalized = new Date(d);
            normalized.setHours(0, 0, 0, 0);
            return normalized.getTime();
          };
          const isRangeStart = rangeStart && normalizeDate(day.date) === normalizeDate(rangeStart);
          const isRangeEnd = hoveredDate && normalizeDate(day.date) === normalizeDate(hoveredDate);

          return (
            <button
              key={index}
              onClick={() => handleDateClick(day.date)}
              onMouseEnter={() => handleDateMouseEnter(day.date)}
              disabled={!isAllowed || isPast || !isInCurrentMonth}
              title={hasTimeSlots ? info.timeSlots.map(ts => `${ts.startTime}-${ts.endTime}`).join(', ') : ''}
              className={`
                aspect-square p-2 text-sm rounded-lg transition-all relative
                ${!isInCurrentMonth 
                  ? 'text-slate-300 cursor-not-allowed' 
                  : isPast 
                    ? 'text-slate-400 cursor-not-allowed hover:bg-slate-50' 
                    : inRange && !isSelected
                      ? 'bg-indigo-100 text-indigo-700 font-medium border-2 border-indigo-300'
                      : isSelected
                        ? 'bg-indigo-600 text-white font-semibold shadow-md hover:bg-indigo-700'
                        : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-700'
                }
                ${!isAllowed ? 'opacity-50 cursor-not-allowed' : ''}
                ${isRangeStart || isRangeEnd ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}
              `}
            >
              {day.date.getDate()}
              {hasTimeSlots && (
                <div className="absolute bottom-0.5 left-0 right-0 text-[8px] opacity-75 truncate px-0.5">
                  {info.timeSlots[0].startTime}-{info.timeSlots[0].endTime}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legenda */}
      <div className="mt-4 flex items-center gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-indigo-600"></div>
          <span>Dostępny</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-slate-300"></div>
          <span>Niedostępny</span>
        </div>
      </div>
    </div>
  );
}

