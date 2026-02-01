import type { Metadata, Viewport } from 'next';
import { Inter, Manrope } from 'next/font/google';
import '../../globals.css';
import { defaultMetadata, defaultViewport } from '@/lib';
import { Navbar, Footer, ThemeProvider } from '@/components/shared';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

const inter = Inter({
    variable: '--font-inter',
    subsets: ['latin'],
});

const manrope = Manrope({
    variable: '--font-manrope',
    subsets: ['latin'],
});

export const metadata: Metadata = defaultMetadata;
export const viewport: Viewport = defaultViewport;

export default async function RootLayout({
    children,
    params,
}: Readonly<{
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}>) {
    const { locale } = await params;

    if (!routing.locales.includes(locale as any)) {
        notFound();
    }

    const messages = await getMessages();

    return (
        <html lang={locale} suppressHydrationWarning>
            <body className={`${inter.variable} ${manrope.variable} antialiased`}>
                <NextIntlClientProvider messages={messages}>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange
                    >
                        <div className="flex min-h-screen flex-col">
                            <Navbar />
                            <main className="flex-1">{children}</main>
                            <Footer />
                        </div>
                    </ThemeProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
