export function computeEngagementRate(
  followerCount: number,
  avgLikes: number,
  avgComments: number,
): number {
  if (followerCount <= 0) {
    throw new Error('followerCount must be positive')
  }
  const rate = ((avgLikes + avgComments) / followerCount) * 100
  return Math.round(rate * 100) / 100
}
