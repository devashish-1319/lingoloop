export const capitalize = (str) => (str ? str.charAt(0).toUpperCase() + str.slice(1) : "");

// API errors carry { message }; network errors have no response at all
export const getErrorMessage = (error, fallback = "Something went wrong") =>
  error?.response?.data?.message || fallback;
