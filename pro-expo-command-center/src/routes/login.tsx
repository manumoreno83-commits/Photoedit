import { useState } from 'react';
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';

export function LoginPage() {
  const { signInWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onClick = async () => {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen w-full place-items-center px-6 grid-bg">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-border bg-bg-elev/85 p-10 shadow-elev backdrop-blur-md animate-fade-in">
        <div className="flex flex-col items-center gap-4 text-center">
          <Logo size={56} />
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-text">
              Pro Expo
            </h1>
            <p className="mt-1 font-mono text-2xs uppercase tracking-[0.18em] text-mute">
              Operations Center
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="w-full justify-center"
            onClick={onClick}
            disabled={busy}
          >
            <GoogleMark className="h-4 w-4" />
            {busy ? 'Connecting to Google…' : 'Sign in with Google'}
          </Button>

          <p className="text-center text-2xs text-faint">
            Restricted to <span className="font-mono text-mute">@pro-expo.net</span> accounts.
          </p>

          {error && (
            <div className="rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
              {error}
            </div>
          )}
        </div>

        <footer className="border-t border-border pt-4 text-center text-2xs text-faint">
          v0.1 · internal use only
        </footer>
      </div>
    </div>
  );
}

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.5-5.9 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.5 29.3 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13.5 24 13.5c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 7.5 29.3 5.5 24 5.5 16.3 5.5 9.7 9.8 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 43.5c5.2 0 10-2 13.5-5.2l-6.2-5.3c-1.9 1.3-4.3 2-7.3 2-5.4 0-9.7-3.5-11.3-8l-6.5 5C9.5 38.9 16.2 43.5 24 43.5z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4-4 5.3l6.2 5.3c-.4.4 6.5-4.7 6.5-14.6 0-1.2-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}
