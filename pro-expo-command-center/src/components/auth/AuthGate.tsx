import { useAuth } from '@/lib/auth';
import { LoginPage } from '@/routes/login';
import { Logo } from '@/components/shared/Logo';

/**
 * Dev affordance: append `?demo=1` to skip the gate. Useful for screenshots,
 * design review and component tinkering before Supabase Auth is wired.
 * Production: leave the URL clean and the gate enforces.
 */
const DEMO_BYPASS =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).has('demo') &&
  import.meta.env.MODE !== 'production';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (DEMO_BYPASS) return <>{children}</>;

  if (loading) {
    return (
      <div className="grid min-h-screen w-full place-items-center grid-bg">
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <Logo size={48} />
          <p className="font-mono text-2xs uppercase tracking-[0.18em] text-mute animate-pulse-soft">
            Loading session…
          </p>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return <>{children}</>;
}
