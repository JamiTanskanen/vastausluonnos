/**
 * Elävä hintalähde.
 *
 * Luottoriskit.fi ei tarjoile hintoja sivun tekstinä vaan rajapintana:
 * selain hakee /pricing.json joka latauksella, ja tiedostossa on koneisto
 * hintakokeille (`experiments`), joissa kävijä arvotaan deviceId:n perusteella
 * varianttiin. Sivuston <head>issä oleva skripti sanoo sen suoraan:
 * variantti on "stable from the first paint".
 *
 * Sillä on yksi seuraus, joka on koko tämän prototyypin syy:
 *
 *   Kun hinta on kokeen alainen, "raportti maksaa 10 €" ei ole fakta
 *   yrityksestä vaan fakta yhdestä kävijästä.
 *
 * Sähköpostiassistentti, joka on opetellut hinnan promptista tai vanhoista
 * viesteistä, vastaa siis oikein vain sille osalle asiakkaita joka sattui
 * olemaan kontrolliryhmässä. Siksi hinta haetaan vasta luonnosta tehtäessä,
 * eikä sitä koskaan indeksoida tietopohjaan.
 */
import { HINTALAHDE } from './lahteet'

export interface Hinta {
    avain: string
    label: string
    cents: number
}

export interface Koe {
    id: string
    aktiivinen: boolean
    /** Variantin id → poikkeavat hinnat. */
    variantit: { id: string; osuus: number; hinnat: Hinta[]; kampanja?: string }[]
}

export interface Hinnasto {
    url: string
    haettu: string
    oletus: Hinta[]
    kokeet: Koe[]
    /**
     * Tosi, jos jokin aktiivinen koe muuttaa hintoja. Tämän lipun laskee
     * koodi, ei malli, ja se muuttaa luonnostelun sääntöjä: hintaa ei saa
     * kertoa yksikäsitteisenä, vaan se on kysyttävä tai luettava kuitista.
     */
    hintaVaihtelee: boolean
    /**
     * Tosi, kun demossa on pyydetty näyttämään miltä tilanne näyttää kokeen
     * ollessa päällä. Koe on heidän omansa, sellaisenaan tiedostosta luettuna
     * — vain `active`-lippu on käännetty. Näkyy myös käyttöliittymässä.
     */
    simuloitu: boolean
    /** Ihmisluettava todiste, jota vasten sitaatit tarkistetaan. */
    teksti: string
}

function hinnat(obj: Record<string, { cents: number; label: string }>): Hinta[] {
    return Object.entries(obj ?? {}).map(([avain, h]) => ({
        avain,
        label: h.label,
        cents: h.cents,
    }))
}

const SUOMEKSI: Record<string, string> = {
    credit_single: 'Luottotietoraportti (perusraportti)',
    ai_credit: 'AI-luottotietoraportti',
    credit_bundle: 'Luottotietoraportti, 3 kpl',
    ai_credit_bundle: 'AI-luottotietoraportti, 3 kpl',
    subscription: 'Kuukausitilaus, rajaton määrä raportteja',
    credit_limit: 'Luottorajasuositus erikseen',
    rating: 'Luottoluokitus erikseen',
    credit_limit_rating_bundle: 'Luottoraja + luokitus',
    financial_statement: 'Tilinpäätös',
    financial_statement_5y: 'Tilinpäätökset, 5 vuotta',
}

export function nimi(avain: string): string {
    return SUOMEKSI[avain] ?? avain
}

function kirjoitaTeksti(h: Omit<Hinnasto, 'teksti'>): string {
    const rivit = [
        `Luottoriskit.fi — voimassa olevat hinnat (haettu ${h.haettu.slice(0, 16).replace('T', ' ')})`,
        '',
        ...h.oletus.map((p) => `${nimi(p.avain)}: ${p.label}`),
    ]
    const aktiiviset = h.kokeet.filter((k) => k.aktiivinen)
    if (aktiiviset.length === 0) {
        rivit.push(
            '',
            'Hintakokeita ei ole käynnissä, joten yllä olevat hinnat koskevat kaikkia kävijöitä.'
        )
    } else {
        for (const k of aktiiviset) {
            rivit.push('', `KÄYNNISSÄ OLEVA HINTAKOE: ${k.id}.`)
            for (const v of k.variantit) {
                const osuus = Math.round(v.osuus * 100)
                const kuvaus = v.hinnat.length
                    ? v.hinnat.map((p) => `${nimi(p.avain)} ${p.label}`).join(', ')
                    : 'oletushinnat'
                rivit.push(`- variantti ${v.id} (${osuus} % kävijöistä): ${kuvaus}`)
                if (v.kampanja) rivit.push(`  kampanjateksti: ${v.kampanja}`)
            }
            rivit.push(
                'Asiakkaan näkemä hinta riippuu siitä mihin varianttiin hänen selaimensa on arvottu.'
            )
        }
    }
    return rivit.join('\n')
}

export async function haeHinnasto(
    asetukset: { simuloiKoe?: boolean } = {}
): Promise<Hinnasto | null> {
    try {
        const res = await fetch(HINTALAHDE.url, {
            headers: { 'User-Agent': 'vastausluonnos/0.1' },
            cache: 'no-store',
        })
        if (!res.ok) return null
        const raaka = (await res.json()) as any

        const kokeet: Koe[] = Object.entries(raaka.experiments ?? {}).map(
            ([id, k]: [string, any]) => ({
                id,
                aktiivinen: asetukset.simuloiKoe
                    ? (k.variants ?? []).some(
                          (v: any) => Object.keys(v.prices ?? {}).length > 0
                      )
                    : Boolean(k.active),
                variantit: (k.variants ?? []).map((v: any) => ({
                    id: v.id,
                    osuus: v.prob ?? 0,
                    hinnat: hinnat(v.prices),
                    kampanja: v.campaigns?.top_banner?.text,
                })),
            })
        )

        const runko = {
            url: HINTALAHDE.url,
            haettu: new Date().toISOString(),
            simuloitu: Boolean(asetukset.simuloiKoe),
            oletus: hinnat(raaka.default?.prices),
            kokeet,
            hintaVaihtelee: kokeet.some(
                (k) => k.aktiivinen && k.variantit.some((v) => v.hinnat.length > 0)
            ),
        }
        return { ...runko, teksti: kirjoitaTeksti(runko) }
    } catch {
        return null
    }
}
