import { Stack } from '@/src/components/atoms/Stack';
import { TP } from '@/src/components/atoms/TypoGraphy';
import React, { Fragment } from 'react';
import { MoveRight } from 'lucide-react';
import styled from '@emotion/styled';
import { useTranslation } from 'next-i18next';

const steps = ['shipping', 'payment', 'confirmation'] as const;
export const CheckoutStatus: React.FC<{ step: 'shipping' | 'payment' | 'confirmation' }> = ({ step }) => {
    const { t } = useTranslation('checkout');
    return (
        <Container w100 justifyBetween gap="5rem">
            {steps.map((name, index) => {
                return (
                    <Fragment key={name}>
                        <Stack>
                            <Stack column itemsCenter>
                                <Circle active={step === name}>{index + 1}</Circle>
                                <TP>{t(`steps.${name}`)}</TP>
                            </Stack>
                        </Stack>
                        {index !== steps.length - 1 && <MoveRight size={40} />}
                    </Fragment>
                );
            })}
        </Container>
    );
};

const Container = styled(Stack)`
    user-select: none;
    padding: 0 2.5rem;
`;

const Circle = styled.span<{ active: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 100%;
    background: ${props => props.theme.gray(1000)};
    opacity: ${props => (props.active ? 1 : 0.5)};
    color: ${props => props.theme.gray(100)};
    font-size: 12px;
    line-height: 1;
    font-weight: 500;
`;
