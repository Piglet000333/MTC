import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const CustomDatePicker = ({ label, value, onChange, darkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date()); // For navigation
  const [selectedDate, setSelectedDate] = useState(null); // Selected value
  const containerRef = useRef(null);
  const menuRef = useRef(null);
  const rafIdRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 280 });

  // Initialize state from value prop
  useEffect(() => {
    if (value) {
      // Adjust for timezone offset to display correctly if the string is just YYYY-MM-DD
      // But standard input date treats YYYY-MM-DD as UTC or local depending on parsing.
      // Let's assume the value is YYYY-MM-DD string.
      const [y, m, d] = value.split('-').map(Number);
      const newDate = new Date(y, m - 1, d);
      
      setSelectedDate(newDate);
      setCurrentDate(new Date(y, m - 1, 1)); // Set view to that month
    } else {
      setSelectedDate(null);
      setCurrentDate(new Date());
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
      const width = 280;
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

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    
    // Format to YYYY-MM-DD for the parent component
    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, '0');
    const d = String(newDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${d}`;

    onChange(dateString);
    setIsOpen(false);
  };

  const clearDate = (e) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  const setToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${d}`;
    
    onChange(dateString);
    setIsOpen(false);
  }

  // Generate calendar grid
  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    
    // Empty cells for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
    }

    // Days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = selectedDate && 
        selectedDate.getDate() === day && 
        selectedDate.getMonth() === month && 
        selectedDate.getFullYear() === year;

      const isToday = new Date().getDate() === day && 
        new Date().getMonth() === month && 
        new Date().getFullYear() === year;

      days.push(
        <button
          key={day}
        onClick={() => handleDateClick(day)}
        className={`h-9 w-9 rounded-full flex items-center justify-center text-base transition-colors
            ${isSelected 
              ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white') 
              : (darkMode ? 'text-gray-100 hover:bg-gray-700' : 'text-gray-800 hover:bg-blue-50')
            }
            ${!isSelected && isToday ? (darkMode ? 'text-blue-400 font-bold' : 'text-blue-600 font-bold') : ''}
          `}
        >
          {day}
        </button>
      );
    }

    return days;
  };

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
            {value ? new Date(value).toLocaleDateString() : 'mm/dd/yyyy'}
          </span>
          <Calendar size={18} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
        </div>

        {createPortal(
          isOpen ? (
            <div
              ref={menuRef}
              style={{ position: 'absolute', top: coords.top, left: coords.left, width: coords.width, zIndex: 9999 }}
              className={`mt-2 p-4 rounded-xl shadow-xl border
                ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}
              `}
            >
              <div className="flex items-center justify-between mb-4">
                <button 
                  onClick={handlePrevMonth}
                  className={`p-1 rounded-full hover:bg-opacity-20 ${darkMode ? 'hover:bg-gray-400 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                >
                  <ChevronLeft size={20} />
                </button>
                
                <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {months[currentDate.getMonth()]} {currentDate.getFullYear()}
                </span>
                
                <button 
                  onClick={handleNextMonth}
                  className={`p-1 rounded-full hover:bg-opacity-20 ${darkMode ? 'hover:bg-gray-400 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="grid grid-cols-7 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <div key={day} className={`text-center text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-y-1 justify-items-center">
                {renderCalendar()}
              </div>

              <div className="flex justify-between mt-4 pt-3 border-t border-gray-200/20">
                <button 
                  onClick={clearDate}
                  className="text-sm text-blue-500 hover:text-blue-600 font-medium"
                >
                  Clear
                </button>
                <button 
                  onClick={setToday}
                  className="text-sm text-blue-500 hover:text-blue-600 font-medium"
                >
                  Today
                </button>
              </div>
            </div>
          ) : null,
          document.body
        )}
      </div>
    </div>
  );
};

export default CustomDatePicker;
