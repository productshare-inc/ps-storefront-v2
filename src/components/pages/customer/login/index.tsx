import { Layout } from '@/src/layouts';
import { useRouter } from 'next/router';
import { InferGetServerSidePropsType } from 'next';
import React, { useEffect, useState } from 'react';
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
import { usePrivy } from '@privy-io/react-auth';
import { Absolute, Form, FormContainer, FormContent, FormWrapper } from '../components/shared';
import { getServerSideProps } from './props';
import { useChannels } from '@/src/state/channels';
import styled from '@emotion/styled';
import { LoginCard } from '@/components/auth/LoginCard';

export const SignInPage: React.FC<InferGetServerSidePropsType<typeof getServerSideProps>> = props => {
    const ctx = useChannels();
    
    const { t } = useTranslation('customer');
    const { t: tErrors } = useTranslation('common');
    const { fetchActiveOrder } = useCart();

    return (
        <Layout categories={props.collections} navigation={props.navigation} pageTitle={t('signInTitle')}>
            <ContentContainer>
                <LoginCard />
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
