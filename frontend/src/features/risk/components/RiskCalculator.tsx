import { useState } from 'react';
import type { FormEvent } from 'react';
import { Icon } from '../../../components/Icon';
import { ApiError } from '../../../lib/api';
import { evaluateRisk } from '../api';
import type { RiskAssessment, RiskInput } from '../types';
import { RiskResult } from './RiskResult';

const fields = [
  {
    name: 'wind_mph',
    label: 'Wind speed',
    unit: 'mph',
    max: 500,
    icon: 'wind',
    hint: 'Sustained wind at the checkpoint',
  },
  {
    name: 'rain_inches_per_hour',
    label: 'Rainfall',
    unit: 'in/hr',
    max: 100,
    icon: 'rain',
    hint: 'Hourly rainfall intensity',
  },
  {
    name: 'snow_inches_per_hour',
    label: 'Snowfall',
    unit: 'in/hr',
    max: 100,
    icon: 'snow',
    hint: 'Hourly snowfall intensity',
  },
  {
    name: 'load_weight_lb',
    label: 'Cargo weight',
    unit: 'lb',
    max: 1000000,
    icon: 'load',
    hint: 'Load carried by the truck',
  },
] as const;
const scenarios = [
  {
    label: 'Clear conditions',
    description: 'Light wind, dry roads',
    values: {
      wind_mph: 12,
      rain_inches_per_hour: 0,
      snow_inches_per_hour: 0,
      load_weight_lb: 20000,
    },
  },
  {
    label: 'Heavy load + wind',
    description: 'Cargo raises the risk',
    values: {
      wind_mph: 38,
      rain_inches_per_hour: 0.08,
      snow_inches_per_hour: 0,
      load_weight_lb: 42000,
    },
  },
  {
    label: 'Severe weather',
    description: 'No Travel threshold',
    values: {
      wind_mph: 56,
      rain_inches_per_hour: 0.6,
      snow_inches_per_hour: 0,
      load_weight_lb: 30000,
    },
  },
];
type FormValues = Record<keyof RiskInput, string>;
function formValues(input: RiskInput): FormValues {
  return {
    wind_mph: String(input.wind_mph),
    rain_inches_per_hour: String(input.rain_inches_per_hour),
    snow_inches_per_hour: String(input.snow_inches_per_hour),
    load_weight_lb: String(input.load_weight_lb),
  };
}
export function RiskCalculator() {
  const [values, setValues] = useState(() => formValues(scenarios[0].values));
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<RiskAssessment | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [pending, setPending] = useState(false);
  async function assess(input: RiskInput) {
    setPending(true);
    setError(null);
    setResult(null);
    try {
      setResult(await evaluateRisk(input));
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause
          : new ApiError('Something went wrong. Please try again.'),
      );
    } finally {
      setPending(false);
    }
  }
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void assess({
      wind_mph: Number(values.wind_mph),
      rain_inches_per_hour: Number(values.rain_inches_per_hour),
      snow_inches_per_hour: Number(values.snow_inches_per_hour),
      load_weight_lb: Number(values.load_weight_lb),
    });
  }
  function reset() {
    setValues(formValues(scenarios[0].values));
    setSelected(null);
    setResult(null);
    setError(null);
  }
  return (
    <>
      <section className="scenario-section" aria-labelledby="scenario-heading">
        <div className="section-label">
          <h2 id="scenario-heading">Explore a scenario</h2>
          <span>Sample inputs · Evaluated by the risk engine</span>
        </div>
        <div className="scenario-grid">
          {scenarios.map((scenario, index) => (
            <button
              key={scenario.label}
              disabled={pending}
              aria-pressed={selected === scenario.label}
              className={`scenario ${selected === scenario.label ? 'selected' : ''}`}
              onClick={() => {
                setValues(formValues(scenario.values));
                setSelected(scenario.label);
                void assess(scenario.values);
              }}
            >
              <span className={`scenario-dot scenario-dot-${index}`} />
              <span>
                <strong>{scenario.label}</strong>
                <small>{scenario.description}</small>
              </span>
              <Icon name="arrow" size={16} />
            </button>
          ))}
        </div>
      </section>
      <div className="calculator">
        <section className="panel input-panel">
          <div className="panel-heading">
            <span className="section-icon">
              <Icon name="wind" />
            </span>
            <div>
              <h2>Checkpoint conditions</h2>
              <p>Set the weather. Add the load. See the impact.</p>
            </div>
            <span className="small-tag">MANUAL INPUT</span>
          </div>
          <form onSubmit={handleSubmit}>
            <fieldset disabled={pending}>
              <legend className="sr-only">Weather and cargo inputs</legend>
              <div className="field-grid">
                {fields.map((field) => (
                  <div className="field" key={field.name}>
                    <label htmlFor={field.name}>
                      <Icon name={field.icon} size={16} />
                      {field.label}
                    </label>
                    <div className="input-wrap">
                      <input
                        id={field.name}
                        name={field.name}
                        type="number"
                        min="0"
                        max={field.max}
                        step="any"
                        value={values[field.name]}
                        required
                        onChange={(event) => {
                          setValues({
                            ...values,
                            [field.name]: event.target.value,
                          });
                          setResult(null);
                          setSelected(null);
                          setError(null);
                        }}
                        aria-invalid={Boolean(error?.fields[field.name])}
                        aria-describedby={`${field.name}-hint${error?.fields[field.name] ? ` ${field.name}-error` : ''}`}
                      />
                      <span>{field.unit}</span>
                    </div>
                    <small id={`${field.name}-hint`}>{field.hint}</small>
                    {error?.fields[field.name] && (
                      <small className="field-error" id={`${field.name}-error`}>
                        {error.fields[field.name].join(' ')}
                      </small>
                    )}
                  </div>
                ))}
              </div>
              <div className="form-actions">
                <button className="primary-button" type="submit">
                  <Icon name="shield" size={18} />
                  {pending ? 'Assessing conditions…' : 'Assess checkpoint'}
                  <Icon name="arrow" size={17} />
                </button>
                <button className="reset-button" type="button" onClick={reset}>
                  <Icon name="refresh" size={16} />
                  Reset
                </button>
              </div>
            </fieldset>
            {error && (
              <p role="alert" className="field-error error-banner">
                {error.message}
              </p>
            )}
          </form>
          <div className="input-note">
            <Icon name="info" size={15} />
            <span>Use hourly precipitation rates, not daily totals.</span>
          </div>
        </section>
        <RiskResult result={result} pending={pending} />
      </div>
    </>
  );
}
