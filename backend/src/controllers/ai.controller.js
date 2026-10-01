import User from "../models/User.js";
import * as ai from "../services/ai.service.js";
import { assertFriend } from "../services/call.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const translate = asyncHandler(async (req, res) => {
  // default: translate into the language the user already speaks
  const target = req.body.targetLanguage || req.user.nativeLanguage || "English";
  res.status(200).json({ translation: await ai.translate(req.body.text, target), targetLanguage: target });
});

export const suggestTopics = asyncHandler(async (req, res) => {
  let partner;
  if (req.body.friendId) {
    assertFriend(req.user, req.body.friendId);
    partner = await User.findById(req.body.friendId).select("fullName bio nativeLanguage learningLanguage");
  }

  const topics = await ai.suggestTopics({
    myLearning: req.user.learningLanguage || "English",
    myNative: req.user.nativeLanguage || "English",
    partner,
  });
  res.status(200).json({ topics });
});
