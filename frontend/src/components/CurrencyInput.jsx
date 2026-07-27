import React from 'react';

export default function CurrencyInput({ value, onChange, required, placeholder }) {
  const display = value === '' || value === undefined || value === null
    ? ''
    : Number(value).toLocaleString('en-AU');

  function handleChange(e) {
    const digits = e.target.value.replace(/[^0-9]/g, '');
    onChange(digits === '' ? '' : Number(digits));
  }

  return (
    <div className="currency-input">
      <span className="currency-prefix">$</span>
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        required={required}
        placeholder={placeholder}
      />
    </div>
  );
}
