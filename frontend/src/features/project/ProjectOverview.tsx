import { Icon } from '../../components/Icon';

const thresholds = [
  ['Wind · mph', '< 25', '25 – < 35', '35 – < 45', '45 – < 55', '≥ 55'],
  [
    'Rain · in/hr',
    '< 0.10',
    '0.10 – < 0.25',
    '0.25 – < 0.50',
    '0.50 – 1.00',
    '> 1.00',
  ],
  ['Snow · in/hr', '< 0.5', '0.5 – < 1.0', '1.0 – < 2.0', '2.0 – 3.0', '> 3.0'],
];
const milestones = [
  {
    title: 'Risk assessment foundation',
    status: 'Available',
    description:
      'Weather classification, load adjustments, validated API inputs, and distance-weighted route ranking.',
    items: 'Interactive calculator · Core logic tests · API integration',
  },
  {
    title: 'Route discovery & checkpoint sampling',
    status: 'Available',
    description:
      'Origin, destination, and departure inputs. Request up to three distinct route alternatives with checkpoints every 10, 25, or 50 miles.',
    items: 'Geocoding · Route geometry · Arrival-time estimates',
  },
  {
    title: 'Forecasts & route recommendations',
    status: 'Available',
    description:
      'Match checkpoint arrival times to weather forecasts, then rank routes by exposure and travel time.',
    items: 'Forecast integration · Missing-data handling · Route summaries',
  },
  {
    title: 'Map & corridor forecast',
    status: 'Planned',
    description:
      'Explore route geometry, checkpoint risks, and a corridor heatmap with a 0–48 hour forecast timeline.',
    items: 'Interactive map · Weather layers · Forecast caching',
  },
];

export function ProjectOverview({ page }: { page: 'methodology' | 'roadmap' }) {
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            {page === 'methodology'
              ? 'TRANSPARENT BY DESIGN'
              : 'FROM FOUNDATION TO FULL PRODUCT'}
          </p>
          <h1>
            {page === 'methodology'
              ? 'Every risk has a reason.'
              : 'A clear path forward.'}
          </h1>
          <p>
            {page === 'methodology'
              ? 'The assessment rules behind every checkpoint decision.'
              : 'What works today, and what comes next.'}
          </p>
        </div>
      </div>
      {page === 'methodology' ? (
        <>
          <section className="panel rules-panel">
            <div className="panel-heading">
              <span className="section-icon">
                <Icon name="book" />
              </span>
              <div>
                <h2>Weather thresholds</h2>
                <p>The highest adjusted condition determines overall risk.</p>
              </div>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    {[
                      'Condition',
                      'Low',
                      'Moderate',
                      'High',
                      'Severe',
                      'No Travel',
                    ].map((label) => (
                      <th key={label}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {thresholds.map((row) => (
                    <tr key={row[0]}>
                      {row.map((cell, index) =>
                        index === 0 ? (
                          <th scope="row" key={cell}>
                            {cell}
                          </th>
                        ) : (
                          <td key={cell}>{cell}</td>
                        ),
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="table-note">
              At overlapping rain and snow boundaries, the higher level applies.
              No Travel remains strictly above 1.00 in/hr of rain or 3.0 in/hr
              of snow.
            </p>
          </section>
          <div className="method-grid">
            <section className="panel">
              <h2>When cargo changes the risk</h2>
              <ul className="rule-list">
                <li>
                  <strong>55 mph or higher</strong>
                  <span>No Travel, regardless of load.</span>
                </li>
                <li>
                  <strong>45–&lt;55 mph + over 30,000 lb</strong>
                  <span>Wind risk increases to No Travel.</span>
                </li>
                <li>
                  <strong>35–&lt;45 mph + over 40,000 lb</strong>
                  <span>Wind risk increases to Severe.</span>
                </li>
              </ul>
            </section>
            <section className="panel">
              <h2>How routes are ranked</h2>
              <p>
                Exclude any route with a No Travel segment, then compare in this
                order:
              </p>
              <ol className="ranking-list">
                <li>Fewest Severe miles</li>
                <li>Fewest High miles</li>
                <li>Lowest distance-weighted average risk</li>
                <li>Shortest travel time</li>
              </ol>
              <span className="footnote">
                Live routes with incomplete forecasts are excluded. Travel
                estimates do not include truck restrictions or rest breaks.
              </span>
            </section>
          </div>
        </>
      ) : (
        <section className="milestones">
          {milestones.map((milestone, index) => (
            <article className="panel milestone" key={milestone.title}>
              <span
                className={`milestone-number ${milestone.status === 'Available' ? 'complete' : ''}`}
              >
                {milestone.status === 'Available' ? (
                  <Icon name="check" />
                ) : (
                  `0${index + 1}`
                )}
              </span>
              <div>
                <span
                  className={`status-tag ${milestone.status === 'Available' ? 'available' : ''}`}
                >
                  {milestone.status}
                </span>
                <h2>{milestone.title}</h2>
                <p>{milestone.description}</p>
                <span className="footnote">{milestone.items}</span>
              </div>
            </article>
          ))}
        </section>
      )}
    </>
  );
}
