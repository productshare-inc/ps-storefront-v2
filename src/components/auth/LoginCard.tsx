import { useState } from "react";
import { useLoginWithEmail, usePrivy, useLoginWithOAuth } from "@privy-io/react-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, ArrowRight, Loader2, Twitter, Smartphone } from "lucide-react";
import { useRouter } from "next/router";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

export const LoginCard = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { ready, authenticated, login } = usePrivy();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { initOAuth, loading: oauthLoading } = useLoginWithOAuth({
    onComplete: async (authResult: any) => {
      console.log("User successfully logged in with OAuth", authResult);
      router.push("/");
    },
    onError: (error) => {
      console.error("OAuth login error:", error);
      toast({
        title: "Login Error",
        description: "Failed to login. Please try again.",
        variant: "destructive",
      });
    },
  });

  const {
    sendCode,
    loginWithCode,
    state,
  } = useLoginWithEmail({
    onComplete: async (result: any) => {
      console.log("Login successful", result);
      router.push("/");
    },
    onError: (error) => {
      console.error("Login error:", error);
      toast({
        title: "Login Error",
        description: "Failed to login. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleExperimentalLogin = async () => {
    try {
      setIsLoading(true);
      await login({ loginMethods: ['farcaster', 'wallet'] });
    } catch (error) {
      console.error("Experimental login error:", error);
      toast({
        title: "Login Error",
        description: "Failed to initiate experimental login.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isSendingCode = state.status === "sending-code";
  const isVerifyingCode = state.status === "submitting-code";
  const isError = state.status === "error";

  const handleSendCode = async () => {
    if (!email) return;
    try {
      await sendCode({ email });
      setShowCodeInput(true);
    } catch (error) {
      console.error("Error sending code:", error);
    }
  };

  const handleVerifyCode = async () => {
    if (!code) return;
    try {
      await loginWithCode({ code });
    } catch (error) {
      console.error("Error verifying code:", error);
    }
  };

  const handleBack = () => {
    setShowCodeInput(false);
    setCode("");
  };

  const isAuthenticating = !ready || oauthLoading || (authenticated && router.query.redirect_uri);

  if (isAuthenticating) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Setting up your account...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (authenticated) {
    console.log("User is authenticated. Redirecting to home page...");
    //router.push("/");
    return null;
  }

  return (
    <Card className="w-full max-h-full h-full max-w-md mx-auto shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
        <CardDescription>
          {showCodeInput 
            ? "Enter the verification code sent to your email"
            : "Choose how you'd like to sign in"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          {!showCodeInput ? (
            <>
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSendingCode}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && email && !isSendingCode) {
                      handleSendCode();
                    }
                  }}
                />
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleSendCode}
                  disabled={isSendingCode || !email}
                >
                  {isSendingCode ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Code...
                    </>
                  ) : (
                    <>
                      Continue with Email
                      <Mail className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => initOAuth({ provider: "twitter" })}
                  disabled={isLoading}
                >
                  <Twitter className="mr-2 h-4 w-4" />
                  Continue with Twitter
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleExperimentalLogin}
                  disabled={isLoading}
                >
                  <Smartphone className="mr-2 h-4 w-4" />
                  Login With Web3
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Enter verification code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={isVerifyingCode}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && code && !isVerifyingCode) {
                    handleVerifyCode();
                  }
                }}
                autoFocus
              />
              <Button
                className="w-full"
                size="lg"
                onClick={handleVerifyCode}
                disabled={isVerifyingCode || !code}
              >
                {isVerifyingCode ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify Code
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                className="w-full mt-2"
                onClick={handleBack}
                disabled={isVerifyingCode}
              >
                Back to Email
              </Button>
            </div>
          )}

          {isError && (
            <p className="text-sm text-red-500 mt-2">
              {state.error?.message || "An error occurred. Please try again."}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
