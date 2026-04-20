export function getSkillValidationPercentage(score: number, maxScore = 100) {
  if (!Number.isFinite(score) || !Number.isFinite(maxScore) || maxScore <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((score / maxScore) * 100)));
}

export function getSkillValidationTone(score: number) {
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));

  if (normalizedScore >= 90) return "green";
  if (normalizedScore >= 70) return "yellow";
  if (normalizedScore >= 50) return "orange";
  return "red";
}

export function getSkillValidationBadgeClasses(score: number) {
  switch (getSkillValidationTone(score)) {
    case "green":
      return "border-emerald-500/35 bg-emerald-500/10 text-emerald-300";
    case "yellow":
      return "border-amber-500/35 bg-amber-500/10 text-amber-300";
    case "orange":
      return "border-orange-500/35 bg-orange-500/10 text-orange-300";
    default:
      return "border-red-500/35 bg-red-500/10 text-red-300";
  }
}

export function getSkillValidationBarClasses(score: number) {
  switch (getSkillValidationTone(score)) {
    case "green":
      return "bg-emerald-400";
    case "yellow":
      return "bg-amber-400";
    case "orange":
      return "bg-orange-400";
    default:
      return "bg-red-400";
  }
}
