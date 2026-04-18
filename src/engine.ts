
import { DOMAINS, ATTACH_MATRIX, RISK_FACTORS } from './constants';
import { DecisionState, CandidateProfile, DomainScore, MonteCarloResult, SensitivityResult } from './types';

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

export function computeDomainScores(state: DecisionState, candidate: CandidateProfile): DomainScore[] {
    return DOMAINS.map(domain => {
        const selfRating = state.selfRatings[domain.id] || 5;
        const partnerRating = candidate.partnerRatings[domain.id] || 5;
        
        let base = 0.4 * selfRating + 0.6 * partnerRating;
        
        if (domain.id === "comm") {
            const modifier = Math.min(2.0, (candidate.interactionRatio / 5.0) - 1.0);
            base += modifier;
            
            const h = candidate.horsemen;
            const gottmanRisk = (h.criticism * 1.2 + h.contempt * 2.5 + h.defensiveness * 1.0 + h.stonewalling * 1.0) / 5.7;
            base -= (gottmanRisk / 10);
        }

        return {
            domain: domain.label,
            score: clamp(base * 10, 0, 100),
            weight: domain.weight
        };
    });
}

export function computeWeightedCompatibility(domainScores: DomainScore[], state: DecisionState, candidate: CandidateProfile): number {
    const baseCompatibility = domainScores.reduce((acc, d) => acc + (d.score * d.weight), 0);
    
    // Attachment Adjustment
    const attachMultiplier = ATTACH_MATRIX[state.myAttachment][candidate.partnerAttachment] / 10;
    
    // Risk Factor Penalties
    const riskPenalty = RISK_FACTORS
        .filter(r => candidate.activeRisks.includes(r.id))
        .reduce((acc, r) => acc + r.weight, 0);

    return clamp(baseCompatibility * attachMultiplier + riskPenalty, 0, 100);
}

export function runMonteCarlo(state: DecisionState, candidate: CandidateProfile, nSimulations = 2000): MonteCarloResult {
    const domainScores = computeDomainScores(state, candidate);
    const simulated: number[] = [];

    for (let i = 0; i < nSimulations; i++) {
        const perturbedScores: DomainScore[] = domainScores.map(d => {
            const noise = (Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() - 3) * 1.2;
            return { ...d, score: clamp(d.score + noise * 10, 0, 100) };
        });
        simulated.push(computeWeightedCompatibility(perturbedScores, state, candidate));
    }
    
    simulated.sort((a, b) => a - b);
    
    return {
        mean: simulated.reduce((a, b) => a + b, 0) / nSimulations,
        ciLower: simulated[Math.floor(nSimulations * 0.025)],
        ciUpper: simulated[Math.floor(nSimulations * 0.975)],
        width: simulated[Math.floor(nSimulations * 0.975)] - simulated[Math.floor(nSimulations * 0.025)]
    };
}

export function runSensitivity(state: DecisionState, candidate: CandidateProfile): SensitivityResult[] {
    const domainScores = computeDomainScores(state, candidate);
    const base = computeWeightedCompatibility(domainScores, state, candidate);
    
    return DOMAINS.map((domain, i) => {
        const testWeights = DOMAINS.map(d => d.weight);
        testWeights[i] *= 1.2;
        const total = testWeights.reduce((a, b) => a + b, 0);
        const normalizedWeights = testWeights.map(w => w / total);
        
        const newScore = domainScores.reduce((acc, d, idx) => acc + (d.score * normalizedWeights[idx]), 0);
        
        return {
            domain: domain.label,
            impact: newScore - base
        };
    });
}
