import React, { useEffect, useState, useRef } from 'react';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { MobileTimePicker } from '@mui/x-date-pickers/MobileTimePicker';
import { InputAdornment, Button, DialogActions } from '@mui/material';

const pad = (n) => String(n).padStart(2, '0');

export default function MuiTimePicker({ label, value, onChange, darkMode }) {
  const [localValue, setLocalValue] = useState(() =>
    value ? dayjs(`1970-01-01T${value}`) : null
  );
  const [tempValue, setTempValue] = useState(() =>
    value ? dayjs(`1970-01-01T${value}`) : null
  );
  const [open, setOpen] = useState(false);
  
  const localValueRef = useRef(localValue);
  const tempValueRef = useRef(tempValue);

  useEffect(() => {
    localValueRef.current = localValue;
  }, [localValue]);

  useEffect(() => {
    tempValueRef.current = tempValue;
  }, [tempValue]);

  useEffect(() => {
    const newValue = value ? dayjs(`1970-01-01T${value}`) : null;
    setLocalValue(newValue);
    if (!open) {
      setTempValue(newValue);
    }
  }, [value, open]);

  const handleOpen = () => {
    setTempValue(localValueRef.current);
    setOpen(true);
  };

  const CustomActionBar = () => {
    const handleCancelClick = () => {
      console.log('Cancel clicked - reverting to original value');
      setTempValue(localValueRef.current);
      setOpen(false);
    };

    const handleAcceptClick = () => {
      console.log('OK clicked - committing value');
      const val = tempValueRef.current;
      
      if (!val || !val.isValid?.()) {
        console.log('Invalid value, calling onChange with empty string');
        onChange('');
        setLocalValue(null);
      } else {
        const hh = pad(val.hour());
        const mm = pad(val.minute());
        const timeString = `${hh}:${mm}`;
        console.log('Valid value, calling onChange with:', timeString);
        onChange(timeString); // This should trigger your parent component update
        setLocalValue(val);
      }
      setOpen(false);
    };

    const handleNowClick = () => {
      console.log('Now clicked - setting to current time');
      const now = dayjs();
      setTempValue(now);
    };

    return (
      <DialogActions sx={{ 
        justifyContent: 'space-between', 
        px: 2, 
        py: 1.5,
        backgroundColor: darkMode ? '#0f172a' : '#ffffff'
      }}>
        <Button 
          type="button"
          variant="text"
          onClick={handleCancelClick}
          sx={{ 
            textTransform: 'none', 
            fontWeight: 600,
            color: '#2563eb',
            cursor: 'pointer'
          }}
        >
          Cancel
        </Button>
        <Button 
          type="button"
          variant="text"
          onClick={handleNowClick}
          sx={{ 
            textTransform: 'none', 
            fontWeight: 600,
            color: '#2563eb',
            cursor: 'pointer'
          }}
        >
          Now
        </Button>
        <Button 
          type="button"
          variant="text"
          onClick={handleAcceptClick}
          sx={{ 
            textTransform: 'none', 
            fontWeight: 600,
            color: '#2563eb',
            cursor: 'pointer'
          }}
        >
          OK
        </Button>
      </DialogActions>
    );
  };

  return (
    <div className="space-y-1">
      {label && (
        <label className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {label}
        </label>
      )}
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MobileTimePicker
          open={open}
          onOpen={handleOpen}
          onClose={() => setOpen(false)}
          value={tempValue}
          onChange={(newVal) => {
            console.log('Time changed on clock:', newVal?.format('HH:mm'));
            setTempValue(newVal);
          }}
          closeOnSelect={false}
          ampm
          openTo="hours"
          views={['hours', 'minutes']}
          minutesStep={1}
          format="hh:mm A"
          orientation="portrait"
          slots={{
            actionBar: CustomActionBar
          }}
          slotProps={{
            textField: {
              fullWidth: true,
              size: 'small',
              placeholder: 'hh:mm aa',
              onFocus: handleOpen,
              onClick: handleOpen,
              InputProps: {
                endAdornment: (
                  <InputAdornment position="end">
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: darkMode ? '#93c5fd' : '#2563eb'
                      }}
                    >
                      {localValue ? (localValue.hour() < 12 ? 'AM' : 'PM') : ''}
                    </span>
                  </InputAdornment>
                )
              },
              sx: {
                '& .MuiInputBase-input': {
                  color: darkMode ? '#ffffff' : '#111827'
                },
                '& .MuiSvgIcon-root': {
                  color: darkMode ? '#cbd5e1' : '#64748b'
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: darkMode ? 'rgba(147,197,253,0.35)' : 'rgba(100,116,139,0.35)'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: darkMode ? '#93c5fd' : '#2563eb'
                },
                '& .MuiInputBase-input::placeholder': {
                  color: darkMode ? '#e5e7eb' : '#6b7280',
                  opacity: 1
                }
              }
            },
            dialog: { 
              sx: { 
                zIndex: 200000, 
                '& .MuiPaper-root': { 
                  borderRadius: 12, 
                  backgroundColor: darkMode ? '#0f172a' : '#ffffff'
                },
                '& .MuiTypography-root': {
                  color: darkMode ? '#ffffff' : '#111827'
                },
                '& .MuiPickersLayout-root': {
                  color: darkMode ? '#ffffff' : '#111827'
                },
                '& .MuiTimeClock-root .MuiButtonBase-root': {
                  color: darkMode ? '#ffffff' : '#111827'
                },
                '& .MuiClockNumber-root, & .MuiPickersClockNumber-root': {
                  color: darkMode ? '#ffffff' : '#111827'
                }
              } 
            },
            toolbar: {
              sx: {
                '& [class*="ampmSelection"] .MuiButtonBase-root': {
                  color: darkMode ? '#cbd5e1' : '#334155'
                },
                '& [class*="ampmSelection"] .MuiButtonBase-root.Mui-selected, & [class*="ampmSelection"] .MuiToggleButton-root.Mui-selected, & [class*="ampmSelection"] button[aria-pressed="true"]': {
                  color: '#2563eb',
                  fontWeight: 700,
                  backgroundColor: darkMode ? 'rgba(37,99,235,0.18)' : 'rgba(37,99,235,0.12)',
                  borderRadius: 8
                }
              }
            }
          }}
        />
      </LocalizationProvider>
    </div>
  );
}
