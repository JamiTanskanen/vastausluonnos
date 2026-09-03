/**
 * Tietopohjan lähteet — kaikki Valuatumin JULKISIA sivuja.
 *
 * Mitään Valuatumin sisäistä dataa ei ole käytetty eikä tarvita: jokainen
 * fakta jonka luonnostelija saa käyttää on osoitettavissa julkiseen URLiin,
 * joka näkyy myös käyttöliittymässä.
 *
 * `tyyppi` on tässä tiedostossa se tärkein kenttä:
 *
 *   'snapshot' — sivun teksti indeksoidaan `npm run kb:hae` -ajolla ja
 *                talletetaan repoon. Sopii asioihin jotka eivät muutu
 *                viikossa: luokitusmetodologia, toimitusehdot, palveluehdot.
 *
 *   'elava'    — EI indeksoida. Haetaan vasta luonnosta tehtäessä.
 *                Sopii asioihin jotka voivat olla eri joka hetki tai jopa
 *                eri eri asiakkaalle. Ks. src/lib/kb/hinnat.ts.
 */

export type LahdeTyyppi = 'snapshot' | 'elava'

export interface Lahde {
    id: string
    url: string
    otsikko: string
    tyyppi: LahdeTyyppi
    /** Karsitaan navigaatio/footer pois: sisältö poimitaan näiden alta. */
    juuri?: string
}

export const LAHTEET: Lahde[] = [
    {
        id: 'faq',
        url: 'https://luottoriskit.fi/fi/faq/',
        otsikko: 'Luottoriskit.fi — Usein kysytyt kysymykset',
        tyyppi: 'snapshot',
    },
    {
        id: 'luottoriski',
        url: 'https://luottoriskit.fi/fi/luottoriski/',
        otsikko: 'Luottoriskit.fi — Luottoriski ja luottoriskiraportti',
        tyyppi: 'snapshot',
    },
    {
        id: 'toimitusehdot',
        url: 'https://luottoriskit.fi/fi/toimitus-ja-palautukset/',
        otsikko: 'Luottoriskit.fi — Toimitus ja palautukset',
        tyyppi: 'snapshot',
    },
    {
        id: 'palveluehdot',
        url: 'https://luottoriskit.fi/fi/terms/',
        otsikko: 'Luottoriskit.fi — Palveluehdot',
        tyyppi: 'snapshot',
    },
    {
        id: 'tietosuoja',
        url: 'https://luottoriskit.fi/fi/privacy-policy/',
        otsikko: 'Luottoriskit.fi — Tietosuojaseloste',
        tyyppi: 'snapshot',
    },
    {
        id: 'palvelu',
        url: 'https://luottoriskit.fi/fi/tietoa/',
        otsikko: 'Luottoriskit.fi — Tietoa palvelusta',
        tyyppi: 'snapshot',
    },
]

/**
 * Elävä lähde. Tämä on koko työn kannalta se kiinnostavin rivi: hinnat
 * eivät ole sivun tekstiä vaan rajapinta, jonka selain hakee joka latauksella
 * — ja jossa on tuotannossa A/B-koneisto, joka voi antaa eri kävijälle eri
 * hinnan. Siksi hintaa ei saa indeksoida. Ks. hinnat.ts.
 */
export const HINTALAHDE = {
    id: 'hinnat',
    url: 'https://luottoriskit.fi/pricing.json',
    otsikko: 'Luottoriskit.fi — voimassa olevat hinnat (pricing.json)',
    tyyppi: 'elava' as const,
}
