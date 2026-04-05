/**
 * VAd ELO Engine — K=40
 * Amistoso: 25% impact | Competitivo: 100%
 * Multipliers: 3-0 x1.0 | 3-1 x0.85 | 3-2 x0.70
 * Validator bonus: K*1.2 | Loss to validator: K/2
 */

const K = 40;

export function expectedScore(ratingA, ratingB) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

export function setsMultiplier(winnerSets, loserSets) {
  if (winnerSets === 3 && loserSets === 2) return 0.70;
  if (winnerSets === 3 && loserSets === 1) return 0.85;
  return 1.0; // 3-0 or any other case
}

/**
 * @param {object} params
 * @param {number} params.winnerRating
 * @param {number} params.loserRating
 * @param {number} params.winnerSets  - sets won by winner
 * @param {number} params.loserSets   - sets won by loser
 * @param {'amistoso'|'competitivo'} params.matchType
 * @param {boolean} params.winnerIsValidator
 * @param {boolean} params.loserIsValidator
 * @param {boolean} params.isRetirement
 * @param {number}  params.retirementProgress  - 0..1, fraction of match played
 * @returns {{ winnerDelta: number, loserDelta: number }}
 */
export function calculateEloChange({
  winnerRating,
  loserRating,
  winnerSets = 3,
  loserSets = 0,
  matchType = 'competitivo',
  winnerIsValidator = false,
  loserIsValidator = false,
  isRetirement = false,
  retirementProgress = 1,
}) {
  const expected = expectedScore(winnerRating, loserRating);
  let multiplier = setsMultiplier(winnerSets, loserSets);
  const friendlyFactor = matchType === 'amistoso' ? 0.25 : 1.0;

  // Retirement factor
  if (isRetirement) {
    multiplier *= retirementProgress >= 0.5 ? 1.0 : 0.6;
  }

  // K factor — validator boost
  let kWinner = K;
  let kLoser = K;
  if (loserIsValidator) {
    // Novice beating validator: normal K*1.2
    kWinner = K * 1.2;
    // Standard user losing to validator: K/2
    kLoser = K / 2;
  }
  if (winnerIsValidator) {
    // Validator beating standard: normal
    kWinner = K;
    kLoser = K;
  }

  const winnerDelta = Math.round(kWinner * (1 - expected) * multiplier * friendlyFactor);
  const loserDelta = -Math.round(kLoser * expected * multiplier * friendlyFactor);

  return { winnerDelta, loserDelta };
}

/**
 * Returns the skill level category based on ELO rating.
 * 0-1000: principiante (4ta Fuerza)
 * 1001-1300: intermedio (3ra Fuerza)
 * 1301-1500: avanzado (2da Fuerza)
 * 1501+: profesional (1ra Fuerza)
 */
export function getSkillLevelByElo(elo) {
  if (elo >= 1501) return 'profesional';
  if (elo >= 1301) return 'avanzado';
  if (elo >= 1001) return 'intermedio';
  return 'principiante';
}

export const SKILL_LEVEL_LABELS = {
  principiante: '4ta Fuerza',
  intermedio: '3ra Fuerza',
  avanzado: '2da Fuerza',
  profesional: '1ra Fuerza',
};