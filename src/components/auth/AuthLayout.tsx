import { usePrivy } from "@privy-io/react-auth";
import { useOAuthTokens } from "@privy-io/react-auth";
import { Loader2 } from "lucide-react";
import { useEffect, useCallback, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/router";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { ready, authenticated, user, linkEmail } = usePrivy();
  const { toast } = useToast();
  const router = useRouter();
  const [hasTriggeredEmailLink, setHasTriggeredEmailLink] = useState(false);

  const checkAndTriggerEmailLink = useCallback(async () => {
    if (!user?.email?.address && !hasTriggeredEmailLink) {
      setHasTriggeredEmailLink(true);
      try {
        await linkEmail();
      } catch (error) {
        console.error("Failed to trigger email linking:", error);
        toast({
          title: "Action Required",
          description: "Please link your email address to continue.",
          variant: "default",
        });
      }
    }
  }, [user?.email?.address, hasTriggeredEmailLink, linkEmail, toast]);

  const createOrFetchUser = useCallback(async () => {
    if (!ready || !authenticated || !user) return;

    try {
      console.log("User authenticated:", user);

      const twitterAccount = user.linkedAccounts?.find(
        account => account.type === "twitter_oauth"
      );

      const userData = {
        privyUserId: user.id,
        email: user.email?.address,
        twitterUsername: twitterAccount?.username
      };

      console.log("Creating/updating user with data:", userData);

      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
        credentials: "include"
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create user: ${errorText}`);
      }

      const data = await response.json();
      console.log("User created/updated:", data);

      if (!router.pathname.startsWith("/login")) {
        toast({
          title: "Welcome!",
          description: "Your account has been successfully set up.",
        });
      }

      await checkAndTriggerEmailLink();
    } catch (error) {
      console.error("Error in auth flow:", error);
      toast({
        title: "Authentication Error",
        description: error instanceof Error ? error.message : "Failed to authenticate user",
        variant: "destructive",
      });
    }
  }, [ready, authenticated, user, toast, router, checkAndTriggerEmailLink]);

  useOAuthTokens({
    onOAuthTokenGrant: async (oAuthTokens, { user }) => {
      if (oAuthTokens.provider === "twitter" && oAuthTokens.accessToken) {
        try {
          console.log("Storing Twitter tokens for user:", {
            privyUserId: user.id,
            hasAccessToken: !!oAuthTokens.accessToken,
            hasRefreshToken: !!oAuthTokens.refreshToken,
            twitterUsername: user.linkedAccounts?.find(acc => acc.type === "twitter_oauth")?.username
          });

          const response = await fetch("/api/users", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              privyUserId: user.id,
              twitterOAuthToken: oAuthTokens.accessToken,
              twitterRefreshToken: oAuthTokens.refreshToken,
              twitterUsername: user.linkedAccounts?.find(acc => acc.type === "twitter_oauth")?.username
            }),
            credentials: "include"
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to store Twitter tokens: ${errorText}`);
          }

          const data = await response.json();
          console.log("Twitter tokens stored:", data);

        } catch (error) {
          console.error("Failed to store Twitter tokens:", error);
          toast({
            title: "Error",
            description: "Failed to connect Twitter account. Please try again.",
            variant: "destructive",
          });
        }
      }
    }
  });

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      if (ready && authenticated && user && isMounted) {
        await createOrFetchUser();
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, [ready, authenticated, user, createOrFetchUser]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}