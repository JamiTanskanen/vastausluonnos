/**
 * Haku tietopohjasta. Tavallinen BM25, ei vektorikantaa.
 *
 * Miksi ei embeddingseja: tietopohja on 48 katkelmaa. Vektorikanta olisi
 * tässä koossa arkkitehtuurikoristelu, ja se veisi haulta sen ominaisuuden
 * josta tässä työssä on eniten hyötyä — haun voi lukea ja testata. Jos
 * katkelmia olisi 50 000, tämä vaihdettaisiin; rajapinta on sama.
 *
 * Suomen taivutus hoidetaan etuliitesovituksella: "luottoluokituksen",
 * "luottoluokitusta" ja "luottoluokitus" osuvat toisiinsa, koska niillä on
 * riittävän pitkä yhteinen alku. Se on karkea mutta läpinäkyvä, ja toimii
 * yhdyssanoilla paremmin kuin englantiin tehty stemmeri.
 */
import katkelmatJson from '@/data/kb/index.json'

export interface Katkelma {
    id: string
    lahde_id: string
    otsikko: string
    url: string
    teksti: string
    haettu: string
}

export const KATKELMAT = katkelmatJson as Katkelma[]

const SANAT = /[a-zà-öø-ÿ0-9]+/gi
/** Yleiset sanat joilla ei ole erottelukykyä. */
const TYHJAT = new Set([
    'ja','tai','sekä','että','joka','jotka','mutta','kun','jos','niin','myös',
    'olla','olen','onko','ovat','olisi','oli','ole','sen','sitä','sillä','tämä',
    'tämän','tässä','tuo','ne','he','me','te','minä','sinä','hän','voi','voiko',
    'mikä','mitä','miksi','miten','kuinka','koska','missä','mistä','mihin',
    'yritys','yrityksen','yrityksemme','hei','kiitos','terveisin','ystävällisin',
])

function pilkoSanoiksi(teksti: string): string[] {
    return (teksti.toLowerCase().match(SANAT) ?? [])
        .filter((s) => s.length >= 3 && !TYHJAT.has(s))
        .map((s) => s.slice(0, 12))
}

/** Osuvatko sanat toisiinsa taivutuksesta huolimatta? */
function osuu(kysely: string, doku: string): boolean {
    if (kysely === doku) return true
    const raja = Math.min(6, kysely.length, doku.length)
    if (raja < 5) return false
    return kysely.slice(0, raja) === doku.slice(0, raja)
}

interface Doku {
    katkelma: Katkelma
    sanat: string[]
    pituus: number
}

const DOKUT: Doku[] = KATKELMAT.map((k) => {
    const sanat = pilkoSanoiksi(`${k.otsikko} ${k.teksti}`)
    return { katkelma: k, sanat, pituus: sanat.length }
})
const KESKIPITUUS = DOKUT.reduce((s, d) => s + d.pituus, 0) / (DOKUT.length || 1)

export interface Osuma {
    katkelma: Katkelma
    pisteet: number
}

export function hae(kyselyt: string[], maara = 8): Osuma[] {
    const kyselySanat = [...new Set(kyselyt.flatMap(pilkoSanoiksi))]
    if (kyselySanat.length === 0) return []

    const k1 = 1.5
    const b = 0.75
    const pisteet = new Map<string, number>()

    for (const q of kyselySanat) {
        // Dokumenttifrekvenssi lasketaan samalla sovituksella kuin osumat,
        // muuten harvinaisuuspaino olisi väärä taivutetuille muodoille.
        const osuvat = DOKUT.filter((d) => d.sanat.some((s) => osuu(q, s)))
        if (osuvat.length === 0) continue
        const idf = Math.log(
            1 + (DOKUT.length - osuvat.length + 0.5) / (osuvat.length + 0.5)
        )
        for (const d of osuvat) {
            const tf = d.sanat.filter((s) => osuu(q, s)).length
            const paino =
                (tf * (k1 + 1)) /
                (tf + k1 * (1 - b + (b * d.pituus) / KESKIPITUUS))
            pisteet.set(
                d.katkelma.id,
                (pisteet.get(d.katkelma.id) ?? 0) + idf * paino
            )
        }
    }

    return [...pisteet.entries()]
        .map(([id, p]) => ({
            katkelma: KATKELMAT.find((k) => k.id === id)!,
            pisteet: Math.round(p * 1000) / 1000,
        }))
        .sort((a, b) => b.pisteet - a.pisteet)
        .slice(0, maara)
}
