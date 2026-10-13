import { useState } from 'react';
import { Icon } from '../../../components/Icon';
import type { TripPlan } from '../types';

const number = (value: number) =>
  value.toLocaleString(undefined, { maximumFractionDigits: 1 });
const time = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
function duration(minutes: number) {
  const rounded = Math.round(minutes);
  return `${Math.floor(rounded / 60)}h ${rounded % 60}m`;
}

export function RouteResults({ plan }: { plan: TripPlan }) {
  const [selectedId, setSelectedId] = useState(
    plan.recommended_route_id ?? plan.routes[0].id,
  );
  const selected = plan.routes.find((route) => route.id === selectedId)!;
  const recommendation = plan.routes.find(
    (route) => route.id === plan.recommended_route_id,
  );
  return (
    <section className="trip-results" aria-label="Route comparison">
      <div
        className={`recommendation-banner ${recommendation ? '' : 'no-recommendation'}`}
      >
        <Icon name="shield" size={25} />
        <div>
          <h2>
            {recommendation
              ? `${recommendation.name} has the lowest assessed risk`
              : 'No route can be recommended'}
          </h2>
          <p>
            {recommendation
              ? 'Compared by Severe miles, High miles, distance-weighted risk, then travel time.'
              : 'All returned routes have No Travel conditions or incomplete forecasts.'}
          </p>
        </div>
        <span>
          {plan.routes.length} route{plan.routes.length > 1 ? 's' : ''}
        </span>
      </div>
      {plan.warnings.map((warning) => (
        <p className="trip-warning" key={warning}>
          <Icon name="info" size={15} />
          {warning}
        </p>
      ))}
      <div className="route-cards">
        {plan.routes.map((route) => (
          <button
            className={`route-card ${selectedId === route.id ? 'selected' : ''}`}
            key={route.id}
            onClick={() => setSelectedId(route.id)}
            aria-pressed={selectedId === route.id}
          >
            <div className="route-card-title">
              <strong>{route.name}</strong>
              <span
                className={`route-status ${route.has_no_travel ? 'blocked' : ''}`}
              >
                {route.id === plan.recommended_route_id
                  ? 'Recommended'
                  : route.has_no_travel
                    ? 'No Travel'
                    : !route.weather_complete
                      ? 'Incomplete forecast'
                      : 'Alternative'}
              </span>
            </div>
            <div className="route-metrics">
              <span>
                <b>{number(route.distance_miles)}</b> miles
              </span>
              <span>
                <b>{duration(route.duration_minutes)}</b> driving
              </span>
            </div>
            <p>Arrival {time(route.arrival)}</p>
            <div className="route-exposure">
              <span>
                Severe{' '}
                <strong>
                  {route.summary
                    ? `${number(route.summary.severe_miles)} mi`
                    : '—'}
                </strong>
              </span>
              <span>
                High{' '}
                <strong>
                  {route.summary
                    ? `${number(route.summary.high_miles)} mi`
                    : '—'}
                </strong>
              </span>
              <span>
                Average{' '}
                <strong>
                  {route.summary
                    ? `${route.summary.average_risk.toFixed(2)} / 4`
                    : '—'}
                </strong>
              </span>
            </div>
            <small>
              {route.checkpoints.length} checkpoints · View breakdown →
            </small>
          </button>
        ))}
      </div>
      <section className="panel checkpoint-panel">
        <div className="checkpoint-heading">
          <div>
            <p className="eyebrow">
              {selected.name.toUpperCase()} / WEATHER AT ARRIVAL
            </p>
            <h2>
              {plan.origin.name} → {plan.destination.name}
            </h2>
            <p>
              Every {plan.spacing_miles} miles, including both endpoints. Times
              shown in {Intl.DateTimeFormat().resolvedOptions().timeZone}.
            </p>
          </div>
        </div>
        <div className="checkpoint-scroll">
          <table>
            <caption className="sr-only">
              Checkpoint forecasts and load-adjusted risk for {selected.name}
            </caption>
            <thead>
              <tr>
                <th scope="col">Checkpoint</th>
                <th scope="col">Mile</th>
                <th scope="col">Arrival</th>
                <th scope="col">Forecast hour ending</th>
                <th scope="col">Wind mph</th>
                <th scope="col">Rain in/hr</th>
                <th scope="col">Snow in/hr</th>
                <th scope="col">Risk</th>
              </tr>
            </thead>
            <tbody>
              {selected.checkpoints.map((point, index) => (
                <tr key={index}>
                  <th scope="row">
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${point.latitude}&mlon=${point.longitude}#map=12/${point.latitude}/${point.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {index === 0
                        ? 'Origin'
                        : index === selected.checkpoints.length - 1
                          ? 'Destination'
                          : `Stop ${index}`}
                    </a>
                  </th>
                  <td>{number(point.distance_miles)}</td>
                  <td>{time(point.eta)}</td>
                  <td>
                    {point.forecast_time
                      ? time(point.forecast_time)
                      : 'Unavailable'}
                  </td>
                  <td>
                    {point.weather ? number(point.weather.wind_mph) : '—'}
                  </td>
                  <td>
                    {point.weather
                      ? point.weather.rain_inches_per_hour.toFixed(3)
                      : '—'}
                  </td>
                  <td>
                    {point.weather
                      ? point.weather.snow_inches_per_hour.toFixed(3)
                      : '—'}
                  </td>
                  <td>
                    <span
                      className={`checkpoint-risk checkpoint-${point.risk}`}
                    >
                      {point.risk_label}
                    </span>
                    {point.load_rule_applied && (
                      <small className="checkpoint-note">Cargo adjusted</small>
                    )}
                    {point.unavailable_reason && (
                      <small className="checkpoint-note">
                        {point.unavailable_reason}
                      </small>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="forecast-note">
          Rain includes showers. Hourly precipitation covers the hour containing
          arrival; wind uses that hour’s ending reading. Each road interval
          takes the higher risk of its two checkpoint samples. Conditions
          between checkpoints may differ.
        </p>
      </section>
      <p className="provider-credit">
        Route data ©{' '}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
        >
          OpenStreetMap contributors
        </a>{' '}
        via{' '}
        <a href="https://project-osrm.org/" target="_blank" rel="noreferrer">
          OSRM
        </a>{' '}
        · Forecasts and city search by{' '}
        <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
          Open-Meteo
        </a>{' '}
        · Assessed {time(plan.generated_at)}
      </p>
    </section>
  );
}
