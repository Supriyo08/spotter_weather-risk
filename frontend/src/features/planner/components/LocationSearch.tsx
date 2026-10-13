import { useRef, useState } from 'react';
import { searchLocations } from '../api';
import type { Location } from '../types';

export function LocationSearch({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Location | null;
  onChange: (value: Location | null) => void;
}) {
  const [query, setQuery] = useState(value?.name ?? '');
  const [results, setResults] = useState<Location[]>([]);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const revision = useRef(0);
  const id = label.toLowerCase();
  async function search() {
    const current = ++revision.current;
    setPending(true);
    setMessage('');
    setResults([]);
    try {
      const data = await searchLocations(query.trim());
      if (current === revision.current) {
        setResults(data.locations);
        if (!data.locations.length)
          setMessage(
            'No cities found. Try a nearby city or a different spelling.',
          );
      }
    } catch (error) {
      if (current === revision.current)
        setMessage(error instanceof Error ? error.message : 'Search failed.');
    } finally {
      if (current === revision.current) setPending(false);
    }
  }
  return (
    <div className="location-search">
      <label htmlFor={id}>{label}</label>
      <div className="location-input">
        <input
          id={id}
          type="text"
          value={query}
          placeholder="Search a city or town"
          autoComplete="off"
          maxLength={100}
          onChange={(event) => {
            revision.current++;
            setQuery(event.target.value);
            setResults([]);
            setMessage('');
            setPending(false);
            onChange(null);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              if (query.trim().length >= 2 && !pending) void search();
            }
          }}
        />
        <button
          type="button"
          disabled={pending || query.trim().length < 2}
          onClick={() => void search()}
        >
          {pending ? 'Searching…' : 'Search'}
        </button>
      </div>
      {value && <span className="selected-location">✓ {value.name}</span>}
      <div aria-live="polite">
        {message && <p className="search-message">{message}</p>}
      </div>
      {results.length > 0 && (
        <ul className="location-results" aria-label={`${label} search results`}>
          {results.map((location) => (
            <li key={`${location.latitude},${location.longitude}`}>
              <button
                type="button"
                onClick={() => {
                  setQuery(location.name);
                  onChange(location);
                  setResults([]);
                }}
              >
                <strong>{location.name}</strong>
                <span>
                  {location.latitude.toFixed(3)},{' '}
                  {location.longitude.toFixed(3)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
