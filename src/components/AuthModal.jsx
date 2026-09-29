import React, { useState, useEffect, useRef } from "react";
import { X, Eye, EyeOff, User, Mail, Lock, LogIn, UserPlus, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "../context/useAuth";
import { PRESET_AVATARS, PRESET_AVATAR_NAMES, accountExists, emailExists } from "../services/auth";

// ── Password strength helper ──────────────────────────────────────────────────
function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;

  const labels = ["", "Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
  const colors = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"];
  return { score, label: labels[score], color: colors[score] };
}

// ── Input field ───────────────────────────────────────────────────────────────
function FormField({ label, id, type = "text", value, onChange, placeholder, error, icon: Icon, rightElement, autoFocus }) {
  return (
    <div className="auth-form-field">
      <label className="auth-label" htmlFor={id}>{label}</label>
      <div className={`auth-input-wrap ${error ? "auth-input-error" : ""}`}>
        {Icon && <Icon size={17} className="auth-input-icon" />}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="auth-input"
          autoFocus={autoFocus}
          autoComplete={type === "password" ? "current-password" : "off"}
          spellCheck={false}
        />
        {rightElement}
      </div>
      {error && (
        <p className="auth-field-error">
          <AlertCircle size={13} />
          {error}
        </p>
      )}
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export function AuthModal({ onClose, defaultTab = "login", promptMessage = null }) {
  const { login, signup } = useAuth();
  const [tab, setTab]           = useState(defaultTab); // 'login' | 'signup'
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);

  // Login fields
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginShowPw,   setLoginShowPw]   = useState(false);
  const [loginError,    setLoginError]    = useState("");

  // Signup fields
  const [signupUsername,    setSignupUsername]    = useState("");
  const [signupEmail,       setSignupEmail]       = useState("");
  const [signupPassword,    setSignupPassword]    = useState("");
  const [signupConfirm,     setSignupConfirm]     = useState("");
  const [signupShowPw,      setSignupShowPw]      = useState(false);
  const [selectedAvatar,    setSelectedAvatar]    = useState(PRESET_AVATARS[0]);
  const [signupErrors,      setSignupErrors]      = useState({});

  const strength = getPasswordStrength(signupPassword);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // ── Login Submit ─────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    if (!loginUsername.trim()) { setLoginError("Please enter your username."); return; }
    if (!loginPassword)        { setLoginError("Please enter your password."); return; }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 600)); // Simulate async
    const result = login(loginUsername, loginPassword);
    setLoading(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(onClose, 1200);
    } else {
      setLoginError(result.error);
    }
  };

  // ── Signup Submit ────────────────────────────────────────────────────────
  const validateSignup = () => {
    const errs = {};
    if (!signupUsername.trim() || signupUsername.trim().length < 3)
      errs.username = "At least 3 characters required.";
    else if (!/^[a-zA-Z0-9_]+$/.test(signupUsername.trim()))
      errs.username = "Only letters, numbers, and underscores.";
    else if (accountExists(signupUsername))
      errs.username = "Username already taken.";

    if (!signupEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail.trim()))
      errs.email = "Enter a valid email address.";
    else if (emailExists(signupEmail))
      errs.email = "Email already registered.";

    if (!signupPassword || signupPassword.length < 6)
      errs.password = "At least 6 characters required.";

    if (signupConfirm !== signupPassword)
      errs.confirm = "Passwords do not match.";

    return errs;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const errs = validateSignup();
    setSignupErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    const result = signup({
      username: signupUsername.trim(),
      email: signupEmail.trim(),
      password: signupPassword,
      avatar: selectedAvatar,
    });
    setLoading(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(onClose, 1300);
    } else {
      setSignupErrors({ general: result.error });
    }
  };

  // ── Success screen ───────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="auth-backdrop" onClick={onClose}>
        <div className="auth-modal auth-modal--success" onClick={(e) => e.stopPropagation()}>
          <div className="auth-success-inner">
            <div className="auth-success-icon">
              <CheckCircle2 size={56} color="#10b981" strokeWidth={1.5} />
            </div>
            <h2 className="auth-success-title">
              {tab === "login" ? "Welcome back!" : "Account Created!"}
            </h2>
            <p className="auth-success-sub">
              {tab === "login"
                ? `Signed in as ${loginUsername}`
                : `Welcome to AniLib, ${signupUsername}!`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-backdrop" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>

        {/* Close button */}
        <button className="auth-close-btn" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        {/* Brand header — no badge */}
        <div className="auth-brand">
          <span className="auth-brand-icon">⛩️</span>
          <span className="auth-brand-name">
            Ani<span style={{ color: "var(--accent-gold)" }}>Lib</span>
          </span>
        </div>

        {/* Context prompt (e.g. "Login to rate this anime") */}
        {promptMessage && (
          <div className="auth-prompt-message">
            <AlertCircle size={15} />
            {promptMessage}
          </div>
        )}

        {/* Tab switcher */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${tab === "login" ? "active" : ""}`}
            onClick={() => { setTab("login"); setLoginError(""); }}
          >
            <LogIn size={16} /> Sign In
          </button>
          <button
            className={`auth-tab ${tab === "signup" ? "active" : ""}`}
            onClick={() => { setTab("signup"); setSignupErrors({}); }}
          >
            <UserPlus size={16} /> Create Account
          </button>
        </div>

        {/* ── LOGIN FORM ── */}
        {tab === "login" && (
          <form className="auth-form" onSubmit={handleLogin} noValidate>
            <FormField
              label="Username"
              id="auth-login-username"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              placeholder="your_username"
              icon={User}
              autoFocus
            />
            <FormField
              label="Password"
              id="auth-login-password"
              type={loginShowPw ? "text" : "password"}
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="••••••••"
              icon={Lock}
              rightElement={
                <button type="button" className="auth-pw-toggle" onClick={() => setLoginShowPw((p) => !p)}>
                  {loginShowPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            {loginError && (
              <div className="auth-global-error">
                <AlertCircle size={16} /> {loginError}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-imdb auth-submit-btn"
              disabled={loading}
            >
              {loading ? <Loader2 size={18} className="auth-spinner" /> : <LogIn size={18} />}
              {loading ? "Signing in…" : "Sign In"}
            </button>

            <p className="auth-switch-text">
              Don't have an account?{" "}
              <button type="button" className="auth-switch-link" onClick={() => setTab("signup")}>
                Create one free →
              </button>
            </p>
          </form>
        )}

        {/* ── SIGNUP FORM ── */}
        {tab === "signup" && (
          <form className="auth-form" onSubmit={handleSignup} noValidate>

            {/* Avatar picker — anime characters */}
            <div className="auth-avatar-section">
              <div className="auth-avatar-header">
                <label className="auth-label">Choose Your Character</label>
                <span className="auth-avatar-hint">Pick your favourite anime hero</span>
              </div>
              <div className="auth-avatar-grid">
                {PRESET_AVATARS.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    className={`auth-avatar-option ${selectedAvatar === src ? "selected" : ""}`}
                    onClick={() => setSelectedAvatar(src)}
                    title={PRESET_AVATAR_NAMES[i]}
                  >
                    <img
                      src={src}
                      alt={PRESET_AVATAR_NAMES[i]}
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${PRESET_AVATAR_NAMES[i]}&background=8b5cf6&color=fff&size=100`;
                      }}
                    />
                    <span className="auth-avatar-name">{PRESET_AVATAR_NAMES[i]}</span>
                    {selectedAvatar === src && (
                      <div className="auth-avatar-check">
                        <CheckCircle2 size={14} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              {selectedAvatar && (
                <div className="auth-avatar-selected-preview">
                  <img
                    src={selectedAvatar}
                    alt="Selected avatar"
                    onError={(e) => { e.target.src = "/avatars/tanjiro.jpg"; }}
                  />
                  <span>Playing as <strong>{PRESET_AVATAR_NAMES[PRESET_AVATARS.indexOf(selectedAvatar)]}</strong></span>
                </div>
              )}
            </div>

            <FormField
              label="Username"
              id="auth-signup-username"
              value={signupUsername}
              onChange={(e) => setSignupUsername(e.target.value)}
              placeholder="cool_otaku99"
              icon={User}
              error={signupErrors.username}
              autoFocus
            />
            <FormField
              label="Email"
              id="auth-signup-email"
              type="email"
              value={signupEmail}
              onChange={(e) => setSignupEmail(e.target.value)}
              placeholder="you@example.com"
              icon={Mail}
              error={signupErrors.email}
            />
            <FormField
              label="Password"
              id="auth-signup-password"
              type={signupShowPw ? "text" : "password"}
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
              placeholder="Min. 6 characters"
              icon={Lock}
              error={signupErrors.password}
              rightElement={
                <button type="button" className="auth-pw-toggle" onClick={() => setSignupShowPw((p) => !p)}>
                  {signupShowPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            {/* Password strength bar */}
            {signupPassword && (
              <div className="auth-strength-wrap">
                <div className="auth-strength-track">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div
                      key={n}
                      className="auth-strength-seg"
                      style={{ background: n <= strength.score ? strength.color : "var(--border-subtle)" }}
                    />
                  ))}
                </div>
                <span className="auth-strength-label" style={{ color: strength.color }}>
                  {strength.label}
                </span>
              </div>
            )}

            <FormField
              label="Confirm Password"
              id="auth-signup-confirm"
              type="password"
              value={signupConfirm}
              onChange={(e) => setSignupConfirm(e.target.value)}
              placeholder="Repeat password"
              icon={Lock}
              error={signupErrors.confirm}
            />

            {signupErrors.general && (
              <div className="auth-global-error">
                <AlertCircle size={16} /> {signupErrors.general}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-imdb auth-submit-btn"
              disabled={loading}
            >
              {loading ? <Loader2 size={18} className="auth-spinner" /> : <UserPlus size={18} />}
              {loading ? "Creating account…" : "Create Account"}
            </button>

            <p className="auth-switch-text">
              Already have an account?{" "}
              <button type="button" className="auth-switch-link" onClick={() => setTab("login")}>
                Sign in →
              </button>
            </p>
          </form>
        )}

        {/* Guest continue */}
        <button className="auth-guest-btn" onClick={onClose}>
          Continue as Guest
        </button>
      </div>
    </div>
  );
}
