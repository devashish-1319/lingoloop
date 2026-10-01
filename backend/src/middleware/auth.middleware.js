import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const protectRoute = asyncHandler(async (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) throw new ApiError(401, "Unauthorized - No token provided");

  // throws JsonWebTokenError / TokenExpiredError, which the error middleware maps to 401
  const decoded = jwt.verify(token, env.JWT_SECRET_KEY);

  const user = await User.findById(decoded.userId).select("-password");
  if (!user) throw new ApiError(401, "Unauthorized - User not found");

  req.user = user;
  next();
});
