import { postJson } from '../../lib/api';
import type { RiskAssessment, RiskInput } from './types';

export function evaluateRisk(input: RiskInput): Promise<RiskAssessment> {
  return postJson<RiskAssessment>('/risk/evaluate/', input);
}
