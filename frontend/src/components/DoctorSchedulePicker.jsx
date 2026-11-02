import React from 'react';
import ReactCalendar from 'react-calendar';
import { Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

export const COMMON_DAYS_PRESETS = [
  'Monday to Saturday',
  'Monday to Friday',
  'All Days (Mon - Sun)',
  'Mon, Wed, Fri',
  'Tue, Thu, Sat',
  'Weekend (Sat - Sun)'
];

const DEFAULT_TIMING_SHIFT = { start: '10:00', end: '20:00' };
const SHIFT_BREAK_MINUTES = 120;
const DEFAULT_DAYS = 'Monday to Saturday';
const DEFAULT_TIMING = '10:00 AM - 08:00 PM';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_PREFIXES = DAY_NAMES.map((name) => name.slice(0, 3).toLowerCase());
const DAY_TOKEN = /\b(sun|mon|tue|wed|thu|fri|sat)[a-z]*\b(?:\s*(?:-|–|to)\s*\b(sun|mon|tue|wed|thu|fri|sat)[a-z]*\b)?/g;

// Reads day text ("Mon, Wed", "Monday to Saturday") into working_days: 0 = Sunday ... 6 = Saturday
export const parseWorkingDays = (text = '') => {
  const clean = text.toLowerCase();
  if (/\b(all days|daily|every ?day)\b/.test(clean)) return [0, 1, 2, 3, 4, 5, 6];

  const days = new Set();
  for (const match of clean.matchAll(DAY_TOKEN)) {
    const start = DAY_PREFIXES.indexOf(match[1]);
    const end = match[2] ? DAY_PREFIXES.indexOf(match[2]) : start;
    for (let day = start; ; day = (day + 1) % 7) {
      days.add(day);
      if (day === end) break;
    }
  }
  return [...days].sort((a, b) => a - b);
};

// Writes working_days back as day text, using a preset's name when the days match one
export const formatWorkingDays = (days) => {
  const key = (list) => [...list].sort((a, b) => a - b).join();
  const preset = COMMON_DAYS_PRESETS.find((name) => key(parseWorkingDays(name)) === key(days));
  if (preset) return preset;
  if (days.length === 1) return DAY_NAMES[days[0]];
  return [...days]
    .sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
    .map((day) => DAY_NAMES[day].slice(0, 3))
    .join(', ');
};

// Day lists can contain commas ("Mon, Wed, Fri"), so split at the first time rather than the first comma
export const splitTimings = (raw, defaultDays = DEFAULT_DAYS) => {
  const text = (raw || '').trim();
  const timeStart = text.search(/\d{1,2}(?::\d{2})?\s*(?:AM|PM)/i);
  if (timeStart <= 0) return { days: defaultDays, timing: text || DEFAULT_TIMING };
  return {
    days: text.slice(0, timeStart).replace(/[\s,:]+$/, '') || defaultDays,
    timing: text.slice(timeStart).trim()
  };
};

// Timings are stored as text ("10:00 AM - 02:00 PM & 04:30 PM - 08:00 PM"); the time inputs need 24-hour "HH:MM".
const to24Hour = (hour, minute = '00', meridiem) => {
  const hours = (Number(hour) % 12) + (meridiem.toUpperCase() === 'PM' ? 12 : 0);
  return `${String(hours).padStart(2, '0')}:${minute}`;
};

const to12Hour = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return `${String(hours % 12 || 12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${hours < 12 ? 'AM' : 'PM'}`;
};

const toMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const fromMinutes = (total) => `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;

export const parseTimingShifts = (timing) =>
  [...(timing || '').matchAll(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\s*-\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/gi)].map((m) => ({
    start: to24Hour(m[1], m[2], m[3]),
    end: to24Hour(m[4], m[5], m[6])
  }));

const formatTimingShifts = (shifts) =>
  shifts.map(({ start, end }) => `${to12Hour(start)} - ${to12Hour(end)}`).join(' & ');

// Shift time pickers, shared by the portal's doctor modal and Super Admin's Create Business form
export function DoctorTimingsField({ timing, onChange }) {
  const parsedShifts = parseTimingShifts(timing);
  const pickerShifts = parsedShifts.length > 0 ? parsedShifts : [DEFAULT_TIMING_SHIFT];

  const handleShiftTimeChange = (index, field, value) => {
    if (!value) return;
    onChange(formatTimingShifts(pickerShifts.map((shift, i) => (i === index ? { ...shift, [field]: value } : shift))));
  };

  // Splits the shift around a break in the middle of the day
  const handleAddShift = () => {
    const { start, end } = pickerShifts[0];
    const midpoint = Math.round((toMinutes(start) + toMinutes(end)) / 2);
    onChange(formatTimingShifts([
      { start, end: fromMinutes(midpoint - SHIFT_BREAK_MINUTES / 2) },
      { start: fromMinutes(midpoint + SHIFT_BREAK_MINUTES / 2), end }
    ]));
  };

  const handleRemoveShift = () => {
    onChange(formatTimingShifts([{ start: pickerShifts[0].start, end: pickerShifts[1].end }]));
  };

  return (
    <div>
      <span className="block text-11 font-semibold text-slate-400 uppercase tracking-wider mb-1">
        Daily Working Timings:
      </span>
      <div className="space-y-1.5">
        {pickerShifts.map((shift, index) => (
          <div key={index} className="flex items-center gap-1.5">
            {['start', 'end'].map((field, fieldIndex) => (
              <React.Fragment key={field}>
                {fieldIndex > 0 && <span className="text-11 text-slate-400 shrink-0">to</span>}
                <input
                  type="time"
                  aria-label={`Shift ${index + 1} ${field} time`}
                  value={shift[field]}
                  onChange={(e) => handleShiftTimeChange(index, field, e.target.value)}
                  onClick={(e) => e.currentTarget.showPicker?.()}
                  className="min-w-0 flex-1 px-2 py-1.5 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer shadow-xs"
                />
              </React.Fragment>
            ))}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={pickerShifts.length > 1 ? handleRemoveShift : handleAddShift}
        className="mt-1 inline-flex items-center gap-1 text-11 font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
      >
        {pickerShifts.length > 1 ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
        {pickerShifts.length > 1 ? 'Remove second shift' : 'Add second shift'}
      </button>
    </div>
  );
}

// Common day presets and the calendar; clicking a date toggles that weekday, every week
export function DoctorDaysField({ days, onChange }) {
  const workingDays = parseWorkingDays(days);

  const toggleWeekday = (date) => {
    const day = date.getDay();
    const next = workingDays.includes(day) ? workingDays.filter((d) => d !== day) : [...workingDays, day];
    if (next.length === 0) {
      toast.error('Please keep at least one working day selected.');
      return;
    }
    onChange(formatWorkingDays(next));
  };

  return (
    <>
      {/* Common Days Schedules */}
      <div>
        <span className="block text-11 font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
          Common Days Schedules:
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {COMMON_DAYS_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onChange(preset)}
              className={`text-left px-2 py-1.5 rounded-lg text-11 font-medium border transition-colors cursor-pointer truncate ${
                days === preset || formatWorkingDays(workingDays) === preset
                  ? 'bg-blue-50 border-blue-400 text-blue-700 font-semibold shadow-xs'
                  : 'bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Day Picker */}
      <div>
        <span className="block text-11 font-semibold text-slate-400 uppercase tracking-wider mb-1">
          Select Working Days:
        </span>
        <div className="border border-slate-200 rounded-xl p-1.5 bg-slate-50/50 flex justify-center">
          <ReactCalendar
            value={null}
            onClickDay={toggleWeekday}
            tileClassName={({ date, view }) => {
              if (view !== 'month') return null;
              return workingDays.includes(date.getDay()) ? 'doctor-working-day' : 'doctor-off-day';
            }}
          />
        </div>
      </div>
    </>
  );
}
