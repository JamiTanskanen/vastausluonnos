import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
    title: 'Vastausluonnos',
    description:
        'Ankkuroitu sähköpostiluonnostelija jaettuun tukipostilaatikkoon. Jokainen väite on siteerattu julkiseen lähteeseen; kaiken muun se kysyy ihmiseltä.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="fi">
            <body>{children}</body>
        </html>
    )
}
