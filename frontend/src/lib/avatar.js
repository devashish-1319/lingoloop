// Free avatar generator (DiceBear). The previous provider, avatar.iran.liara.run, went offline.
export const randomAvatarUrl = () =>
  `https://api.dicebear.com/9.x/avataaars/png?size=256&seed=${Math.random().toString(36).slice(2, 12)}`;
