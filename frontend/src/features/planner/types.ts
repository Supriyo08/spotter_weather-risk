import type { RiskAssessment, RiskInput } from '../risk/types';
export interface Location {
  name: string;
  latitude: number;
  longitude: number;
}
export interface TripInput {
  origin: Location;
  destination: Location;
  departure: string;
  load_weight_lb: number;
  spacing_miles: number;
}
export interface Checkpoint {
  latitude: number;
  longitude: number;
  distance_miles: number;
  eta: string;
  weather: Omit<RiskInput, 'load_weight_lb'> | null;
  forecast_time: string | null;
  risk: RiskAssessment['level'] | 'unavailable';
  risk_label: string;
  load_rule_applied: boolean;
  unavailable_reason: string | null;
}
export interface PlannedRoute {
  id: string;
  name: string;
  distance_miles: number;
  duration_minutes: number;
  arrival: string;
  geometry: [number, number][];
  checkpoints: Checkpoint[];
  weather_complete: boolean;
  has_no_travel: boolean;
  summary: {
    severe_miles: number;
    high_miles: number;
    average_risk: number;
  } | null;
}
export interface TripPlan extends TripInput {
  routes: PlannedRoute[];
  recommended_route_id: string | null;
  warnings: string[];
  generated_at: string;
}
