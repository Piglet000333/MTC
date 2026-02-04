import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, CheckCircle2 } from 'lucide-react';

const CustomDropdown = ({ options, value, onChange, placeholder, darkMode, icon: Icon, className = "min-w-[200px]", buttonClassName, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);
  const rafIdRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const updatePosition = () => {
    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        (!menuRef.current || !menuRef.current.contains(event.target))
      ) {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = (event) => {
      if (!isOpen) return;
      if (menuRef.current && event?.target && menuRef.current.contains(event.target)) return;
      if (rafIdRef.current) return;
      rafIdRef.current = window.requestAnimationFrame(() => {
        rafIdRef.current = null;
        updatePosition();
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      if (rafIdRef.current) {
        window.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen(!isOpen);
  };

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`flex items-center justify-between w-full pl-4 pr-3 py-2.5 rounded-xl text-sm font-medium border-none ring-1 ring-inset transition-all duration-200 outline-none ${
          disabled 
            ? (darkMode ? 'bg-gray-800/50 ring-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 ring-gray-200 text-gray-400 cursor-not-allowed')
            : darkMode 
              ? 'bg-gray-800 ring-gray-700 text-white hover:ring-gray-600 hover:bg-gray-700/50 focus:ring-blue-500/50' 
              : 'bg-white ring-gray-200 text-gray-700 hover:ring-gray-300 hover:bg-gray-50 focus:ring-blue-500/20 shadow-sm'
        } ${isOpen ? 'ring-2 ring-blue-500 ring-opacity-50' : ''} ${buttonClassName || ''}`}
      >
        <span className="flex items-center gap-2 truncate">
          {Icon && <Icon className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />}
          <span className={`flex items-center gap-2 ${!selectedOption && placeholder ? (darkMode ? "text-gray-400" : "text-gray-500") : ""}`}>
             {selectedOption?.color && <span className={`w-2 h-2 rounded-full ${selectedOption.color}`} />}
             {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-500' : (darkMode ? 'text-gray-400' : 'text-gray-400')}`} />
      </button>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              style={{
                position: 'absolute',
                top: coords.top,
                left: coords.left,
                width: coords.width,
                zIndex: 9999
              }}
              className={`rounded-xl shadow-xl border overflow-hidden mt-2 ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
              }`}
            >
              <div className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
                {options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    disabled={option.disabled}
                    onClick={() => {
                      if (option.disabled) return;
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                      option.disabled
                        ? (darkMode ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed')
                        : value === option.value
                        ? (darkMode ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-600 font-medium')
                        : (darkMode ? 'text-gray-300 hover:bg-gray-700/50' : 'text-gray-700 hover:bg-gray-50')
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {option.color && <span className={`w-2 h-2 rounded-full ${option.color}`} />}
                      {option.label}
                    </div>
                    {value === option.value && (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default CustomDropdown;
