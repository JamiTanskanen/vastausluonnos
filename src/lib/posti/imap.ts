/**
 * IMAP-adapteri. Testattu Gmailia vasten (app password + 2FA).
 *
 * Kaksi yksityiskohtaa, jotka ratkaisevat toimiiko tämä oikeasti:
 *
 * 1. Luonnoskansiota ei saa hakea nimellä. Gmailissa se on "[Gmail]/Luonnokset"
 *    suomenkielisessä käyttöliittymässä ja "[Gmail]/Drafts" englanninkielisessä.
 *    IMAP:n SPECIAL-USE-laajennus kertoo sen oikein: etsitään kansio, jonka
 *    lippu on \Drafts.
 *
 * 2. Luonnos pitää saada samaan keskusteluun. Siksi viestiin kirjoitetaan
 *    In-Reply-To ja References alkuperäisen Message-ID:llä, ja aihe on "Re: ...".
 *    Ilman näitä luonnos leijuu irrallaan eikä käyttäjä löydä sitä.
 */
import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'
import MailComposer from 'nodemailer/lib/mail-composer/index.js'
import type { Viesti } from '@/lib/luonnos/tyypit'
import type { PostiAdapteri } from './adapteri'

export interface ImapAsetukset {
    palvelin: string
    portti: number
    kayttaja: string
    salasana: string
}

/** Message-ID talteen, jotta vastaus osuu oikeaan ketjuun. */
const VIESTITUNNUKSET = new Map<string, string>()

export async function avaaImap(a: ImapAsetukset): Promise<PostiAdapteri & { asiakas: ImapFlow }> {
    const asiakas = new ImapFlow({
        host: a.palvelin,
        port: a.portti,
        secure: true,
        auth: { user: a.kayttaja, pass: a.salasana },
        logger: false,
    })
    await asiakas.connect()

    async function luonnoskansio(): Promise<string> {
        for (const kansio of await asiakas.list()) {
            if (kansio.specialUse === '\\Drafts') return kansio.path
        }
        // Varasuunnitelma, jos palvelin ei ilmoita SPECIAL-USE-lippuja.
        for (const nimi of ['[Gmail]/Drafts', '[Gmail]/Luonnokset', 'Drafts', 'Luonnokset']) {
            if (await asiakas.status(nimi, {}).then(() => true).catch(() => false)) return nimi
        }
        throw new Error('Luonnokset-kansiota ei löytynyt')
    }

    return {
        asiakas,

        async haeViestit(maara: number): Promise<Viesti[]> {
            const lukko = await asiakas.getMailboxLock('INBOX')
            try {
                const tila = asiakas.mailbox
                const yhteensa = typeof tila === 'object' ? tila.exists : 0
                if (!yhteensa) return []
                const alku = Math.max(1, yhteensa - maara + 1)
                const viestit: Viesti[] = []
                for await (const v of asiakas.fetch(`${alku}:*`, {
                    envelope: true,
                    source: true,
                    uid: true,
                })) {
                    const jasennetty = await simpleParser(v.source as Buffer)
                    const osoite = jasennetty.from?.value?.[0]
                    const id = String(v.uid)
                    if (jasennetty.messageId) VIESTITUNNUKSET.set(id, jasennetty.messageId)
                    viestit.push({
                        id,
                        lahettaja: {
                            nimi: osoite?.name || osoite?.address || 'tuntematon',
                            osoite: osoite?.address ?? '',
                        },
                        vastaanottaja: a.kayttaja,
                        aihe: jasennetty.subject ?? '(ei aihetta)',
                        saapunut: (jasennetty.date ?? new Date()).toISOString(),
                        runko: (jasennetty.text ?? '').trim().slice(0, 6000),
                    })
                }
                return viestit.reverse()
            } finally {
                lukko.release()
            }
        },

        async luoLuonnos(alkuperainen: Viesti, teksti: string): Promise<string> {
            const kansio = await luonnoskansio()
            const viittaus = VIESTITUNNUKSET.get(alkuperainen.id)
            const aihe = /^re:/i.test(alkuperainen.aihe)
                ? alkuperainen.aihe
                : `Re: ${alkuperainen.aihe}`

            const posti = new MailComposer({
                from: a.kayttaja,
                to: alkuperainen.lahettaja.osoite || a.kayttaja,
                subject: aihe,
                text: teksti,
                inReplyTo: viittaus,
                references: viittaus ? [viittaus] : undefined,
                headers: { 'X-Vastausluonnos': 'luonnos, ei lähetetty' },
            })
            const raaka: Buffer = await new Promise((resolve, reject) =>
                posti.compile().build((virhe: Error | null, viesti: Buffer) =>
                    virhe ? reject(virhe) : resolve(viesti)
                )
            )

            await asiakas.append(kansio, raaka, ['\\Draft', '\\Seen'])
            return kansio
        },

        async sulje() {
            await asiakas.logout()
        },
    }
}

export function gmailAsetukset(): ImapAsetukset {
    const kayttaja = process.env.GMAIL_KAYTTAJA
    const salasana = process.env.GMAIL_SALASANA
    if (!kayttaja || !salasana) {
        throw new Error(
            'GMAIL_KAYTTAJA ja GMAIL_SALASANA puuttuvat .env.local-tiedostosta'
        )
    }
    return {
        palvelin: 'imap.gmail.com',
        portti: 993,
        kayttaja,
        salasana: salasana.replace(/\s/g, ''),
    }
}
