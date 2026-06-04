"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FolderKanban, ListChecks, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore, selectIsAuthenticated } from "@/store/auth.store";

export default function Home() {
  const router = useRouter();
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isAuthenticated = useAuthStore((s) => selectIsAuthenticated(s));
  const landingPage = useAuthStore((s) => s.landingPage);

  // ── Authenticated users → redirect to their role's landing page ──
  useEffect(() => {
    if (!hasHydrated) return;
    if (isAuthenticated) {
      router.replace(landingPage || "/dashboard");
    }
  }, [hasHydrated, isAuthenticated, landingPage, router]);

  // Don't flash the marketing page while checking auth
  if (!hasHydrated || isAuthenticated) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b">
        <span className="font-bold text-xl">Kolab</span>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Login
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="max-w-3xl text-center space-y-8">
          <h1 className="text-5xl font-bold tracking-tight">
            Smart Project & Task Collaboration
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Manage projects, assign tasks, track progress, and collaborate with
            your team — all in one place.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mt-16">
          <FeatureCard
            icon={FolderKanban}
            title="Projects"
            description="Create and manage projects with status tracking and deadlines"
          />
          <FeatureCard
            icon={ListChecks}
            title="Tasks"
            description="Assign tasks, set priorities, and track progress in real-time"
          />
          <FeatureCard
            icon={Users}
            title="Team"
            description="Collaborate with team members and monitor workload"
          />
        </div>
      </main>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-6 text-center space-y-3">
      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
