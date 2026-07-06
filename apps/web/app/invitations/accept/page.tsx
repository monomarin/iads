"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@raemonorepo/ui";
import { api } from "@/lib/api";

export default function AcceptInvitationPage() {
  const { getToken, isSignedIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "expired" | "accepted" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!tokenParam) {
      setStatus("error");
      setError("Missing invitation token");
      return;
    }
    if (!isSignedIn) {
      router.push(`/sign-in?redirect=/invitations/accept?token=${tokenParam}`);
      return;
    }
    acceptInvitation();
  }, [isSignedIn, tokenParam]);

  async function acceptInvitation() {
    try {
      const authToken = await getToken();
      await api.post("/invitations/accept", { token: tokenParam }, authToken || undefined);
      setStatus("accepted");
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("expired")) {
        setStatus("expired");
      } else {
        setStatus("error");
        setError(message || "Failed to accept invitation");
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 text-center">
        {status === "loading" && (
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        )}

        {status === "accepted" && (
          <>
            <h2 className="mb-2 text-xl font-semibold text-foreground">Invitation accepted!</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              You now have access to the tenant dashboard.
            </p>
            <Button onClick={() => router.push("/")}>Go to Dashboard</Button>
          </>
        )}

        {status === "expired" && (
          <>
            <h2 className="mb-2 text-xl font-semibold text-destructive">Invitation expired</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              This invitation link has expired. Ask your admin to send a new one.
            </p>
            <Button variant="outline" onClick={() => router.push("/")}>
              Back to Dashboard
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <h2 className="mb-2 text-xl font-semibold text-destructive">Something went wrong</h2>
            <p className="mb-6 text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={() => router.push("/")}>
              Back to Dashboard
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
