import React from 'react';

export default function CheckboxGroup({ options, values, onChange }) {
  function toggle(option) {
    onChange(values.includes(option) ? values.filter(v => v !== option) : [...values, option]);
  }

  return (
    <div className="checkbox-group">
      {options.map(option => (
        <label key={option} className="checkbox-pill">
          <input type="checkbox" checked={values.includes(option)} onChange={() => toggle(option)} />
          {option}
        </label>
      ))}
    </div>
  );
}
