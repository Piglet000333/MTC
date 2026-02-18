import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Clock } from 'lucide-react';

const CustomTimePicker = ({ label, value, onChange, darkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState(12);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState('AM');
  
  const containerRef = useRef(null);
  const menuRef = useRef(null);
  const rafIdRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 280 });

  // Initialize state from value prop (HH:mm 24-hour format)
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':').map(Number);
      const period = h >= 12 ? 'PM' : 'AM';
      const hour12 = h % 12 || 12;
      
      setSelectedHour(hour12);
      setSelectedMinute(m);
      setSelectedPeriod(period);
    } else {
      // Default to current time if no value, or just 12:00 AM?
      // Let's keep internal state synced with "Now" or 12:00 AM
      const now = new Date();
      let h = now.getHours();
      const m = now.getMinutes();
      const period = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      
      setSelectedHour(h);
      setSelectedMinute(m);
      setSelectedPeriod(period);
    }
  }, [value]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current && 
        !containerRef.current.contains(event.target) &&
        (!menuRef.current || !menuRef.current.contains(event.target))
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updatePosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const width = 280; // Fixed width for dropdown
      let left = rect.left + window.scrollX;
      const margin = 12;
      const maxLeft = window.scrollX + window.innerWidth - width - margin;
      if (left > maxLeft) left = Math.max(window.scrollX + margin, maxLeft);
      const top = rect.bottom + window.scrollY + 8;
      setCoords({ top, left, width });
    }
  };

  useEffect(() => {
    const handleScrollOrResize = (event) => {
      if (!isOpen) return;
      if (menuRef.current && event?.target && menuRef.current.contains(event.target)) return;
      if (rafIdRef.current) return;
      rafIdRef.current = window.requestAnimationFrame(() => {
        rafIdRef.current = null;
        updatePosition();
      });
    };
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);
    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      if (rafIdRef.current) {
        window.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isOpen]);

  const handleTimeChange = (h, m, p) => {
    // Just update local state, commit on OK? 
    // Or commit immediately? CustomDatePicker commits immediately on click.
    // For time picker with multiple dials, usually you commit on "OK" or have it live update.
    // Let's live update to be responsive, but maybe "OK" closes it.
    
    let hour24 = h;
    if (p === 'PM' && hour24 !== 12) hour24 += 12;
    if (p === 'AM' && hour24 === 12) hour24 = 0;
    
    const timeString = `${String(hour24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    onChange(timeString);
  };

  const updateHour = (val) => {
    setSelectedHour(val);
    handleTimeChange(val, selectedMinute, selectedPeriod);
  };

  const updateMinute = (val) => {
    setSelectedMinute(val);
    handleTimeChange(selectedHour, val, selectedPeriod);
  };

  const updatePeriod = (val) => {
    setSelectedPeriod(val);
    handleTimeChange(selectedHour, selectedMinute, val);
  };

  const setNow = () => {
    const now = new Date();
    let h = now.getHours();
    const m = now.getMinutes();
    const p = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    
    setSelectedHour(h);
    setSelectedMinute(m);
    setSelectedPeriod(p);
    handleTimeChange(h, m, p);
  };

  const clearTime = (e) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  // Helper for scrollable columns
  const Column = ({ options, value, onSelect, label }) => (
    <div className="flex flex-col h-48 w-16">
      <div className={`text-xs font-semibold text-center mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</div>
      <div className={`flex-1 overflow-y-auto scrollbar-hide snap-y snap-mandatory rounded-lg border ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            className={`w-full h-10 flex items-center justify-center snap-center transition-colors text-sm font-medium
              ${value === opt 
                ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white') 
                : (darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100')
              }
            `}
          >
            {String(opt).padStart(2, '0')}
          </button>
        ))}
      </div>
    </div>
  );

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const periods = ['AM', 'PM'];

  return (
    <div className="space-y-1" ref={containerRef}>
      {label && <label className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{label}</label>}
      
      <div className="relative">
        <div 
          onClick={() => {
            if (!isOpen) updatePosition();
            setIsOpen(!isOpen);
          }}
          className={`w-full px-4 py-2 rounded-lg border flex items-center justify-between cursor-pointer transition-colors
            ${darkMode 
              ? 'bg-gray-700 border-gray-600 text-white hover:border-gray-500' 
              : 'bg-white border-gray-200 text-gray-900 hover:border-blue-400'
            }
            ${isOpen ? 'ring-2 ring-blue-500 border-transparent' : ''}
          `}
        >
          <span className={!value ? (darkMode ? 'text-gray-500' : 'text-gray-400') : ''}>
            {value ? (
              `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')} ${selectedPeriod}`
            ) : '--:-- --'}
          </span>
          <Clock size={18} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
        </div>

        {createPortal(
          isOpen ? (
            <div
              ref={menuRef}
              style={{ position: 'absolute', top: coords.top, left: coords.left, width: coords.width, zIndex: 9999 }}
              className={`mt-2 p-4 rounded-xl shadow-xl border flex flex-col gap-4
                ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}
              `}
            >
              <div className="flex justify-center gap-2">
                <Column options={hours} value={selectedHour} onSelect={updateHour} label="Hour" />
                <Column options={minutes} value={selectedMinute} onSelect={updateMinute} label="Min" />
                <div className="flex flex-col h-48 w-16">
                  <div className={`text-xs font-semibold text-center mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>AM/PM</div>
                  <div className={`flex flex-col gap-1`}>
                    {periods.map(p => (
                      <button
                        key={p}
                        onClick={() => updatePeriod(p)}
                        className={`w-full h-10 rounded-lg flex items-center justify-center transition-colors text-sm font-medium
                          ${selectedPeriod === p 
                            ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white') 
                            : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
                          }
                        `}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-3 border-t border-gray-200/20">
                <button 
                  onClick={clearTime}
                  className="text-sm text-blue-500 hover:text-blue-600 font-medium"
                >
                  Clear
                </button>
                <div className="flex gap-4">
                  <button 
                    onClick={setNow}
                    className="text-sm text-blue-500 hover:text-blue-600 font-medium"
                  >
                    Now
                  </button>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="text-sm text-blue-500 hover:text-blue-600 font-medium"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          ) : null,
          document.body
        )}
      </div>
    </div>
  );
};

export default CustomTimePicker;
