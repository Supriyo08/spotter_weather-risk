export interface RiskInput {
  wind_mph: number;
  rain_inches_per_hour: number;
  snow_inches_per_hour: number;
  load_weight_lb: number;
}

export interface RiskAssessment {
  level: 'low' | 'moderate' | 'high' | 'severe' | 'no_travel';
  label: string;
  score: number;
  conditions: { wind: string; rain: string; snow: string };
  load_rule_applied: boolean;
}
