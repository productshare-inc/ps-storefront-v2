import { Layout } from '@/src/layouts';
import { InferGetServerSidePropsType } from 'next';
import React from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { LoginCustomerInputType } from '@/src/graphql/selectors';
import { storefrontApiMutation } from '@/src/graphql/client';
import { Link } from '@/src/components/atoms/Link';
import { Stack } from '@/src/components/atoms/Stack';
import { Input, Banner, CheckBox } from '@/src/components/forms';
import { Button } from '@/src/components/molecules/Button';
import { ContentContainer } from '@/src/components/atoms/ContentContainer';
import { usePush } from '@/src/lib/redirect';
import { useTranslation } from 'next-i18next';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { TP } from '@/src/components/atoms/TypoGraphy';
import { useCart } from '@/src/state/cart';
import { Absolute, Form, FormContainer, FormContent, FormWrapper } from '../components/shared';
import { getServerSideProps } from './props';
import { useChannels } from '@/src/state/channels';
import styled from '@emotion/styled';
import { LoginCard } from "@/components/auth/LoginCard";

export const SignInPage: React.FC<InferGetServerSidePropsType<typeof getServerSideProps>> = props => {
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
    const onSubmit: SubmitHandler<LoginCustomerInputType> = async data => {
        const { emailAddress, password, rememberMe } = data;
        try {
            const { login } = await storefrontApiMutation(ctx)({
                login: [
                    { password, username: emailAddress, rememberMe },
                    {
                        __typename: true,
                        '...on CurrentUser': { id: true },
                        '...on InvalidCredentialsError': {
                            errorCode: true,
                            message: true,
                        },
                        '...on NativeAuthStrategyError': {
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

            if (login.__typename === 'CurrentUser') {
                await fetchActiveOrder();
                push('/customer/manage');
                return;
            }

            setError('root', { message: tErrors(`errors.backend.${login.errorCode}`) });
        } catch {
            setError('root', { message: tErrors('errors.backend.UNKNOWN_ERROR') });
        }
    };

    return (
        <Layout categories={props.collections} navigation={props.navigation} pageTitle={t('signInTitle')}>
            <ContentContainer>
                <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
                    <div className="w-full min-h-max max-2xl">
                        <LoginCard />
                    </div>
                </div>
            </ContentContainer>
        </Layout>
    );
};

const StyledLink = styled(Link)`
    position: relative;
    color: ${({ theme }) => theme.text.main};
    display: block;
    transition: text-decoration 0.3s ease;

    &:hover {
        text-decoration: underline;
    }
`;
