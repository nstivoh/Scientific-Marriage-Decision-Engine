
import { WeightedFactor, AttachmentStyle, RiskFactor } from './types';

export const DOMAINS = [
    { id: "values", label: "Core Values & Life Goals", weight: 0.20 },
    { id: "comm", label: "Emotional Communication & Conflict Resolution", weight: 0.25 },
    { id: "fin", label: "Financial Habits & Risk Alignment", weight: 0.10 },
    { id: "life", label: "Lifestyle & Daily Compatibility", weight: 0.10 },
    { id: "intimacy", label: "Intimacy & Physical Affection", weight: 0.10 },
    { id: "family", label: "Family & Children Vision", weight: 0.15 },
    { id: "growth", label: "Personal Growth & Autonomy Support", weight: 0.10 }
];

export const ATTACH_MATRIX: Record<AttachmentStyle, Record<AttachmentStyle, number>> = {
    secure:       { secure: 10, anxious: 7, avoidant: 6, disorganized: 4 },
    anxious:      { secure: 8,  anxious: 4, avoidant: 2, disorganized: 3 },
    avoidant:     { secure: 7,  anxious: 3, avoidant: 5, disorganized: 3 },
    disorganized: { secure: 5,  anxious: 3, avoidant: 3, disorganized: 2 }
};

export const RISK_FACTORS: RiskFactor[] = [
    { id: 'age', text: 'Significant age gap (>15 years)', level: 'amber', weight: -6, active: false },
    { id: 'substance', text: 'Known history of substance abuse', level: 'red', weight: -18, active: false },
    { id: 'aggression', text: 'History of verbal/physical aggression', level: 'red', weight: -25, active: false },
    { id: 'values_clash', text: 'Major disagreement on kids/religion/location', level: 'amber', weight: -10, active: false }
];

export const DARWIN_QUOTES = {
  marry: "Children (if it Please God), constant companion (and friend in old age) who will feel interested in one, object to be beloved and played with — better than a dog anyhow.",
  notMarry: "Freedom to go where one liked, choice of Society and little of it. Conversation of clever men in clubs. Not forced to visit relatives, and to bend in every trifle."
};

export const INITIAL_WHETHER_FACTORS: WeightedFactor[] = [
  { id: 'children', label: 'Children & Legacy', weight: 8, score: 0 },
  { id: 'companionship', label: 'Constant Companion', weight: 9, score: 0 },
  { id: 'freedom', label: 'Personal Freedom', weight: 7, score: 0 },
  { id: 'finances', label: 'Financial Stability', weight: 5, score: 0 },
  { id: 'intellect', label: 'Intellectual Growth', weight: 6, score: 0 },
  { id: 'conversation', label: 'Social Conversation', weight: 4, score: 0 },
];
