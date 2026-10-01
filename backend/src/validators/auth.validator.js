import { z } from "zod";

const required = (max) => z.string().trim().min(1, "All fields are required").max(max, `Must be at most ${max} characters`);

export const signupSchema = z.object({
  fullName: required(60),
  email: z.string().trim().toLowerCase().email("Invalid email format"),
  // bcrypt only uses the first 72 bytes
  password: z.string().min(6, "Password must be at least 6 characters").max(72, "Password is too long"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "All fields are required"),
  password: z.string().min(1, "All fields are required"),
});

// unknown keys (friends, email, password, isOnboarded, ...) are stripped, so only these can be set
export const onboardingSchema = z.object({
  fullName: required(60),
  bio: required(500),
  nativeLanguage: required(40),
  learningLanguage: required(40),
  location: required(100),
  profilePic: z
    .string()
    .trim()
    .max(500)
    .regex(/^https?:\/\//, "Profile picture must be an http(s) URL")
    .optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "All fields are required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters").max(72, "Password is too long"),
});
