"use client";

import { FormEvent, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { fileToAvatarDataUrl, initialsFromName } from "@/lib/avatar";

type SessionUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
};

export function AccountProfile({
  user,
  onUpdated,
}: {
  user: SessionUser;
  onUpdated: () => void | Promise<void>;
}) {
  const router = useRouter();
  const fileInputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);

  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [previewOverride, setPreviewOverride] = useState<
    string | null | undefined
  >(undefined);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const displayName = nameDraft ?? user.name ?? "";
  const preview =
    previewOverride !== undefined ? previewOverride : user.image || null;

  async function saveName(e: FormEvent) {
    e.preventDefault();
    const next = displayName.trim();
    if (!next) {
      setError("Name cannot be empty.");
      return;
    }
    if (next === user.name) {
      setNameDraft(null);
      setInfo("Name is already up to date.");
      return;
    }
    setBusy("name");
    setError(null);
    setInfo(null);
    try {
      const { error: err } = await authClient.updateUser({ name: next });
      if (err) throw new Error(err.message || "Could not update name");
      setNameDraft(null);
      setInfo("Name updated.");
      await onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update name");
    } finally {
      setBusy(null);
    }
  }

  async function onPickImage(file: File | null) {
    if (!file) return;
    setBusy("avatar");
    setError(null);
    setInfo(null);
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      setPreviewOverride(dataUrl);
      const { error: err } = await authClient.updateUser({ image: dataUrl });
      if (err) throw new Error(err.message || "Could not update picture");
      setPreviewOverride(undefined);
      setInfo("Profile picture updated.");
      await onUpdated();
    } catch (err) {
      setPreviewOverride(undefined);
      setError(err instanceof Error ? err.message : "Could not update picture");
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removePicture() {
    setBusy("avatar");
    setError(null);
    setInfo(null);
    try {
      const { error: err } = await authClient.updateUser({ image: null });
      if (err) throw new Error(err.message || "Could not remove picture");
      setPreviewOverride(null);
      setInfo("Profile picture removed.");
      await onUpdated();
      setPreviewOverride(undefined);
    } catch (err) {
      setPreviewOverride(undefined);
      setError(err instanceof Error ? err.message : "Could not remove picture");
    } finally {
      setBusy(null);
    }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }
    setBusy("password");
    setError(null);
    setInfo(null);
    try {
      const { error: err } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      if (err) throw new Error(err.message || "Could not change password");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setInfo("Password changed. Other sessions were signed out.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change password");
    } finally {
      setBusy(null);
    }
  }

  async function logout() {
    setBusy("logout");
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = initialsFromName(user.name, user.email);

  return (
    <article className="panel reveal account-profile">
      <h2>Profile</h2>
      <p className="muted account-profile-lede">
        Update how you appear and keep your password current.
      </p>

      {error ? <p className="error">{error}</p> : null}
      {info ? <p className="banner">{info}</p> : null}

      <div className="account-avatar-row">
        <div
          className="account-avatar"
          role={preview ? "img" : undefined}
          aria-label={preview ? "Profile picture" : undefined}
          aria-hidden={preview ? undefined : true}
          style={
            preview
              ? { backgroundImage: `url(${preview})`, backgroundSize: "cover", backgroundPosition: "center" }
              : undefined
          }
        >
          {preview ? null : <span>{initials}</span>}
        </div>
        <div className="account-avatar-actions">
          <label className="btn-ghost account-file-label" htmlFor={fileInputId}>
            {busy === "avatar" ? "Saving…" : "Change picture"}
          </label>
          <input
            id={fileInputId}
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="account-file-input"
            disabled={busy !== null}
            onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
          />
          {preview ? (
            <button
              type="button"
              className="btn-ghost"
              disabled={busy !== null}
              onClick={removePicture}
            >
              Remove
            </button>
          ) : null}
          <p className="muted account-avatar-hint">
            Square crop, saved as a compressed JPEG on your account.
          </p>
        </div>
      </div>

      <form className="account-form" onSubmit={saveName}>
        <label>
          Name
          <input
            value={displayName}
            onChange={(e) => setNameDraft(e.target.value)}
            autoComplete="name"
            disabled={busy !== null}
            required
          />
        </label>
        <label>
          Email
          <input value={user.email} readOnly disabled className="account-readonly" />
        </label>
        <p className="muted account-field-note">
          Email is your sign-in ID and cannot be changed here.
        </p>
        <button
          type="submit"
          className="btn-primary"
          disabled={
            busy !== null || displayName.trim() === (user.name || "").trim()
          }
        >
          {busy === "name" ? "Saving…" : "Save name"}
        </button>
      </form>

      <form className="account-form account-password-form" onSubmit={changePassword}>
        <h3 className="account-subhead">Change password</h3>
        <label>
          Current password
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            disabled={busy !== null}
            required
          />
        </label>
        <label>
          New password
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            disabled={busy !== null}
            required
          />
        </label>
        <label>
          Confirm new password
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            disabled={busy !== null}
            required
          />
        </label>
        <button
          type="submit"
          className="btn-primary"
          disabled={busy !== null || !currentPassword || !newPassword}
        >
          {busy === "password" ? "Updating…" : "Update password"}
        </button>
      </form>

      <div className="account-signout">
        <button
          type="button"
          className="btn-ghost"
          onClick={logout}
          disabled={busy !== null}
        >
          {busy === "logout" ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </article>
  );
}
