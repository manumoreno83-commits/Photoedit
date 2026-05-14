import { useAuth } from '@/lib/auth';
import { LoginPage } from '@/routes/login';
import { Logo } from '@/components/shared/Logo';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

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
