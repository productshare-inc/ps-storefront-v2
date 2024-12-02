import { Dropdown } from '@/src/styles/reusableStyles';
import styled from '@emotion/styled';
import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';
import { Link } from '@/src/components/atoms';
import { User2, UserCheck2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { LoginCustomerInputType } from '@/src/graphql/selectors';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePush } from '@/src/lib/redirect';
import { useLogin, usePrivy } from '@privy-io/react-auth';
import { storefrontApiMutation } from '@/src/graphql/client';
import { useChannels } from '@/src/state/channels';
import { useTranslation } from 'react-i18next';
import { useCart } from '@/src/state/cart';
import { z } from 'zod';

export const UserMenu: React.FC<{ isLogged: boolean }> = ({ isLogged }) => {
   
    const ctx = useChannels();
    const { t } = useTranslation('customer');
    const { t: tErrors } = useTranslation('common');
    const { fetchActiveOrder } = useCart();

    const schema = z.object({
        emailAddress: z.string().email(tErrors('errors.email.invalid')).min(1, tErrors('errors.email.required')),
        password: z.string(), //let backend handle this
        // password: z.string().min(8, tErrors('errors.password.minLength')).max(25, tErrors('errors.password.maxLength')),
        rememberMe: z.boolean().optional(),
    });

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<LoginCustomerInputType>({
        resolver: zodResolver(schema),
    });
    const push = usePush();
    const {ready, authenticated,user} = usePrivy();
    const disableLogin = !ready
    
    const {login} = useLogin({
        onComplete: async () => {
            const entries= document.cookie.split(';');
            const privyIdToken= entries.find((substring)=> substring.trim().startsWith('privy-token'))?.split('=')?.[1];
            const id = user?.id;
            if(!privyIdToken || privyIdToken === ""){
                return
            }
            try {
                const { authenticate } = await storefrontApiMutation(ctx)({
                    authenticate: [
                        { 
                            input:{
                                privy:{privyIdToken:id || ""}
                            } 
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

                console.log("authenticate", authenticate)

                if (authenticate.__typename === 'CurrentUser') {
                    await fetchActiveOrder();
                    push('/customer/manage');
                    return;
                }

                setError('root', { message: tErrors(`errors.backend.${authenticate.errorCode}`) });
            } catch {
                setError('root', { message: tErrors('errors.backend.UNKNOWN_ERROR') });
            }
        },
        onError: (error) => {
            setError('root', { message: tErrors('errors.backend.UNKNOWN_ERROR') });
        },
      });

    return (
        <Dropdown>
            <IconLink aria-label="User menu" href={authenticated ? '/customer/manage' : ''}>
                <AnimatePresence>
                    {authenticated ? (
                        <IconWrapper initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <UserCheck2 size="2.4rem"/>
                        </IconWrapper>
                    ) : (
                        <IconWrapper initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <User2 size="2.4rem" onClick={login}/>
                        </IconWrapper>
                    )}
                </AnimatePresence>
            </IconLink>
        </Dropdown>
    );
};

const IconWrapper = styled(motion.div)`
    width: 2.4rem;
    height: 2.4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
`;

const IconLink = styled(Link)`
    display: flex;
    align-items: center;
    justify-content: center;

    color: ${p => p.theme.text.main};
`;
