
export type AttachmentStyle = 'secure' | 'anxious' | 'avoidant' | 'disorganized';

export interface WeightedFactor {
  id: string;
  label: string;
  weight: number; 
  score: number; 
}

export interface DomainScore {
  domain: string;
  score: number;
  weight: number;
}

export interface MonteCarloResult {
  mean: number;
  ciLower: number;
  ciUpper: number;
  width: number;
}

export interface SensitivityResult {
  domain: string;
  impact: number;
}

export interface RiskFactor {
  id: string;
  text: string;
  level: 'amber' | 'red';
  weight: number;
  active: boolean;
}

export interface CandidateProfile {
  id: string;
  name: string;
  partnerRatings: Record<string, number>;
  interactionRatio: number;
  partnerAttachment: AttachmentStyle;
  horsemen: {
    criticism: number;
    contempt: number;
    defensiveness: number;
    stonewalling: number;
  };
  activeRisks: string[];
}

export interface DecisionState {
  whetherFactors: WeightedFactor[];
  readinessFactors: WeightedFactor[];
  
  selfRatings: Record<string, number>;
  myAttachment: AttachmentStyle;
  
  candidates: CandidateProfile[];
  activeCandidateId: string;
}
