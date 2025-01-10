// @ts-check

/**
 * @type {import('next-i18next').UserConfig}
 */
module.exports = {
    // https://www.i18next.com/overview/configuration-options#logging
    // i18n: {
    //     defaultLocale: 'pl',
    //     locales: ['pl', 'de', 'cz'] ['en', 'pl', 'fr', 'de', 'ja', 'es'],
    //     returnObjects: true,
    //     fallbackLng: 'pl',
    // },
    i18n: {
        defaultLocale: 'en',
        locales: ['en', 'de'],
    },
    localePath: typeof window === 'undefined' ? require('path').resolve('./public/locales') : '/locales',
    returnObjects: true,
    fallbackLng: 'en',
    /** To avoid issues when deploying to some paas (vercel...) */

    reloadOnPrerender: process.env.NODE_ENV === 'development',
};
