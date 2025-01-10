import { useCallback, useEffect, useState } from 'react';
import { useLoginWithEmail, usePrivy, useLoginWithOAuth, useLogout, useOAuthTokens } from '@privy-io/react-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mail, ArrowRight, Loader2, Twitter, Smartphone } from 'lucide-react';
import { useRouter } from 'next/router';
import { usePush } from '@/src/lib/redirect';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { storefrontApiMutation } from '@/src/graphql/client';
import { useChannels } from '@/src/state/channels';
import { useTranslation } from 'react-i18next';
import { useCart } from '@/src/state/cart';

export const LoginCard = () => {
    const router = useRouter();
    const { toast } = useToast();
    const ctx = useChannels();
    const { t } = useTranslation('customer');
    const { t: tErrors } = useTranslation('common');
    const { fetchActiveOrder } = useCart();
    const { ready, authenticated, login, user, linkEmail, logout } = usePrivy();
    const [hasTriggeredEmailLink, setHasTriggeredEmailLink] = useState(false);
    const push = usePush();
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [showCodeInput, setShowCodeInput] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const vendureLogin = useCallback(
        async (user: any) => {
            const entries = document.cookie.split(';');
            const privyIdToken = entries.find(substring => substring.trim().startsWith('privy-token'))?.split('=')?.[1];
            const id = user?.id;
            if (!privyIdToken || privyIdToken === '') {
                return;
            }
            try {
                const { authenticate } = await storefrontApiMutation(ctx)({
                    authenticate: [
                        {
                            input: {
                                privy: { privyIdToken: id || '' },
                            },
                        },
                        {
                            __typename: true,
                            '...on CurrentUser': { id: true },
                            '...on InvalidCredentialsError': {
                                errorCode: true,
                                message: true,
                            },
                            '...on NotVerifiedError': {
                                errorCode: true,
                                message: true,
                            },
                        },
                    ],
                });

                console.log('authenticate', authenticate);

                if (authenticate.__typename === 'CurrentUser') {
                    await fetchActiveOrder();
                    push('/customer/manage');
                    return;
                }
            } catch {
                console.log('root', { message: tErrors('errors.backend.UNKNOWN_ERROR') });
            }
        },
        [ctx, fetchActiveOrder, router, tErrors, push],
    );

    const { initOAuth, loading: oauthLoading } = useLoginWithOAuth({
        onComplete: vendureLogin,
        onError: error => {
            console.error('OAuth login error:', error);
            toast({
                title: 'Login Error',
                description: 'Failed to login. Please try again.',
                variant: 'destructive',
            });
        },
    });
   

    const { sendCode, loginWithCode, state } = useLoginWithEmail({
        onComplete: vendureLogin,
        onError: error => {
            console.error('Login error:', error);
            toast({
                title: 'Login Error',
                description: 'Failed to login. Please try again.',
                variant: 'destructive',
            });
        },
    });

    const handleExperimentalLogin = useCallback(async () => {
        try {
            setIsLoading(true);
            await login({ loginMethods: ['farcaster', 'wallet'] });
        } catch (error) {
            console.error('Experimental login error:', error);
            toast({
                title: 'Login Error',
                description: 'Failed to initiate experimental login.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }, [login, toast]);

    const handleSendCode = useCallback(async () => {
        if (!email) return;
        try {
            await sendCode({ email });
            setShowCodeInput(true);
        } catch (error) {
            console.error('Error sending code:', error);
        }
    }, [email, sendCode]);

    const handleVerifyCode = useCallback(async () => {
        if (!code) return;
        try {
            await loginWithCode({ code });
        } catch (error) {
            console.error('Error verifying code:', error);
        }
    }, [code, loginWithCode]);

    const handleBack = useCallback(() => {
        setShowCodeInput(false);
        setCode('');
    }, []);

    const isSendingCode = state.status === 'sending-code';
    const isVerifyingCode = state.status === 'submitting-code';
    const isError = state.status === 'error';

    const isAuthenticating = !ready || oauthLoading || (authenticated && router.query.redirect_uri);

    if (isAuthenticating) {
        return (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="flex flex-col items-center space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Setting up your account...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 p-8">
            <Card className="w-full max-w-4xl shadow-2xl min-h-[80vh] flex flex-col justify-center">
                <CardHeader className="space-y-6 text-center">
                    <CardTitle className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        Welcome back
                    </CardTitle>
                    <CardDescription className="text-2xl font-medium">
                        {showCodeInput
                            ? 'Enter the verification code sent to your email'
                            : "Choose how you'd like to sign in"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-12 p-12">
                    <div className="space-y-12">
                        {!showCodeInput ? (
                            <>
                                <div className="space-y-8">
                                    <Input
                                        type="email"
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        disabled={isSendingCode}
                                        className="text-2xl p-8 rounded-xl"
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && email && !isSendingCode) {
                                                handleSendCode();
                                            }
                                        }}
                                    />
                                    <Button
                                        className="w-full text-2xl py-10 rounded-xl transition-all duration-300 hover:scale-105"
                                        size="lg"
                                        onClick={handleSendCode}
                                        disabled={isSendingCode || !email}>
                                        {isSendingCode ? (
                                            <>
                                                <Loader2 className="mr-3 h-12 w-12 animate-spin" />
                                                Sending Code...
                                            </>
                                        ) : (
                                            <>
                                                Continue with Email
                                                <Mail className="ml-3 h-16 w-16" />
                                            </>
                                        )}
                                    </Button>
                                </div>

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <Separator className="w-full" />
                                    </div>
                                    <div className="relative flex justify-center text-2xl uppercase">
                                        <span className="bg-background px-6 text-muted-foreground">
                                            Or continue with
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <Button
                                        variant="outline"
                                        className="w-full text-2xl py-10 rounded-xl transition-all duration-300 hover:scale-105"
                                        onClick={() => initOAuth({ provider: 'twitter' })}
                                        disabled={isLoading}>
                                        <Twitter className="mr-3 h-12 w-12" />
                                        Continue with Twitter
                                    </Button>

                                    <Button
                                        variant="outline"
                                        className="w-full text-2xl py-10 rounded-xl transition-all duration-300 hover:scale-105"
                                        onClick={handleExperimentalLogin}
                                        disabled={isLoading}>
                                        <Smartphone className="mr-3 h-12 w-12" />
                                        Login With Web3
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-8">
                                <Input
                                    type="text"
                                    placeholder="Enter verification code"
                                    value={code}
                                    onChange={e => setCode(e.target.value)}
                                    disabled={isVerifyingCode}
                                    className="text-2xl p-8 rounded-xl"
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && code && !isVerifyingCode) {
                                            handleVerifyCode();
                                        }
                                    }}
                                    autoFocus
                                />
                                <Button
                                    className="w-full text-2xl py-10 rounded-xl transition-all duration-300 hover:scale-105"
                                    size="lg"
                                    onClick={handleVerifyCode}
                                    disabled={isVerifyingCode || !code}>
                                    {isVerifyingCode ? (
                                        <>
                                            <Loader2 className="mr-3 h-12 w-12 animate-spin" />
                                            Verifying...
                                        </>
                                    ) : (
                                        <>
                                            Verify Code
                                            <ArrowRight className="ml-3 h-12 w-12" />
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full mt-6 text-2xl py-10 rounded-xl transition-all duration-300 hover:scale-105"
                                    onClick={handleBack}
                                    disabled={isVerifyingCode}>
                                    Back to Email
                                </Button>
                            </div>
                        )}

                        {isError && (
                            <p className="text-xl text-red-500 mt-6 text-center">
                                An error occurred. Please try again.
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
