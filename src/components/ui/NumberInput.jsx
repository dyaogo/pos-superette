// src/components/ui/NumberInput.jsx
import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const NumberInput = ({ 
  value, 
  onChange, 
  min = 0, 
  max = Infinity,
  step = 1,
  disabled = false,
  showControls = true,
  label,
  placeholder,
  ...props 
}) => {
  const [inputValue, setInputValue] = useState(value?.toString() || '');

  const handleIncrement = () => {
    const newValue = Math.min(max, (value || 0) + step);
    onChange(newValue);
    setInputValue(newValue.toString());
  };

  const handleDecrement = () => {
    const newValue = Math.max(min, (value || 0) - step);
    onChange(newValue);
    setInputValue(newValue.toString());
  };

  const handleInputChange = (e) => {
    const inputVal = e.target.value;
    setInputValue(inputVal);
    
    const numValue = parseFloat(inputVal);
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(min, Math.min(max, numValue));
      onChange(clampedValue);
    } else if (inputVal === '') {
      onChange(0);
    }
  };

  const handleBlur = () => {
    setInputValue(value?.toString() || '0');
  };

  return (
    <div>
      {label && (
        <label style={{
          display: 'block',
          marginBottom: '6px',
          fontSize: '14px',
          fontWeight: '500',
          color: '#374151'
        }}>
          {label}
        </label>
      )}
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        background: 'white',
        overflow: 'hidden'
      }}>
        {showControls && (
          <button
            type="button"
            onClick={handleDecrement}
            disabled={disabled || value <= min}
            style={{
              padding: '12px',
              border: 'none',
              background: 'transparent',
              cursor: disabled || value <= min ? 'not-allowed' : 'pointer',
              color: disabled || value <= min ? '#9ca3af' : '#6b7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!disabled && value > min) {
                e.target.style.background = '#f3f4f6';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
            }}
          >
            <Minus size={16} />
          </button>
        )}
        
        <input
          type="number"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          style={{
            border: 'none',
            outline: 'none',
            padding: '12px',
            textAlign: 'center',
            fontSize: '16px',
            background: 'transparent',
            flex: 1,
            minWidth: '80px'
          }}
          {...props}
        />
        
        {showControls && (
          <button
            type="button"
            onClick={handleIncrement}
            disabled={disabled || value >= max}
            style={{
              padding: '12px',
              border: 'none',
              background: 'transparent',
              cursor: disabled || value >= max ? 'not-allowed' : 'pointer',
              color: disabled || value >= max ? '#9ca3af' : '#6b7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!disabled && value < max) {
                e.target.style.background = '#f3f4f6';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
            }}
          >
            <Plus size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default NumberInput;

/* USAGE:
<NumberInput
  label="Quantité"
  value={quantity}
  onChange={setQuantity}
  min={1}
  max={product.stock}
  step={1}
/>
*/
