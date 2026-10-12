import { Icon } from '../../../components/Icon';
import type { RiskAssessment } from '../types';
const levels = ['Low', 'Moderate', 'High', 'Severe', 'No Travel'];
const explanations: Record<RiskAssessment['level'], string> = {
  low: 'All entered conditions fall within the lowest risk thresholds.',
  moderate: 'At least one condition reaches the Moderate threshold.',
  high: 'At least one condition reaches the High threshold.',
  severe: 'Weather or a cargo adjustment raises this checkpoint to Severe.',
  no_travel:
    'These inputs meet a No Travel rule. A route containing this segment is excluded from recommendations.',
};
const conditionIcons = { wind: 'wind', rain: 'rain', snow: 'snow' } as const;
export function RiskResult({
  result,
  pending,
}: {
  result: RiskAssessment | null;
  pending: boolean;
}) {
  return (
    <section
      className={`panel result-panel ${result ? `result-${result.level}` : ''}`}
      aria-live="polite"
      aria-atomic="true"
      aria-busy={pending}
    >
      <div className="result-heading">
        <p className="eyebrow">RISK ASSESSMENT</p>
        <span className="assessment-source">
          <span />
          {result
            ? 'Assessment complete'
            : pending
              ? 'Calculating'
              : 'Ready to assess'}
        </span>
      </div>
      <div className="risk-summary">
        <div>
          <span className="tiny-label">OVERALL CHECKPOINT RISK</span>
          <h2>
            {result?.label ?? (pending ? 'Assessing…' : 'Awaiting assessment')}
          </h2>
        </div>
        <span className="result-emblem">
          <Icon name="shield" size={30} />
        </span>
      </div>
      <div
        className="risk-scale"
        aria-label={
          result
            ? `Risk level ${result.score + 1} of 5: ${result.label}`
            : 'Five risk levels'
        }
      >
        {levels.map((level, index) => (
          <div
            key={level}
            className={`scale-step scale-${index} ${result?.score === index ? 'current' : ''}`}
          >
            <span />
            <small>{level}</small>
          </div>
        ))}
      </div>
      <p className="risk-explanation">
        {result
          ? explanations[result.level]
          : 'Choose a sample scenario or assess your own conditions to see the risk breakdown.'}
      </p>
      <dl className="condition-list">
        {Object.entries(conditionIcons).map(([condition, icon]) => (
          <div key={condition}>
            <dt>
              <Icon name={icon} size={17} />
              {condition}
            </dt>
            <dd
              className={
                result
                  ? `condition-${result.conditions[condition as keyof typeof conditionIcons].toLowerCase().replace(' ', '-')}`
                  : ''
              }
            >
              {result?.conditions[condition as keyof typeof conditionIcons] ??
                '—'}
            </dd>
          </div>
        ))}
      </dl>
      <div
        className={`result-note ${result?.load_rule_applied ? 'adjusted' : ''}`}
      >
        <Icon name={result?.load_rule_applied ? 'load' : 'info'} size={16} />
        <span>
          {result?.load_rule_applied
            ? 'Cargo weight increased the wind risk. Load rules are included in this assessment.'
            : 'The highest condition sets the overall risk. Wind includes applicable cargo adjustments.'}
        </span>
      </div>
    </section>
  );
}
