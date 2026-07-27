import React, { useState, useEffect } from 'react';

export default function SuburbAutocomplete({ suburbs, value, onChange, excludeIds = [], placeholder = 'Type a suburb…', disabled, required }) {
  const selected = suburbs.find(s => s.id === Number(value));
  const [query, setQuery] = useState(selected?.name || '');
  const [open, setOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!isTyping) setQuery(selected?.name || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const excluded = new Set(excludeIds.filter(Boolean).map(Number));
  const pool = suburbs.filter(s => !excluded.has(s.id));
  const filtered = (isTyping ? pool.filter(s => s.name.toLowerCase().includes(query.toLowerCase())) : pool).slice(0, 50);

  function handleSelect(s) {
    onChange(s.id);
    setQuery(s.name);
    setIsTyping(false);
    setOpen(false);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && filtered.length) {
      e.preventDefault();
      handleSelect(filtered[0]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  function handleBlur() {
    // delay so a click on an option registers before we close/revert
    setTimeout(() => {
      setOpen(false);
      setIsTyping(false);
      setQuery(selected?.name || '');
    }, 150);
  }

  return (
    <div className="suburb-autocomplete">
      <input
        type="text"
        value={query}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onChange={(e) => { setQuery(e.target.value); setIsTyping(true); setOpen(true); }}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
      />
      {open && !disabled && (
        <div className="suburb-autocomplete-list">
          {filtered.length
            ? filtered.map(s => (
              <div key={s.id} className="suburb-autocomplete-option" onMouseDown={(e) => e.preventDefault()} onClick={() => handleSelect(s)}>
                {s.name}
              </div>
            ))
            : <div className="suburb-autocomplete-empty">No suburbs match</div>}
        </div>
      )}
    </div>
  );
}
