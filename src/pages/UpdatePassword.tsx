import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate } from 'react-router-dom';

const UpdatePassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const navigate = useNavigate();

  // Optional: surface that we've entered recovery flow
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMsg('Recovery link verified. You can now set a new password.');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    if (password.length < 8) {
      setErr('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setErr('Passwords do not match.');
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);

    if (error) {
      setErr(error.message);
      return;
    }

    setMsg('Password updated successfully. Redirecting to login…');
    // Give a brief moment and navigate to auth/login
    setTimeout(() => navigate('/auth', { replace: true }), 1200);
  };

  return (
    <div className="mx-auto my-16 max-w-md rounded-2xl border p-6 shadow-sm">
      <h1 className="mb-2 text-2xl font-semibold">Set a new password</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        This page opens from the password reset email link.
      </p>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">New password</label>
          <input
            type="password"
            className="w-full rounded-xl border p-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Confirm password</label>
          <input
            type="password"
            className="w-full rounded-xl border p-3"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter new password"
            required
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-primary p-3 text-white disabled:opacity-50"
        >
          {busy ? 'Updating…' : 'Update password'}
        </button>
      </form>

      {err && <p className="mt-4 text-sm text-red-600">{err}</p>}
      {msg && <p className="mt-4 text-sm text-green-600">{msg}</p>}

      <div className="mt-6 text-center text-sm">
        <Link className="underline" to="/auth">Back to login</Link>
      </div>
    </div>
  );
};

export default UpdatePassword;