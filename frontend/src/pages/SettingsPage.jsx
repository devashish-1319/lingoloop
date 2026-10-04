import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ShuffleIcon } from "lucide-react";
import useAuthUser from "../hooks/useAuthUser";
import { changePassword, getBlockedUsers, unblockUser, updateProfile } from "../lib/api";
import { getErrorMessage } from "../lib/utils";
import { LANGUAGES } from "../constants";
import Avatar from "../components/Avatar";
import { randomAvatarUrl } from "../lib/avatar";

const ProfileForm = ({ authUser }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    fullName: authUser.fullName || "",
    bio: authUser.bio || "",
    nativeLanguage: authUser.nativeLanguage || "",
    learningLanguage: authUser.learningLanguage || "",
    location: authUser.location || "",
    profilePic: authUser.profilePic || "",
  });
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const { mutate, isPending } = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      toast.success("Profile updated");
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const randomAvatar = () => setForm({ ...form, profilePic: randomAvatarUrl() });

  return (
    <form
      className="card bg-base-200 p-6 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        mutate(form);
      }}
    >
      <h2 className="text-xl font-semibold">Profile</h2>

      <div className="flex items-center gap-4">
        <div className="avatar">
          <div className="size-20 rounded-full bg-base-300">
            <Avatar src={form.profilePic} name={form.fullName} alt="Profile preview" />
          </div>
        </div>
        <button type="button" className="btn btn-accent btn-sm" onClick={randomAvatar}>
          <ShuffleIcon className="size-4" aria-hidden="true" /> Random avatar
        </button>
      </div>

      <label className="form-control">
        <span className="label-text mb-1">Full name</span>
        <input className="input input-bordered" value={form.fullName} onChange={set("fullName")} required maxLength={60} />
      </label>
      <label className="form-control">
        <span className="label-text mb-1">Bio</span>
        <textarea className="textarea textarea-bordered h-24" value={form.bio} onChange={set("bio")} required maxLength={500} />
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          ["nativeLanguage", "Native language"],
          ["learningLanguage", "Learning language"],
        ].map(([field, label]) => (
          <label className="form-control" key={field}>
            <span className="label-text mb-1">{label}</span>
            <select className="select select-bordered" value={form[field]} onChange={set(field)} required>
              <option value="">Select</option>
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang.toLowerCase()}>
                  {lang}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <label className="form-control">
        <span className="label-text mb-1">Location</span>
        <input className="input input-bordered" value={form.location} onChange={set("location")} required maxLength={100} />
      </label>

      <button className="btn btn-primary self-start" disabled={isPending}>
        Save profile
      </button>
    </form>
  );
};

const PasswordForm = () => {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "" });

  const { mutate, isPending } = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success("Password updated");
      setForm({ currentPassword: "", newPassword: "" });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <form
      className="card bg-base-200 p-6 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        mutate(form);
      }}
    >
      <h2 className="text-xl font-semibold">Change password</h2>
      <label className="form-control">
        <span className="label-text mb-1">Current password</span>
        <input
          type="password"
          autoComplete="current-password"
          className="input input-bordered"
          value={form.currentPassword}
          onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
          required
        />
      </label>
      <label className="form-control">
        <span className="label-text mb-1">New password (min. 6 characters)</span>
        <input
          type="password"
          autoComplete="new-password"
          className="input input-bordered"
          value={form.newPassword}
          onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
          minLength={6}
          required
        />
      </label>
      <button className="btn btn-primary self-start" disabled={isPending}>
        Update password
      </button>
    </form>
  );
};

const BlockedUsers = () => {
  const queryClient = useQueryClient();
  const { data: blocked = [], isLoading } = useQuery({ queryKey: ["blocked"], queryFn: getBlockedUsers });

  const { mutate } = useMutation({
    mutationFn: unblockUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocked"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <section className="card bg-base-200 p-6 space-y-3" aria-labelledby="blocked-title">
      <h2 id="blocked-title" className="text-xl font-semibold">
        Blocked users
      </h2>
      {isLoading ? (
        <span className="loading loading-spinner" />
      ) : blocked.length === 0 ? (
        <p className="opacity-70 text-sm">You haven&apos;t blocked anyone.</p>
      ) : (
        <ul className="space-y-2">
          {blocked.map((user) => (
            <li key={user._id} className="flex items-center gap-3">
              <div className="avatar">
                <div className="size-9 rounded-full">
                  <Avatar src={user.profilePic} name={user.fullName} />
                </div>
              </div>
              <span className="flex-1">{user.fullName}</span>
              <button className="btn btn-outline btn-sm" onClick={() => mutate(user._id)}>
                Unblock
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

const SettingsPage = () => {
  const { authUser } = useAuthUser();

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
        <ProfileForm authUser={authUser} />
        <PasswordForm />
        <BlockedUsers />
      </div>
    </div>
  );
};

export default SettingsPage;
