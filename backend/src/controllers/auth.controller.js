import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { env, isProduction } from "../config/env.js";
import { trySyncStreamUser } from "../lib/stream.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const COOKIE_OPTIONS = {
  httpOnly: true, // prevent XSS attacks
  sameSite: "strict", // prevent CSRF attacks
  secure: isProduction,
};

function setAuthCookie(res, userId) {
  const token = jwt.sign({ userId }, env.JWT_SECRET_KEY, { expiresIn: "7d" });
  res.cookie("jwt", token, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

export const signup = asyncHandler(async (req, res) => {
  const { email, password, fullName } = req.body;

  if (await User.exists({ email })) {
    throw new ApiError(400, "Email already exists, please use a diffrent one");
  }

  const idx = Math.floor(Math.random() * 100) + 1; // generate a num between 1-100
  const newUser = await User.create({
    email,
    fullName,
    password,
    profilePic: `https://avatar.iran.liara.run/public/${idx}.png`,
  });

  await trySyncStreamUser(newUser);
  setAuthCookie(res, newUser._id);

  res.status(201).json({ success: true, user: newUser });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  setAuthCookie(res, user._id);
  res.status(200).json({ success: true, user });
});

export function logout(req, res) {
  res.clearCookie("jwt", COOKIE_OPTIONS);
  res.status(200).json({ success: true, message: "Logout successful" });
}

export const onboard = asyncHandler(async (req, res) => {
  // req.body was stripped to the onboarding fields by the validator
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { ...req.body, isOnboarded: true },
    { new: true, runValidators: true }
  );
  if (!updatedUser) throw new ApiError(404, "User not found");

  await trySyncStreamUser(updatedUser);

  res.status(200).json({ success: true, user: updatedUser });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // req.user was loaded without the password hash
  const user = await User.findById(req.user._id);
  if (!(await user.matchPassword(currentPassword))) {
    throw new ApiError(400, "Current password is incorrect");
  }
  if (currentPassword === newPassword) {
    throw new ApiError(400, "New password must be different");
  }

  user.password = newPassword; // hashed by the pre-save hook
  await user.save();

  res.status(200).json({ success: true, message: "Password updated" });
});
