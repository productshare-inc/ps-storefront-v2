import { useLogout, usePrivy } from '@privy-io/react-auth';
import { useOAuthTokens, OAuthTokens } from '@privy-io/react-auth';
import { Loader2 } from 'lucide-react';
import { useEffect, useCallback, useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/router';
import { usePush } from '@/src/lib/redirect';
import { useChannels } from '@/src/state/channels';
import { useTranslation } from 'react-i18next';
import { storefrontApiMutation } from '@/src/graphql/client';

interface AuthLayoutProps {
    children: React.ReactNode;
}
type PrivyUser = {
    id: string;
    email?: { address: string };
    linkedAccounts?: { type: string; username?: string | null }[];
};

export function AuthLayout({ children }: AuthLayoutProps) {
    const { ready, authenticated, user, linkEmail, logout } = usePrivy();
    const { toast } = useToast();
    const router = useRouter();
    const [hasExecuted, setHasExecuted] = useState(false);
    const createOrFetchUserExecutedRef = useRef(false);
    const handleOAuthTokenGrantExecutedRef = useRef(false);
    const hasTriggeredEmailLink = useRef(false);
    // const [hasTriggeredEmailLink, setHasTriggeredEmailLink] = useState(false);
    const ctx = useChannels();
    const push = usePush();
    const { t } = useTranslation('customer');

    const vendureLogout = useCallback(async () => {
        console.log('Logging out user:', user);
        await storefrontApiMutation(ctx)({ logout: { success: true } });
        toast({
            title: 'Logged out',
            description: 'You have been successfully logged out.',
            variant: 'default',
        });
    }, [ctx, toast]);

    const onSuccess = async () => {
        console.log('User logging out:', user);
        await vendureLogout();
        push('/customer/login');
    };

    const checkAndTriggerEmailLink = useCallback(async () => {
        if (!user?.email?.address && !hasTriggeredEmailLink.current) {
            hasTriggeredEmailLink.current = true;
            try {
                linkEmail();
            } catch (error) {
                console.error('Failed to trigger email linking:', error);
                toast({
                    title: 'Action Required',
                    description: 'Please link your email address to continue.',
                    variant: 'default',
                });
            }
        }
    }, [user?.email?.address, linkEmail, toast]);

    const createOrFetchUser = useCallback(async () => {
        if (!ready || !authenticated || !user || createOrFetchUserExecutedRef.current) return;

        createOrFetchUserExecutedRef.current = true;

        try {
            console.log('User authenticated:', user);

            const twitterAccount = user.linkedAccounts?.find(account => account.type === 'twitter_oauth');

            const userData = {
                privyUserId: user.id,
                email: user.email?.address,
                twitterUsername: twitterAccount?.username,
            };

            console.log('Creating/updating user with data:', userData);

            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
                credentials: 'include',
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to create user: ${errorText}`);
            }

            const data = await response.json();
            console.log('User created/updated:', data);

            if (!router.pathname.startsWith('/login')) {
                toast({
                    title: 'Welcome!',
                    description: 'Your account has been successfully set up.',
                });
            }

            await checkAndTriggerEmailLink();
        } catch (error) {
            console.error('Error in auth flow:', error);
            toast({
                title: 'Authentication Error',
                description: error instanceof Error ? error.message : 'Failed to authenticate user',
                variant: 'destructive',
            });
        }
    }, [ready, authenticated, user, toast, router, checkAndTriggerEmailLink]);

    const handleOAuthTokenGrant = useCallback(
        async (oAuthTokens: OAuthTokens, { user }: { user: PrivyUser | null }) => {
            if (!authenticated || handleOAuthTokenGrantExecutedRef.current || !user) return;

            handleOAuthTokenGrantExecutedRef.current = true;

            if (oAuthTokens.provider === 'twitter' && oAuthTokens.accessToken) {
                try {
                    console.log('Storing Twitter tokens for user:', {
                        privyUserId: user.id,
                        hasAccessToken: !!oAuthTokens.accessToken,
                        hasRefreshToken: !!oAuthTokens.refreshToken,
                        twitterUsername: user.linkedAccounts?.find(acc => acc.type === 'twitter_oauth')?.username,
                    });

                    const response = await fetch('/api/users', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            privyUserId: user.id,
                            twitterOAuthToken: oAuthTokens.accessToken,
                            twitterRefreshToken: oAuthTokens.refreshToken,
                            twitterUsername: user.linkedAccounts?.find(acc => acc.type === 'twitter_oauth')?.username,
                        }),
                        credentials: 'include',
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`Failed to store Twitter tokens: ${errorText}`);
                    }

                    const data = await response.json();
                    console.log('Twitter tokens stored:', data);
                } catch (error) {
                    console.error('Failed to store Twitter tokens:', error);
                    toast({
                        title: 'Error',
                        description: 'Failed to connect Twitter account. Please try again.',
                        variant: 'destructive',
                    });
                }
            }
        },
        [authenticated, hasExecuted, toast],
    );

    useOAuthTokens({
        onOAuthTokenGrant: handleOAuthTokenGrant,
    });

    useEffect(() => {
        let isMounted = true;
        console.log('running useEffect in Authlayout');
        const { logout } = useLogout({ onSuccess });
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
