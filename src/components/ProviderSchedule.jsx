import { useState, useEffect } from 'react';
import { apiGet, apiPut } from '../lib/api';
import { useToast } from './toast/ToastProvider';
import CalendarView from './CalendarView';
import TimeSlotModal from './TimeSlotModal';

export default function ProviderSchedule() {
  const { push } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false); // Stan dla "Zapisano"
  const [dateMode, setDateMode] = useState('single'); // 'single' | 'range'
  const [schedule, setSchedule] = useState({
    useCalendar: false,
    defaultStatus: 'offline',
    schedule: [],
    recurringPatterns: [],
    exceptions: []
  });
  const [timeSlotModal, setTimeSlotModal] = useState({
    isOpen: false,
    mode: 'single', // 'single' | 'range'
    date: null,
    startDate: null,
    endDate: null
  });

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const data = await apiGet('/api/provider-schedule/me');
      setSchedule(data);
    } catch (err) {
      console.error('Błąd pobierania harmonogramu:', err);
      push({ title: 'Nie udało się pobrać harmonogramu', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaved(false);
      await apiPut('/api/provider-schedule/me', schedule);
      setSaved(true);
      // Resetuj "Zapisano" po 2 sekundach
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Błąd zapisywania harmonogramu:', err);
      push({ title: 'Nie udało się zapisać harmonogramu', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleUseCalendarChange = (useCalendar) => {
    setSchedule(prev => ({
      ...prev,
      useCalendar,
      defaultStatus: useCalendar ? prev.defaultStatus : 'offline'
    }));
  };

  // Pobierz wszystkie daty z harmonogramu (schedule + recurringPatterns)
  const getAvailableDates = () => {
    const dates = [];
    const dateSet = new Set(); // Używamy Set, żeby uniknąć duplikatów
    
    // Konkretne daty
    schedule.schedule?.forEach(item => {
      if (item.available && item.date) {
        const date = new Date(item.date);
        const dateKey = date.toISOString().split('T')[0];
        if (!dateSet.has(dateKey)) {
          dates.push(date);
          dateSet.add(dateKey);
        }
      }
    });

    // Daty z wzorców powtarzalnych (oblicz dla następnych 90 dni)
    schedule.recurringPatterns?.forEach(pattern => {
      if (pattern.active && pattern.days) {
        pattern.days.forEach(day => {
          if (day.available && day.dayOfWeek) {
            // Mapowanie nazw dni na numery (0 = niedziela, 1 = poniedziałek, itd.)
            const dayMap = {
              'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
              'thursday': 4, 'friday': 5, 'saturday': 6
            };
            const targetDayOfWeek = dayMap[day.dayOfWeek.toLowerCase()];
            
            if (targetDayOfWeek !== undefined) {
              // Znajdź wszystkie wystąpienia tego dnia w następnych 90 dniach
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              
              for (let i = 0; i < 90; i++) {
                const date = new Date(today);
                date.setDate(today.getDate() + i);
                
                // Sprawdź czy to jest wybrany dzień tygodnia
                if (date.getDay() === targetDayOfWeek) {
                  const dateKey = date.toISOString().split('T')[0];
                  // Sprawdź czy data nie jest już w schedule (konkretne daty mają priorytet)
                  const isInSchedule = schedule.schedule?.some(
                    item => item.date && new Date(item.date).toISOString().split('T')[0] === dateKey
                  );
                  
                  if (!isInSchedule && !dateSet.has(dateKey)) {
                    dates.push(new Date(date));
                    dateSet.add(dateKey);
                  }
                }
              }
            }
          }
        });
      }
    });

    return dates;
  };

  // Obsługa kliknięcia pojedynczej daty
  const handleDateSelect = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    
    // Sprawdź czy data już istnieje
    const existingIndex = schedule.schedule?.findIndex(
      item => item.date && new Date(item.date).toISOString().split('T')[0] === dateStr
    );

    if (existingIndex >= 0) {
      // Jeśli istnieje, przełącz dostępność
      const updated = [...schedule.schedule];
      updated[existingIndex] = {
        ...updated[existingIndex],
        available: !updated[existingIndex].available
      };
      setSchedule(prev => ({ ...prev, schedule: updated }));
    } else {
      // Otwórz modal do wyboru godzin
      setTimeSlotModal({
        isOpen: true,
        mode: 'single',
        date: date,
        startDate: null,
        endDate: null
      });
    }
  };

  // Obsługa wyboru zakresu dat
  const handleRangeSelect = (startDate, endDate) => {
    // Otwórz modal do wyboru godzin dla zakresu
    setTimeSlotModal({
      isOpen: true,
      mode: 'range',
      date: null,
      startDate: startDate,
      endDate: endDate
    });
  };

  // Obsługa zapisywania godzin z modala
  const handleTimeSlotSave = ({ startTime, endTime }) => {
    if (timeSlotModal.mode === 'single' && timeSlotModal.date) {
      // Pojedyncza data
      const dateStr = timeSlotModal.date.toISOString().split('T')[0];
      const existingIndex = schedule.schedule?.findIndex(
        item => item.date && new Date(item.date).toISOString().split('T')[0] === dateStr
      );

      if (existingIndex >= 0) {
        const updated = [...schedule.schedule];
        updated[existingIndex] = {
          ...updated[existingIndex],
          available: true,
          timeSlots: [{ startTime, endTime }]
        };
        setSchedule(prev => ({ ...prev, schedule: updated }));
      } else {
        setSchedule(prev => ({
          ...prev,
          schedule: [...(prev.schedule || []), {
            date: dateStr,
            available: true,
            timeSlots: [{ startTime, endTime }]
          }]
        }));
      }
    } else if (timeSlotModal.mode === 'range' && timeSlotModal.startDate && timeSlotModal.endDate) {
      // Zakres dat
      const dates = [];
      const current = new Date(timeSlotModal.startDate);
      const end = new Date(timeSlotModal.endDate);

      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        const existingIndex = schedule.schedule?.findIndex(
          item => item.date && new Date(item.date).toISOString().split('T')[0] === dateStr
        );

        if (existingIndex >= 0) {
          const updated = [...schedule.schedule];
          updated[existingIndex] = {
            ...updated[existingIndex],
            available: true,
            timeSlots: [{ startTime, endTime }]
          };
          setSchedule(prev => ({ ...prev, schedule: updated }));
        } else {
          dates.push({
            date: dateStr,
            available: true,
            timeSlots: [{ startTime, endTime }]
          });
        }
        current.setDate(current.getDate() + 1);
      }

      if (dates.length > 0) {
        setSchedule(prev => ({
          ...prev,
          schedule: [...(prev.schedule || []), ...dates]
        }));
      }
    }
  };

  const updateScheduleDate = (index, field, value) => {
    setSchedule(prev => ({
      ...prev,
      schedule: prev.schedule.map((s, i) => 
        i === index ? { ...s, [field]: value } : s
      )
    }));
  };

  const removeScheduleDate = (index) => {
    setSchedule(prev => ({
      ...prev,
      schedule: prev.schedule.filter((_, i) => i !== index)
    }));
  };

  const addRecurringPattern = () => {
    setSchedule(prev => ({
      ...prev,
      recurringPatterns: [...(prev.recurringPatterns || []), {
        name: 'Nowy wzorzec',
        days: [
          { dayOfWeek: 'monday', available: true, timeSlots: [] },
          { dayOfWeek: 'tuesday', available: true, timeSlots: [] },
          { dayOfWeek: 'wednesday', available: true, timeSlots: [] },
          { dayOfWeek: 'thursday', available: true, timeSlots: [] },
          { dayOfWeek: 'friday', available: true, timeSlots: [] }
        ],
        active: true
      }]
    }));
  };

  const updateRecurringPattern = (index, field, value) => {
    setSchedule(prev => ({
      ...prev,
      recurringPatterns: prev.recurringPatterns.map((p, i) => 
        i === index ? { ...p, [field]: value } : p
      )
    }));
  };

  const updateRecurringPatternDay = (patternIndex, dayIndex, field, value) => {
    setSchedule(prev => ({
      ...prev,
      recurringPatterns: prev.recurringPatterns.map((p, i) => 
        i === patternIndex ? {
          ...p,
          days: p.days.map((d, j) => 
            j === dayIndex ? { ...d, [field]: value } : d
          )
        } : p
      )
    }));
  };

  const removeRecurringPattern = (index) => {
    setSchedule(prev => ({
      ...prev,
      recurringPatterns: prev.recurringPatterns.filter((_, i) => i !== index)
    }));
  };

  const daysOfWeek = [
    { value: 'monday', label: 'Poniedziałek' },
    { value: 'tuesday', label: 'Wtorek' },
    { value: 'wednesday', label: 'Środa' },
    { value: 'thursday', label: 'Czwartek' },
    { value: 'friday', label: 'Piątek' },
    { value: 'saturday', label: 'Sobota' },
    { value: 'sunday', label: 'Niedziela' }
  ];

  if (loading) {
    return (
      <div className="qs-card p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Ładowanie harmonogramu...</p>
      </div>
    );
  }

  // Pobierz daty dostępne dla kalendarza
  const availableDates = schedule.useCalendar ? getAvailableDates() : [];

  return (
    <div className="space-y-6">
      <div className="qs-card p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Harmonogram dostępności</h2>
          <button
            onClick={handleSave}
            disabled={saving}
            className="qs-btn qs-btn-primary"
          >
            {saving ? 'Zapisywanie...' : saved ? 'Zapisano' : 'Zapisz zmiany'}
          </button>
        </div>

        {/* Wybór trybu */}
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="mode"
                checked={!schedule.useCalendar}
                onChange={() => handleUseCalendarChange(false)}
                className="w-5 h-5"
              />
              <div>
                <div className="font-medium">Prosty tryb</div>
                <div className="text-sm text-slate-600">
                  Ustaw tylko status: Dostępny / Niedostępny
                </div>
              </div>
            </label>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="mode"
                checked={schedule.useCalendar}
                onChange={() => handleUseCalendarChange(true)}
                className="w-5 h-5"
              />
              <div>
                <div className="font-medium">Harmonogram (kalendarz)</div>
                <div className="text-sm text-slate-600">
                  Ustaw dostępność na konkretne dni i godziny
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Prosty tryb */}
        {!schedule.useCalendar && (
          <div className="space-y-3">
            <label className="block text-sm font-medium">Domyślny status</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="defaultStatus"
                  value="online"
                  checked={schedule.defaultStatus === 'online'}
                  onChange={(e) => setSchedule(prev => ({ ...prev, defaultStatus: e.target.value }))}
                  className="w-4 h-4"
                />
                <span>Dostępny</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="defaultStatus"
                  value="offline"
                  checked={schedule.defaultStatus === 'offline'}
                  onChange={(e) => setSchedule(prev => ({ ...prev, defaultStatus: e.target.value }))}
                  className="w-4 h-4"
                />
                <span>Niedostępny</span>
              </label>
            </div>
          </div>
        )}

        {/* Tryb kalendarza */}
        {schedule.useCalendar && (
          <div className="space-y-6">
            {/* Kalendarz wizualny */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-lg">Kalendarz dostępności</h3>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="dateMode"
                      checked={dateMode === 'single'}
                      onChange={() => setDateMode('single')}
                      className="w-4 h-4"
                    />
                    <span>Pojedyncze daty</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="dateMode"
                      checked={dateMode === 'range'}
                      onChange={() => setDateMode('range')}
                      className="w-4 h-4"
                    />
                    <span>Zakres dat</span>
                  </label>
                </div>
              </div>
              
              <CalendarView
                selectedDates={getAvailableDates()}
                onDateSelect={handleDateSelect}
                onRangeSelect={handleRangeSelect}
                mode={dateMode}
                minDate={new Date().toISOString().split('T')[0]}
                dateInfo={(() => {
                  const info = {};
                  // Dodaj informacje o godzinach z konkretnych dat
                  schedule.schedule?.forEach(item => {
                    if (item.available && item.date && item.timeSlots && item.timeSlots.length > 0) {
                      const dateStr = new Date(item.date).toISOString().split('T')[0];
                      info[dateStr] = { timeSlots: item.timeSlots };
                    }
                  });
                  // Dodaj informacje o godzinach z wzorców powtarzalnych
                  schedule.recurringPatterns?.forEach(pattern => {
                    if (pattern.active && pattern.days) {
                      pattern.days.forEach(day => {
                        if (day.available && day.timeSlots && day.timeSlots.length > 0) {
                          // Oblicz wszystkie daty dla tego dnia tygodnia w następnych 90 dniach
                          const dayMap = {
                            'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
                            'thursday': 4, 'friday': 5, 'saturday': 6
                          };
                          const targetDayOfWeek = dayMap[day.dayOfWeek.toLowerCase()];
                          
                          if (targetDayOfWeek !== undefined) {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            
                            for (let i = 0; i < 90; i++) {
                              const date = new Date(today);
                              date.setDate(today.getDate() + i);
                              
                              if (date.getDay() === targetDayOfWeek) {
                                const dateStr = date.toISOString().split('T')[0];
                                // Nie nadpisuj jeśli już jest konkretna data
                                if (!info[dateStr]) {
                                  info[dateStr] = { timeSlots: day.timeSlots };
                                }
                              }
                            }
                          }
                        }
                      });
                    }
                  });
                  return info;
                })()}
              />
            </div>

            {/* Lista ustawionych dat */}
            {schedule.schedule && schedule.schedule.length > 0 && (
              <div>
                <h3 className="font-medium mb-3">Ustawione daty ({schedule.schedule.length})</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {schedule.schedule
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .map((item, index) => (
                      <div key={index} className="p-3 border rounded-lg bg-slate-50 space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium flex-1">
                            {new Date(item.date).toLocaleDateString('pl-PL', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.available}
                              onChange={(e) => updateScheduleDate(index, 'available', e.target.checked)}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">Dostępny</span>
                          </label>
                          <button
                            onClick={() => removeScheduleDate(index)}
                            className="ml-2 text-red-600 hover:text-red-800 text-sm"
                          >
                            ✕
                          </button>
                        </div>
                        {item.available && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-600">Godziny:</span>
                            <input
                              type="time"
                              value={item.timeSlots?.[0]?.startTime || '09:00'}
                              onChange={(e) => {
                                const timeSlots = item.timeSlots && item.timeSlots.length > 0
                                  ? [{ ...item.timeSlots[0], startTime: e.target.value }]
                                  : [{ startTime: e.target.value, endTime: item.timeSlots?.[0]?.endTime || '17:00' }];
                                updateScheduleDate(index, 'timeSlots', timeSlots);
                              }}
                              className="px-2 py-1 border rounded text-sm"
                            />
                            <span className="text-xs text-slate-600">-</span>
                            <input
                              type="time"
                              value={item.timeSlots?.[0]?.endTime || '17:00'}
                              onChange={(e) => {
                                const timeSlots = item.timeSlots && item.timeSlots.length > 0
                                  ? [{ ...item.timeSlots[0], endTime: e.target.value }]
                                  : [{ startTime: item.timeSlots?.[0]?.startTime || '09:00', endTime: e.target.value }];
                                updateScheduleDate(index, 'timeSlots', timeSlots);
                              }}
                              className="px-2 py-1 border rounded text-sm"
                            />
                            <button
                              onClick={() => {
                                const timeSlots = item.timeSlots && item.timeSlots.length > 0
                                  ? []
                                  : [{ startTime: '09:00', endTime: '17:00' }];
                                updateScheduleDate(index, 'timeSlots', timeSlots);
                              }}
                              className="text-xs text-indigo-600 hover:text-indigo-800"
                            >
                              {item.timeSlots && item.timeSlots.length > 0 ? 'Usuń godziny' : 'Dodaj godziny'}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Wzorce powtarzalne */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Powtarzalne wzorce (np. poniedziałek-piątek 9-17)</h3>
                <button
                  onClick={addRecurringPattern}
                  className="qs-btn qs-btn-outline text-sm"
                >
                  + Dodaj wzorzec
                </button>
              </div>
              <div className="space-y-4">
                {schedule.recurringPatterns?.map((pattern, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-slate-50 space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={pattern.name || ''}
                        onChange={(e) => updateRecurringPattern(index, 'name', e.target.value)}
                        placeholder="Nazwa wzorca (np. Standardowe godziny)"
                        className="flex-1 px-3 py-2 border rounded-lg"
                      />
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pattern.active}
                          onChange={(e) => updateRecurringPattern(index, 'active', e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">Aktywny</span>
                      </label>
                      <button
                        onClick={() => removeRecurringPattern(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ✕
                      </button>
                    </div>
                    
                    {/* Dni tygodnia */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {daysOfWeek.map((day) => {
                        const dayData = pattern.days?.find(d => d.dayOfWeek === day.value);
                        const dayIndex = pattern.days?.findIndex(d => d.dayOfWeek === day.value) ?? -1;
                        
                        return (
                          <div key={day.value} className="space-y-1">
                            <label className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-white">
                              <input
                                type="checkbox"
                                checked={dayData?.available || false}
                                onChange={(e) => {
                                  if (dayIndex >= 0) {
                                    updateRecurringPatternDay(index, dayIndex, 'available', e.target.checked);
                                  } else {
                                    // Dodaj nowy dzień
                                    const newDays = [...(pattern.days || []), {
                                      dayOfWeek: day.value,
                                      available: true,
                                      timeSlots: []
                                    }];
                                    updateRecurringPattern(index, 'days', newDays);
                                  }
                                }}
                                className="w-4 h-4"
                              />
                              <span className="text-sm">{day.label}</span>
                            </label>
                            {dayData?.available && (
                              <div className="flex items-center gap-1 px-2 pb-2">
                                <input
                                  type="time"
                                  value={dayData.timeSlots?.[0]?.startTime || '09:00'}
                                  onChange={(e) => {
                                    const timeSlots = dayData.timeSlots && dayData.timeSlots.length > 0
                                      ? [{ ...dayData.timeSlots[0], startTime: e.target.value }]
                                      : [{ startTime: e.target.value, endTime: dayData.timeSlots?.[0]?.endTime || '17:00' }];
                                    updateRecurringPatternDay(index, dayIndex, 'timeSlots', timeSlots);
                                  }}
                                  className="w-full px-1 py-0.5 border rounded text-xs"
                                  size="5"
                                />
                                <span className="text-xs">-</span>
                                <input
                                  type="time"
                                  value={dayData.timeSlots?.[0]?.endTime || '17:00'}
                                  onChange={(e) => {
                                    const timeSlots = dayData.timeSlots && dayData.timeSlots.length > 0
                                      ? [{ ...dayData.timeSlots[0], endTime: e.target.value }]
                                      : [{ startTime: dayData.timeSlots?.[0]?.startTime || '09:00', endTime: e.target.value }];
                                    updateRecurringPatternDay(index, dayIndex, 'timeSlots', timeSlots);
                                  }}
                                  className="w-full px-1 py-0.5 border rounded text-xs"
                                  size="5"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {(!schedule.recurringPatterns || schedule.recurringPatterns.length === 0) && (
                  <p className="text-sm text-slate-500">Brak wzorców powtarzalnych</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal do wyboru godzin */}
      <TimeSlotModal
        isOpen={timeSlotModal.isOpen}
        onClose={() => setTimeSlotModal({ isOpen: false, mode: 'single', date: null, startDate: null, endDate: null })}
        onSave={handleTimeSlotSave}
        initialStartTime={timeSlotModal.mode === 'single' && timeSlotModal.date
          ? schedule.schedule?.find(
              item => item.date && new Date(item.date).toISOString().split('T')[0] === timeSlotModal.date.toISOString().split('T')[0]
            )?.timeSlots?.[0]?.startTime || '09:00'
          : '09:00'}
        initialEndTime={timeSlotModal.mode === 'single' && timeSlotModal.date
          ? schedule.schedule?.find(
              item => item.date && new Date(item.date).toISOString().split('T')[0] === timeSlotModal.date.toISOString().split('T')[0]
            )?.timeSlots?.[0]?.endTime || '17:00'
          : '17:00'}
        title={timeSlotModal.mode === 'range' 
          ? `Ustaw godziny dla zakresu ${timeSlotModal.startDate?.toLocaleDateString('pl-PL')} - ${timeSlotModal.endDate?.toLocaleDateString('pl-PL')}`
          : `Ustaw godziny dla ${timeSlotModal.date?.toLocaleDateString('pl-PL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
      />
    </div>
  );
}
