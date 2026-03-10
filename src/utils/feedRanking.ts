// feedRanking.ts

export const calculateTimeDecay = (createdAt: number) => {
  const hoursOld = (Date.now() - createdAt) / (1000 * 60 * 60);
  return Math.exp(-0.05 * hoursOld); // decay factor
};

export const calculateTrendingBoost = (post: any) => {
  const reactions = post.likes || 0;
  const comments = post.comments?.length || 0;
  const shares = post.shares || 0;
  const watchTime = post.watchTime || 0;

  return reactions * 2 + comments * 3 + shares * 4 + watchTime * 0.5;
};

export const calculateVerifiedBoost = (post: any) => {
  return post.user?.isVerified ? 20 : 0;
};

export const calculateAIScore = (post: any) => {
  // Placeholder AI logic (can connect ML later)
  const lengthBoost = post.text?.length > 200 ? 5 : 0;
  return lengthBoost;
};

export const calculateFinalScore = (post: any) => {
  const baseScore = post.rankScore || 0;

  const trending = calculateTrendingBoost(post);
  const verified = calculateVerifiedBoost(post);
  const ai = calculateAIScore(post);
  const decay = calculateTimeDecay(post.createdAt);

  return (baseScore + trending + verified + ai) * decay;
};
