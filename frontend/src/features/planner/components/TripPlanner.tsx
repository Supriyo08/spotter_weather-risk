import { useState } from 'react';
import type { FormEvent } from 'react';
import { Icon } from '../../../components/Icon';
import { ApiError } from '../../../lib/api';
import { planTrip } from '../api';
import type { Location, TripPlan } from '../types';
import { LocationSearch } from './LocationSearch';
import { RouteResults } from './RouteResults';

function initialDeparture() {
  const date = new Date(Date.now() + 3600_000);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

export function TripPlanner() {
  const [origin, setOrigin] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [departure, setDeparture] = useState(initialDeparture);
  const [load, setLoad] = useState('30000');
  const [spacing, setSpacing] = useState(25);
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  function clearResult() {
    setPlan(null);
    setError(null);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!origin || !destination) {
      setError(new ApiError('Search and select both cities before planning.'));
      return;
    }
    setPending(true);
    setError(null);
    setPlan(null);
    try {
      setPlan(
        await planTrip({
          origin,
          destination,
          departure: new Date(departure).toISOString(),
          load_weight_lb: Number(load),
          spacing_miles: spacing,
        }),
      );
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause
          : new ApiError('Unable to plan this trip. Please check the inputs.'),
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR ROUTE. THE WEATHER AHEAD.</p>
          <h1>
            Plan with a clearer outlook<span>.</span>
          </h1>
          <p>
            Compare road routes using the forecast at each checkpoint’s
            estimated arrival.
          </p>
        </div>
        <span className="version-tag">LIVE PROVIDERS / V0.2</span>
      </div>
      <section className="panel trip-form-panel">
        <div className="panel-heading">
          <span className="section-icon">
            <Icon name="route" />
          </span>
          <div>
            <h2>Build your trip</h2>
            <p>
              Search for cities, choose your departure, and compare the weather
              along the way.
            </p>
          </div>
        </div>
        <form onSubmit={submit}>
          <fieldset disabled={pending}>
            <legend className="sr-only">Trip details</legend>
            <div className="trip-locations">
              <LocationSearch
                label="Origin"
                value={origin}
                onChange={(value) => {
                  setOrigin(value);
                  clearResult();
                }}
              />
              <LocationSearch
                label="Destination"
                value={destination}
                onChange={(value) => {
                  setDestination(value);
                  clearResult();
                }}
              />
            </div>
            <div className="trip-options">
              <div>
                <label htmlFor="departure">
                  Departure · {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </label>
                <input
                  id="departure"
                  type="datetime-local"
                  required
                  value={departure}
                  onChange={(event) => {
                    setDeparture(event.target.value);
                    clearResult();
                  }}
                />
                <small>
                  Now through the next six days. Arrival forecasts may end
                  earlier.
                </small>
              </div>
              <div>
                <label htmlFor="trip-load">Cargo weight · lb</label>
                <input
                  id="trip-load"
                  type="number"
                  min="0"
                  max="1000000"
                  step="any"
                  required
                  value={load}
                  onChange={(event) => {
                    setLoad(event.target.value);
                    clearResult();
                  }}
                />
              </div>
              <div>
                <label htmlFor="spacing">Checkpoint spacing</label>
                <select
                  id="spacing"
                  value={spacing}
                  onChange={(event) => {
                    setSpacing(Number(event.target.value));
                    clearResult();
                  }}
                >
                  {[10, 25, 50].map((value) => (
                    <option value={value} key={value}>
                      Every {value} miles
                    </option>
                  ))}
                </select>
                <small>Closer samples capture more local variation.</small>
              </div>
            </div>
            <button className="primary-button plan-button" type="submit">
              <Icon name="route" size={18} />
              {pending
                ? 'Finding routes and checking forecasts…'
                : 'Compare routes'}
              <Icon name="arrow" size={18} />
            </button>
          </fieldset>
        </form>
        {error && (
          <div role="alert" className="error-banner">
            <p>{error.message}</p>
            {Object.entries(error.fields).map(([field, messages]) => (
              <p key={field}>
                {field.replaceAll('_', ' ')}: {messages.join(' ')}
              </p>
            ))}
          </div>
        )}
        <div className="trip-limit">
          <Icon name="info" size={16} />
          <p>
            Road-driving estimates only: truck height, weight restrictions,
            traffic, and rest breaks are not included. Up to three alternatives;
            availability depends on the road network.
          </p>
        </div>
      </section>
      {pending && (
        <div className="planning-progress" role="status">
          <span className="loading-dot" />
          <div>
            <strong>Looking ahead along your route</strong>
            <p>
              Finding alternatives, calculating checkpoint ETAs, and fetching
              hourly weather. This can take up to a minute.
            </p>
          </div>
        </div>
      )}
      {plan ? (
        <RouteResults plan={plan} />
      ) : (
        !pending && (
          <section className="planner-empty">
            <Icon name="route" size={32} />
            <h2>A better-informed journey starts here.</h2>
            <p>
              Try Chicago to Indianapolis, or two cities near you. Select a
              search result for each city, then compare routes.
            </p>
            <div>
              <span>01 · Find road routes</span>
              <span>02 · Forecast at arrival</span>
              <span>03 · Compare exposure</span>
            </div>
          </section>
        )
      )}
    </>
  );
}
