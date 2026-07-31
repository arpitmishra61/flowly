import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Workflow, Zap, MessageSquare, ShieldCheck } from "lucide-react";

const FEATURES = [
  {
    icon: Workflow,
    title: "Visual builder",
    description: "Drag and drop triggers and actions to design workflows without writing code.",
  },
  {
    icon: Zap,
    title: "Instant triggers",
    description: "Kick off automations the moment something happens — no polling, no delays.",
  },
  {
    icon: MessageSquare,
    title: "AI assistant",
    description: "Describe what you want in plain language and let Flowly build the workflow.",
  },
  {
    icon: ShieldCheck,
    title: "Reliable by default",
    description: "Every run is tracked and retried automatically so nothing falls through the cracks.",
  },
];

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  const SignInForm = ({ className }: { className?: string }) => (
    <form
      action={async () => {
        "use server";
        await signIn("google", { redirectTo: callbackUrl || "/" });
      }}
      className={className}
    >
      <Button type="submit" size="lg" className="w-full gap-2">
        <GoogleIcon />
        Sign in with Google
      </Button>
    </form>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <span className="text-lg font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          Flowly
        </span>
        <SignInForm className="hidden sm:block" />
      </header>

      <main className="max-w-6xl mx-auto px-6">
        <section className="flex flex-col items-center text-center py-16 sm:py-24">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight max-w-3xl">
            Automate your work,{" "}
            <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              without the busywork
            </span>
          </h1>
          <p className="text-lg text-muted-foreground mt-6 max-w-xl">
            Flowly connects your favorite apps with triggers and actions so your workflows run
            themselves — build once, automate forever.
          </p>
          <div className="w-full max-w-xs mt-8">
            <SignInForm />
            <p className="text-xs text-muted-foreground mt-3">
              Free to get started. No credit card required.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-20">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border bg-white/80 backdrop-blur-lg shadow-sm p-6 text-left"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-1.5">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="max-w-6xl mx-auto px-6 py-8 border-t text-sm text-muted-foreground text-center">
        © {new Date().getFullYear()} Flowly. All rights reserved.
      </footer>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29A11.98 11.98 0 0 0 0 12c0 1.93.46 3.76 1.29 5.38l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}
