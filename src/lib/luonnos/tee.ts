/**
 * Luonnosteluputki.
 *
 *   saapunut viesti
 *     → 1. lajittelu:  kannattaako vastata, ja millä hakusanoilla haetaan
 *     → 2. haku:       tietopohja (indeksoitu) + hinnasto (haetaan juuri nyt)
 *     → 3. luonnos:    malli kirjoittaa väitteitä, ei sähköpostia
 *     → 4. tarkistus:  koodi todentaa jokaisen sitaatin ja luvun
 *     → luonnos + avoimet kysymykset ihmiselle
 *
 * Mallikutsuja on kaksi, ja ne on eroteltu tarkoituksella: lajittelu on halpa
 * ja saa tehdä ison osan työstä (myös hakusanat, koska taivutus on suomessa
 * hankalaa), kun taas luonnostelu saa nähdä vain todisteet.
 */
import Anthropic from '@anthropic-ai/sdk'
import { hae } from '@/lib/haku/hae'
import { haeHinnasto, type Hinnasto } from '@/lib/kb/hinnat'
import { HINTALAHDE } from '@/lib/kb/lahteet'
import { tarkista } from '@/lib/tarkistus/tarkista'
import { kokoa } from '@/lib/oppiminen/kokoa'
import { PROFIILIPOHJA } from '@/data/profiili'
import { SIEMENTAPAHTUMAT } from '@/data/tapahtumat'
import {
    LAJITTELUMALLI,
    LAJITTELUOHJE,
    LAJITTELUSKEEMA,
    LUONNOSSKEEMA,
    MALLI,
    luonnosteluohje,
    todisteetTekstiksi,
    viestiTekstiksi,
} from './prompt'
import type {
    MallinLuonnos,
    Tarkistettu,
    Todiste,
    Viesti,
} from './tyypit'

export interface Lajittelu {
    vastataanko: 'kylla' | 'ei'
    luokka: string
    syy: string
    hakusanat: string[]
}

export interface Korjaus {
    /** Montako väitettä hylättiin ensimmäisellä kierroksella. */
    hylattyja: number
    /** Montako niistä saatiin korjattua siten että tarkistus meni läpi. */
    korjattuja: number
}

export interface LuonnosTulos {
    viesti: Viesti
    lajittelu: Lajittelu
    todisteet: Todiste[]
    hinnastoHaettu: boolean
    hintaVaihtelee: boolean
    hinnastoSimuloitu: boolean
    malli: MallinLuonnos | null
    tarkistus: Tarkistettu | null
    korjaus: Korjaus | null
    kesto_ms: number
}

function asiakas(): Anthropic {
    return new Anthropic()
}

/** Kertyneet token-määrät ajon ajalta, jotta hinta on mitattu eikä arvattu. */
export const kaytto = {
    kutsut: 0,
    sisaan: 0,
    ulos: 0,
    /** Karkea hinta euroina; hinnat per miljoona tokenia. */
    euroa: 0,
}

const HINNAT: Record<string, { sisaan: number; ulos: number }> = {
    'claude-opus-5': { sisaan: 5, ulos: 25 },
    'claude-haiku-4-5': { sisaan: 1, ulos: 5 },
}

/** JSON-vastaus mallilta annetulla skeemalla. */
async function kysy<T>(
    ohje: string,
    sisalto: string,
    skeema: object,
    effort: 'low' | 'medium' | 'high',
    malli: string = MALLI
): Promise<T> {
    // effort on Opus 5:n säädin; Haiku 4.5 ei tunne sitä ja palauttaa 400.
    const output_config: Record<string, unknown> = {
        format: { type: 'json_schema', schema: skeema },
    }
    if (malli.startsWith('claude-opus')) output_config.effort = effort

    const vastaus = await asiakas().messages.create({
        model: malli,
        max_tokens: 8000,
        system: ohje,
        output_config,
        messages: [{ role: 'user', content: sisalto }],
    } as any)

    const k = vastaus.usage
    const hinta = HINNAT[malli] ?? HINNAT['claude-opus-5']
    kaytto.kutsut++
    kaytto.sisaan += k.input_tokens
    kaytto.ulos += k.output_tokens
    kaytto.euroa +=
        (k.input_tokens / 1e6) * hinta.sisaan + (k.output_tokens / 1e6) * hinta.ulos

    const teksti = vastaus.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('')
    return JSON.parse(teksti) as T
}

