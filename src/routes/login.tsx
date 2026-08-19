import { createFileRoute, Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-6 text-fg">
      <div className="w-full max-w-sm space-y-5">
        <div>
          <p className="font-mono text-[11px] tracking-[0.18em] text-subtle">OMNI-FORGE</p>
          <h1 className="mt-2 text-2xl font-medium tracking-tight">Sign in</h1>
          <p className="mt-1 text-sm text-muted">Save decks to your account. The editor works as a guest.</p>
        </div>
        {authEnabled ? (
          <div className="space-y-2">
            {GROK_PROVIDERS.map((p) => (
              <Button
                key={p.providerId}
                variant="ghost"
                className="w-full"
                onClick={() => void signIn(p.providerId, { callbackURL: "/" })}
              >
                Continue with {p.label}
              </Button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">Sign-in is disabled.</p>
        )}
        <Link to="/" className="inline-block text-sm text-muted hover:text-fg">
          Back to deck
        </Link>
      </div>
    </main>
  );
}
