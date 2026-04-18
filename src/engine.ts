
import { DOMAINS, ATTACH_MATRIX, RISK_FACTORS } from './constants';
import { DecisionState, DomainScore, MonteCarloResult, SensitivityResult } from './types';

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

export function computeDomainScores(state: DecisionState): DomainScore[] {
    return DOMAINS.map(domain => {
        const selfRating = state.selfRatings[domain.id] || 5;
        const partnerRating = state.partnerRatings[domain.id] || 5;
        
        // Weighted blend: 40% self, 60% partner
        let base = 0.4 * selfRating + 0.6 * partnerRating;
        
        // Gottman interaction modifier for communication domain
        if (domain.id === "comm") {
            // 5:1 ratio maps to ~0-10 adjustment
            // (ratio / 5.0) - 1.0 means at 5:1 we add 0, at 10:1 we add 1.0, at 0:1 we subtract 1.0
            const modifier = Math.min(2.0, (state.interactionRatio / 5.0) - 1.0);
            base += modifier;
            
            // Four Horsemen penalty
            const h = state.horsemen;
            const gottmanRisk = (h.criticism * 1.2 + h.contempt * 2.5 + h.defensiveness * 1.0 + h.stonewalling * 1.0) / 5.7;
            base -= (gottmanRisk / 10); // Subtle but real penalty to base 10 scale
        }

        return {
            domain: domain.label,
            score: clamp(base * 10, 0, 100),
            weight: domain.weight
        };
    });
}

export function computeWeightedCompatibility(domainScores: DomainScore[], state: DecisionState): number {
    const baseCompatibility = domainScores.reduce((acc, d) => acc + (d.score * d.weight), 0);
    
    // Attachment Adjustment
    const attachMultiplier = ATTACH_MATRIX[state.myAttachment][state.partnerAttachment] / 10;
    
    // Risk Factor Penalties
    const riskPenalty = RISK_FACTORS
        .filter(r => state.activeRisks.includes(r.id))
        .reduce((acc, r) => acc + r.weight, 0);

    return clamp(baseCompatibility * attachMultiplier + riskPenalty, 0, 100);
}

export function runMonteCarlo(state: DecisionState, nSimulations = 2000): MonteCarloResult {
    const domainScores = computeDomainScores(state);
    const simulated: number[] = [];

    for (let i = 0; i < nSimulations; i++) {
        const perturbedScores: DomainScore[] = domainScores.map(d => {
            // Normal distribution approximation: Sum of uniform
            const noise = (Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() - 3) * 1.2;
            return { ...d, score: clamp(d.score + noise * 10, 0, 100) };
        });
        simulated.push(computeWeightedCompatibility(perturbedScores, state));
    }
    
    simulated.sort((a, b) => a - b);
    
    return {
        mean: simulated.reduce((a, b) => a + b, 0) / nSimulations,
        ciLower: simulated[Math.floor(nSimulations * 0.025)],
        ciUpper: simulated[Math.floor(nSimulations * 0.975)],
        width: simulated[Math.floor(nSimulations * 0.975)] - simulated[Math.floor(nSimulations * 0.025)]
    };
}

export function runSensitivity(state: DecisionState): SensitivityResult[] {
    const domainScores = computeDomainScores(state);
    const base = computeWeightedCompatibility(domainScores, state);
    
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
