import { ApiError } from "../utils/ApiError.js";

const valueAt = (obj, path) => path.reduce((acc, key) => (acc == null ? acc : acc[key]), obj);

// Validates (and strips unknown keys from) req[source] with a zod schema.
export const validate =
  (schema, source = "body") =>
  (req, res, next) => {
    const result = schema.safeParse(req[source] ?? {});
    if (result.success) {
      req[source] = result.data;
      return next();
    }

    const issue = result.error.issues[0];
    const missing = issue.code === "invalid_type" && valueAt(req[source], issue.path) === undefined;
    const message = missing
      ? "All fields are required"
      : issue.code === "invalid_type"
        ? "Invalid field types"
        : issue.message;
    next(new ApiError(400, message));
  };