export function nykyinenProfiili() {
    return kokoa(PROFIILIPOHJA, SIEMENTAPAHTUMAT)
}

export async function teeLuonnos(
    viesti: Viesti,
    asetukset: { simuloiKoe?: boolean } = {}
): Promise<LuonnosTulos> {
    const alku = Date.now()
    const profiili = nykyinenProfiili()

    // 1. Kannattaako vastata? Tämä on oma askeleensa, koska "älä tee mitään"
    //    on oikea vastaus useammin kuin tuotteet yleensä myöntävät.
    const lajittelu = await kysy<Lajittelu>(
        LAJITTELUOHJE,
        viestiTekstiksi(viesti),
        LAJITTELUSKEEMA,
        'low',
        LAJITTELUMALLI
    )

    if (lajittelu.vastataanko === 'ei') {
        return {
            viesti,
            lajittelu,
            todisteet: [],
            hinnastoHaettu: false,
            hintaVaihtelee: false,
            hinnastoSimuloitu: false,
            malli: null,
            tarkistus: null,
            korjaus: null,
            kesto_ms: Date.now() - alku,
        }
    }

    // 2. Todisteet. Hinnasto haetaan aina, koska hintakysymys voi olla
    //    piilossa keskellä muuta asiaa — ja koska vanhentunut hinta on juuri
    //    se virhe, jota tämä työ yrittää estää.
    const hinnasto: Hinnasto | null = await haeHinnasto({
        simuloiKoe: asetukset.simuloiKoe,
    })

    // Hakusanat mallilta JA asiakkaan oma teksti. Ensimmäinen versio luotti
    // pelkkiin hakusanoihin, ja se hukkasi heti tärkeimmän osuman: hyvitystä
    // vaatinut asiakas vertasi luokitusta Asiakastietoon, mutta malli tiivisti
    // sen hakusanoiksi "raportin reklamaatio" ja "luokituksen oikaisu" — jolloin
    // FAQ:n vastaus asteikkojen erosta jäi löytymättä. Asiakkaan omat sanat
    // ovat usein paras hakusana, koska hän käyttää samoja termejä kuin ohjesivu.
    const osumat = hae(
        [...lajittelu.hakusanat, viesti.aihe, viesti.runko],
        10
    )

    const todisteet: Todiste[] = [
        ...osumat.map((o) => ({
            id: o.katkelma.id,
            otsikko: o.katkelma.otsikko,
            url: o.katkelma.url,
            teksti: o.katkelma.teksti,
            haettu: o.katkelma.haettu,
            laji: 'kb' as const,
        })),
        ...(hinnasto
            ? [
                  {
                      id: 'hinnat',
                      otsikko: HINTALAHDE.otsikko,
                      url: HINTALAHDE.url,
                      teksti: hinnasto.teksti,
                      haettu: hinnasto.haettu,
                      laji: 'elava' as const,
                  },
              ]
            : []),
        {
            id: 'ketju',
            otsikko: `Asiakkaan viesti: ${viesti.aihe}`,
            url: '',
            teksti: viestiTekstiksi(viesti),
            haettu: viesti.saapunut,
            laji: 'ketju' as const,
        },
    ]

    // 3. Luonnos.
    const ohje = luonnosteluohje(profiili)
    const hintaVaroitus =
        hinnasto?.hintaVaihtelee === true
            ? '\n\nHUOMIO: hintalähteessä on käynnissä oleva hintakoe. Hinta ei ole ' +
              'tällä hetkellä yksikäsitteinen, vaan riippuu siitä mihin varianttiin ' +
              'asiakas on arvottu. Älä kerro yhtä hintaa varmana. Tämä on avoin kysymys ihmiselle.'
            : ''

    const malli = await kysy<MallinLuonnos>(
        ohje + hintaVaroitus,
        `# Todisteet\n\n${todisteetTekstiksi(todisteet)}\n\n# Saapunut viesti\n\n${viestiTekstiksi(viesti)}`,
        LUONNOSSKEEMA,
        'medium'
    )

    // 4. Tarkistus.
    let tulos: Tarkistettu = tarkista(malli, todisteet)
    let korjaus: Korjaus | null = null

    // 4b. Yksi korjauskierros.
    //
    // Tarkistus ei ole vain portti vaan myös palaute. Tavallisin hylkäyssyy ei
    // ole keksitty fakta vaan liian lyhyt sitaatti: malli kirjoittaa virkkeen,
    // jossa on kaksi lukua, ja lainaa lähteestä vain toisen. Sellainen väite on
    // usein tosi, ja se kannattaa yrittää pelastaa — mutta vain siten, että
    // sama tarkistus ajetaan uudelleen. Malli ei siis saa yhtään enempää
    // valtaa, se saa yhden mahdollisuuden näyttää lähteensä kunnolla.
    if (tulos.hylatyt.length > 0) {
        const pyynto = `Seuraavat väitteet EIVÄT läpäisseet tarkistusta ja jäivät pois luonnoksesta:

${tulos.hylatyt
    .map(
        (h, i) =>
            `${i + 1}. väite: ${JSON.stringify(h.vaite.teksti)}\n   sitaatti: ${JSON.stringify(h.vaite.sitaatti)}\n   lähde: ${h.vaite.lahde}\n   syy: ${h.syy}`
    )
    .join('\n\n')}

Korjaa ne. Yleisin syy on liian suppea sitaatti: jos väitteessä on luku, sen on
oltava sitaatissa — lainaa pidemmältä tai jaa väite kahdeksi.

Jos väitettä ei voi korjata niin että sitaatti on lähteessä sanatarkasti, JÄTÄ SE POIS
ja lisää sen sijaan avoin kysymys ihmiselle.

Palauta pelkästään korjatut väitteet (kentässä "vaitteet") ja mahdolliset uudet
avoimet kysymykset. Älä toista jo hyväksyttyjä väitteitä.`

        const korjattu = await kysy<MallinLuonnos>(
            ohje + hintaVaroitus,
            `# Todisteet\n\n${todisteetTekstiksi(todisteet)}\n\n# Saapunut viesti\n\n${viestiTekstiksi(viesti)}\n\n# Korjauspyyntö\n\n${pyynto}`,
            LUONNOSSKEEMA,
            'medium'
        )

        const toinen = tarkista(
            { ...malli, vaitteet: korjattu.vaitteet, avoimet: korjattu.avoimet },
            todisteet
        )

        korjaus = {
            hylattyja: tulos.hylatyt.length,
            korjattuja: toinen.hyvaksytyt.length,
        }

        tulos = tarkista(
            {
                ...malli,
                vaitteet: [...tulos.hyvaksytyt, ...toinen.hyvaksytyt],
                avoimet: [...malli.avoimet, ...korjattu.avoimet],
            },
            todisteet
        )
        // Hylätyt, joita ei saatu korjattua, jäävät näkyviin kysymyksinä.
        tulos.hylatyt = toinen.hylatyt
        tulos.avoimet = [
            ...tulos.avoimet,
            ...toinen.hylatyt.map((h) => ({
                kysymys: `Poistin virkkeen: "${h.vaite.teksti}"`,
                miksi: `${h.syy}. Korjausyritys ei auttanut.`,
                tarvitsee: 'liiketoimintalinjaus' as const,
                laji: 'paatos' as const,
                lahde: 'tarkistus' as const,
            })),
        ]
        tulos.vastattavuus =
            tulos.hyvaksytyt.length === 0
                ? 'ei'
                : tulos.avoimet.some((a) => a.laji === 'paatos')
                  ? 'osittain'
                  : 'taysin'
        tulos.lahetyskelpoinen =
            tulos.hylatyt.length === 0 && tulos.vastattavuus === 'taysin'
    }

    return {
        viesti,
        lajittelu,
        todisteet,
        hinnastoHaettu: hinnasto !== null,
        hintaVaihtelee: hinnasto?.hintaVaihtelee ?? false,
        hinnastoSimuloitu: hinnasto?.simuloitu ?? false,
        malli,
        tarkistus: tulos,
        korjaus,
        kesto_ms: Date.now() - alku,
    }
}
