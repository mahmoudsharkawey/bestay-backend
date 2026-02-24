export const calculateAverageRating = (reviews) => {
  if (!reviews || reviews.length === 0) return 0;
  const avgRating =
    reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  return parseFloat(avgRating.toFixed(1));
};
