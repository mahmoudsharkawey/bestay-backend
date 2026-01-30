const ResponseMessage = {
  SUCCESS: "Operation has been successful.",
  SOMETHING_WENT_WRONG: "Something went wrong.",
  NOT_FOUND: (entity) => {
    return `${entity} not found.`;
  },
  INTERNAL_SERVER_ERROR: "Internal server error.",
  BAD_REQUEST: "Bad request.",
  UNAUTHORIZED: "Unauthorized access.",
  FORBIDDEN: "Forbidden access.",
};

export default ResponseMessage;
