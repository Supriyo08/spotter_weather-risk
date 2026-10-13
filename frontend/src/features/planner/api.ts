import { getJson, postJson } from '../../lib/api';
import type { Location, TripInput, TripPlan } from './types';
export function searchLocations(query: string) {
  return getJson<{ locations: Location[] }>(
    `/locations/?q=${encodeURIComponent(query)}`,
  );
}
export function planTrip(input: TripInput) {
  return postJson<TripPlan>('/trips/plan/', input, 75_000);
}
