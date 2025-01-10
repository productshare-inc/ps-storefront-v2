import { LogoAexol } from '@/src/assets';
import { ContentContainer } from '@/src/components/atoms';
import { UserMenu } from '@/src/components/molecules/UserMenu';
import { ShareCashLogo } from '@/src/assets';
import { Stack } from '@/src/components/atoms/Stack';
import styled from '@emotion/styled';
import { Link } from '@/src/components/atoms/Link';
import { useCart } from '@/src/state/cart';
import { useToast } from '@/hooks/use-toast';
import { usePush } from '@/src/lib/redirect';
//import Link from "next/link";
import { Button } from '@/components/ui/button';
// import { Cart } from '@/src/layouts/Cart';
// import { LanguageSwitcher } from '@/src/components';

import { CartDrawer } from '@/src/layouts/CartDrawer';
import { CollectionTileType, NavigationType } from '@/src/graphql/selectors';
import { RootNode } from '@/src/util/arrayToTree';
import { DesktopNavigation } from '@/src/components/organisms/DesktopNavigation';
import { SearchIcon } from 'lucide-react';
import { IconButton } from '@/src/components/molecules/Button';
import { AnnouncementBar } from '@/src/components/organisms/AnnouncementBar';
import { CategoryBar } from './CategoryBar';
import { NavigationSearch } from '@/src/components/organisms/NavgationSearch';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigationSearch } from '@/src/components/organisms/NavgationSearch/hooks';
import { useCallback, useEffect, useRef } from 'react';
import { Picker } from '@/src/components/organisms/Picker';
import { useTranslation } from 'next-i18next';
import { useLogout, usePrivy } from '@privy-io/react-auth';
import { UserPill } from '@privy-io/react-auth/ui';
import { storefrontApiMutation } from '@/src/graphql/client';
import { useChannels } from '@/src/state/channels';
interface NavigationProps {
    navigation: RootNode<NavigationType> | null;
    categories: CollectionTileType[];
    changeModal?: {
        modal: boolean;
        channel: string;
        locale: string;
        country_name: string;
    };
}

export const Navigation: React.FC<NavigationProps> = ({ navigation, categories, changeModal }) => {
    const ctx = useChannels();
    const { toast } = useToast();
    const push = usePush();
    const { ready, authenticated, user, logout: logoutPrivy } = usePrivy();
    const { t } = useTranslation();
    const { isLogged, cart } = useCart();
    const navigationSearch = useNavigationSearch();
    const searchRef = useRef<HTMLDivElement>(null);
    const searchMobileRef = useRef<HTMLDivElement>(null);
    const iconRef = useRef<HTMLButtonElement>(null);

    const handleOutsideClick = (event: MouseEvent) => {
        if (
            searchRef.current &&
            !searchRef.current.contains(event.target as Node) &&
            iconRef.current &&
            !iconRef.current.contains(event.target as Node) &&
            searchMobileRef.current &&
            !searchMobileRef.current.contains(event.target as Node)
        ) {
            navigationSearch.closeSearch();
        }
    };

    const vendureLogoutFromNav = useCallback(async () => {
        console.log('Logging out user:', user);
        await storefrontApiMutation(ctx)({ logout: { success: true } });
        toast({
            title: 'Logged out',
            description: 'You have been successfully logged out.',
            variant: 'default',
        });
    }, [ctx, toast]);
    const onSuccessLogout = async () => {
        console.log('User logging out:', user);
        await vendureLogoutFromNav();
        push('/customer/login');
    };

    useLogout({ onSuccess: onSuccessLogout });
    const handleLogout = async () => {
        try {
            await logoutPrivy();
        } catch (error) {
            console.error('Logout error:', error);
        }
    };
    useEffect(() => {
        document.addEventListener('click', handleOutsideClick);
        return () => {
            document.removeEventListener('click', handleOutsideClick);
        };
    }, []);

    // THIS SHOULD COME FROM PLUGIN
    const entries = [
        { text: t('announcements-bar')[0], href: '/collections/all' },
        { text: t('announcements-bar')[1], href: '/' },
        { text: t('announcements-bar')[2], href: '/' },
        { text: t('announcements-bar')[3], href: '/' },
    ];

    return (
        <>
            {process.env.NEXT_PUBLIC_SHOW_TOP == 'true' ? (
                <AnnouncementBar entries={entries} secondsBetween={5} />
            ) : null}
            <StickyContainer>
                <ContentContainer>
                    <Stack itemsCenter justifyBetween gap="5rem" w100>
                        <Stack itemsCenter>
                            <Link ariaLabel={'Home'} href={'/'}>
                                <ShareCashLogo width={300} />
                            </Link>
                        </Stack>
                        <AnimatePresence>
                            {navigationSearch.searchOpen ? (
                                <DesktopNavigationContainer
                                    style={{ width: '100%' }}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    ref={searchRef}>
                                    <NavigationSearch {...navigationSearch} />
                                </DesktopNavigationContainer>
                            ) : (
                                <DesktopNavigation navigation={navigation} />
                            )}
                        </AnimatePresence>
                        <Stack gap="1rem" itemsCenter>
                            <IconButton
                                aria-label="Search products"
                                onClick={navigationSearch.toggleSearch}
                                ref={iconRef}>
                                <SearchIcon />
                            </IconButton>
                            <Picker changeModal={changeModal} />
                            <div className="flex items-center gap-4">
                                {ready && authenticated ? (
                                    <>
                                        <UserPill />
                                        <Button variant="outline" onClick={handleLogout}>
                                            Logout
                                        </Button>
                                    </>
                                ) : (
                                    <Link href="/customer/login" passHref>
                                        <Button variant="outline">Sign In</Button>
                                    </Link>
                                )}
                            </div>
                            <CartDrawer activeOrder={cart} />
                        </Stack>
                    </Stack>
                </ContentContainer>
                {navigationSearch.searchOpen && (
                    <MobileNavigationContainer ref={searchMobileRef}>
                        <NavigationSearch {...navigationSearch} />
                    </MobileNavigationContainer>
                )}
            </StickyContainer>

            {categories?.length > 0 ? <CategoryBar collections={categories} /> : null}
        </>
    );
};

const StickyContainer = styled.nav`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    width: 100%;
    padding: 2rem;
    position: sticky;
    top: 0;
    background: ${p => p.theme.gray(0)};
    z-index: 2137;
    border-bottom: 1px solid ${p => p.theme.gray(100)};
    svg {
        max-height: 4rem;
    }
`;

const MobileNavigationContainer = styled.div`
    display: block;
    padding: 2.5rem 2rem 0 2rem;
    width: 100%;
    @media (min-width: ${p => p.theme.breakpoints.md}) {
        display: none;
    }
`;

const DesktopNavigationContainer = styled(motion.div)`
    display: none;
    @media (min-width: ${p => p.theme.breakpoints.md}) {
        display: block;
    }
`;
