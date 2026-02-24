export const validateFutureDate = (dateString, hoursAhead = 1) => {
  const dateObj = new Date(dateString);

  if (isNaN(dateObj.getTime())) {
    const error = new Error("Invalid date format");
    error.statusCode = 400;
    throw error;
  }

  const minimumDate = new Date(Date.now() + hoursAhead * 60 * 60 * 1000);

  if (dateObj < minimumDate) {
    const error = new Error(
      `Proposed date must be at least ${hoursAhead} hour(s) in the future`,
    );
    error.statusCode = 400;
    throw error;
  }

  return dateObj;
};
