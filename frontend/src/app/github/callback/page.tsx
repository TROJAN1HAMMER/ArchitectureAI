"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
    const backendOrigin = backendUrl.replace(/\/api\/v1\/?$/, "");
    const callbackEndpoint = `${backendOrigin}/api/v1/github/callback`;

    if (error) {
      const msg = encodeURIComponent(errorDescription || error);
      router.push(`/repositories?connected=false&error=${msg}`);
      return;
    }

    if (code && state) {
      window.location.href = `${callbackEndpoint}?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
      return;
    }

    router.push("/repositories");
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100">
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-sm font-medium text-zinc-400">
          Processing GitHub Authentication...
        </p>
      </div>
    </div>
  );
}

export default function GithubCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
