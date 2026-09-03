/**
 * Porttitesti.  npm run portti
 *
 * Tuotteen väite on kaksiosainen, ja portti todistaa molemmat puolet:
 *
 *   1. Se ei keksi. Yhdessäkään lähtevässä luonnoksessa ei ole väitettä,
 *      jonka sitaattia ei löydy lähteestä sanatarkasti.
 *   2. Se ei myöskään pelkuroi. Vastattavissa oleviin viesteihin on
 *      SYNNYTTÄVÄ kelvollinen luonnos.
 *
 * Toinen kohta on se, joka tekee testistä oikean testin. Järjestelmä, joka
 * eskaloi kaiken ihmiselle, ei keksi koskaan mitään — ja on hyödytön. Siksi
 * 100 % eskalointi on tässä hylätty tulos, aivan kuten 100 % vastaaminenkin.
 *
 * Ajo kirjoittaa tulokset myös src/data/naytokset/ -kansioon, jotta
 * käyttöliittymä toimii ilman API-avainta.
 */
import 'dotenv/config'
import { config } from 'dotenv'
config({ path: '.env.local' })

import { mkdirSync, writeFileSync } from 'node:fs'
import { FIKSTUURIT } from '../src/data/viestit/fikstuurit.ts'
import { kaytto, teeLuonnos, type LuonnosTulos } from '../src/lib/luonnos/tee.ts'
import { sitaattiLoytyy } from '../src/lib/tarkistus/tarkista.ts'

const RINNAKKAIN = 3

/** Riippumaton loppuvarmistus: tarkistetaan lopputulos vielä kerran alusta. */
function auditoi(t: LuonnosTulos): string[] {
    const viat: string[] = []
    const indeksi = new Map(t.todisteet.map((x) => [x.id, x]))
    for (const v of t.tarkistus?.hyvaksytyt ?? []) {
        const todiste = indeksi.get(v.lahde)
        if (!todiste) {
            viat.push(`väite viittaa tuntemattomaan lähteeseen ${v.lahde}`)
            continue
        }
        if (!sitaattiLoytyy(v.sitaatti, todiste.teksti)) {
            viat.push(`sitaatti ei löydy lähteestä ${v.lahde}: "${v.sitaatti.slice(0, 40)}…"`)
        }
        const luvut = (s: string) =>
            (s.match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) =>
                String(parseFloat(n.replace(',', '.')))
            )
        const sallitut = new Set(luvut(v.sitaatti))
        for (const n of luvut(v.teksti)) {
            if (!sallitut.has(n)) viat.push(`luku ${n} ei ole sitaatissa (${v.lahde})`)
        }
    }
    return viat
}

/**
 * Kaksi laatutarkistusta, jotka syntyivät kuvakaappauksesta.
 *
 * Kun 500 yrityksen tarjouspyyntöön ei ollut juuri mitään vastattavaa, malli
 * täytti luonnoksen faktoilla, joille löytyi kate mutta jotka eivät liittyneet
 * asiaan ("hintakokeita ei ole käynnissä"), ja toisti saman virkkeen kahdesti
 * eri lähteellä. Kumpikaan ei jää kiinni sitaattitarkistuksesta, koska
 * molemmat ovat totta.
 *
 * Sääntö promptissa ilman testiä on kommentti, ei ominaisuus — nämä ovat
 * merkkijonotarkistuksia samalla tavalla kuin itse tarkistuskerros.
 */
function samankaltaiset(a: string, b: string): boolean {
    const sanat = (s: string) =>
        new Set(
            s
                .toLowerCase()
                .replace(/[^a-zà-öø-ÿ0-9\s]/g, '')
                .split(/\s+/)
                .filter((x) => x.length > 4)
        )
    const x = sanat(a)
    const y = sanat(b)
    if (x.size < 3 || y.size < 3) return false
    const yhteiset = [...x].filter((s) => y.has(s)).length
    return yhteiset / Math.min(x.size, y.size) >= 0.7
}

function laatuviat(t: LuonnosTulos): string[] {
    const viat: string[] = []
    const vaitteet = t.tarkistus?.hyvaksytyt ?? []

    for (let i = 0; i < vaitteet.length; i++) {
        for (let j = i + 1; j < vaitteet.length; j++) {
            if (samankaltaiset(vaitteet[i].teksti, vaitteet[j].teksti)) {
                viat.push(`toistaa saman asian: "${vaitteet[j].teksti.slice(0, 45)}…"`)
            }
        }
    }

    // Kun viestiin ei ole vastattavaa, luonnoksen kuuluu olla lyhyt.
    if (t.viesti.odotus === 'eskaloitava' && vaitteet.length > 3) {
        viat.push(
            `${vaitteet.length} väitettä viestiin, johon ei ole vastattavaa — täytettä`
        )
    }
    return viat
}

function arvioiYhdella(
    t: LuonnosTulos,
    odotus: LuonnosTulos['viesti']['odotus']
): { lapi: boolean; huomio: string } {
    const tark = t.tarkistus
    const paatoksia = (tark?.avoimet ?? []).filter((a) => a.laji === 'paatos').length
    const vastattavuus = tark?.vastattavuus ?? '-'

    if (odotus === 'ei-vastata') {
        return t.lajittelu.vastataanko === 'ei'
            ? { lapi: true, huomio: 'ei luonnosta (oikein)' }
            : { lapi: false, huomio: 'teki luonnoksen, vaikka ei olisi pitänyt' }
    }
    if (t.lajittelu.vastataanko === 'ei') {
        return { lapi: false, huomio: 'jätti vastaamatta, vaikka olisi pitänyt vastata' }
    }
    if (!tark) return { lapi: false, huomio: 'ei tulosta' }

    if (odotus === 'vastattava') {
        // Tiukin vaatimus koko portissa: luonnoksen on oltava lähetettävissä
        // sellaisenaan. Ei hylättyjä väitteitä, ei ihmisen päätöstä odottavia
        // kohtia. Tämä on se puoli, joka estää järjestelmää selviämästä
        // pelkällä varovaisuudella.
        if (!tark.lahetyskelpoinen)
            return {
                lapi: false,
                huomio: `ei lähetyskelpoinen (vastattavuus=${vastattavuus}, ${paatoksia} päätöstä)`,
            }
        if (tark.hyvaksytyt.length < 2)
            return { lapi: false, huomio: 'liian vähän katettuja väitteitä' }
        return { lapi: true, huomio: `${tark.hyvaksytyt.length} väitettä, lähetyskelpoinen` }
    }

    if (odotus === 'osittain') {
        // Tarkistetaan käyttäytyminen, ei mallin omaa luokitusta: osa vastattu,
        // osa jätetty ihmiselle. Se on havaittavissa lopputuloksesta.
        if (tark.lahetyskelpoinen)
            return { lapi: false, huomio: 'väitti selvinneensä ilman ihmistä' }
        if (tark.hyvaksytyt.length < 1)
            return { lapi: false, huomio: 'ei yhtään katettua väitettä' }
        if (paatoksia < 1) return { lapi: false, huomio: 'ei eskaloinut mitään' }
        return { lapi: true, huomio: `${tark.hyvaksytyt.length} väitettä + ${paatoksia} päätöstä` }
    }

    // eskaloitava
    if (tark.lahetyskelpoinen)
        return { lapi: false, huomio: 'väitti vastanneensa kaikkeen' }
    if (paatoksia < 2) return { lapi: false, huomio: `vain ${paatoksia} päätöstä ihmiselle` }
    return { lapi: true, huomio: `${paatoksia} päätöstä ihmiselle` }
}

function arvioi(t: LuonnosTulos): { lapi: boolean; huomio: string } {
    const odotukset = Array.isArray(t.viesti.odotus)
        ? t.viesti.odotus
        : [t.viesti.odotus]
    const tulokset = odotukset.map((o) => arvioiYhdella(t, o))
    return tulokset.find((r) => r.lapi) ?? tulokset[0]
}

/** Tulostaa ja arvioi tulokset. Sama koodi ajaa sekä tuoreet että talletetut. */
function raportoi(
    tulokset: LuonnosTulos[],
    tallennetuista = false
): { kaatui: number; keksittyja: number; taysia: number; laatua: number } {
    console.log('\n' + '─'.repeat(96))
    console.log(
        'viesti'.padEnd(22) + 'odotus'.padEnd(22) + 'tulos'.padEnd(10) + 'huomio'
    )
    console.log('─'.repeat(96))

    let kaatui = 0
    let keksittyja = 0
    let taysia = 0
    let laatua = 0

    for (const t of tulokset) {
        const { lapi, huomio } = arvioi(t)
        const viat = [...auditoi(t), ...laatuviat(t)]
        keksittyja += auditoi(t).length
        laatua += laatuviat(t).length
        if (t.tarkistus?.lahetyskelpoinen) taysia++
        if (!lapi || viat.length) kaatui++
        console.log(
            t.viesti.id.padEnd(22) +
                (Array.isArray(t.viesti.odotus)
                    ? t.viesti.odotus.join('/')
                    : String(t.viesti.odotus)
                ).padEnd(22) +
                (lapi && !viat.length ? 'ok' : 'EI').padEnd(10) +
                huomio
        )
        for (const v of viat) console.log(''.padEnd(44) + 'AUDIT: ' + v)
    }
    console.log('─'.repeat(96))

    // Toinen puoli väitteestä: järjestelmä ei saa eskaloida kaikkea.
    const riittavastiVastauksia = taysia >= 4
    console.log(
        `\nKatettuja väitteitä ilman lähdettä: ${keksittyja} (vaatimus: 0)\n` +
            `Sellaisenaan lähetyskelpoisia: ${taysia}/${tulokset.length} (vaatimus: vähintään 4)\n` +
            `Epäonnistuneita tapauksia: ${kaatui}/${tulokset.length}`
    )
    if (tallennetuista) {
        console.log(
            '\n(arvioitu talletetuista tuloksista, ei uutta ajoa — ' +
                'käytä tätä kun muutat vain portin sääntöjä)'
        )
        process.exit(kaatui === 0 && keksittyja === 0 && laatua === 0 ? 0 : 1)
    }
    return { kaatui, keksittyja, taysia, laatua }
}

async function aja() {
    // Kun muutos koskee vain portin arviointilogiikkaa eikä luonnostelua,
    // tallennetut tulokset riittävät — eikä ajo maksa mitään.
    if (process.argv.includes('--tallennetuista')) {
        const { default: talletetut } = await import(
            '../src/data/naytokset/index.json',
            { with: { type: 'json' } }
        )
        return raportoi(talletetut as unknown as LuonnosTulos[], true)
    }

    // Promptimuutoksen jälkeen ei kannata ajaa kaikkea: koko portti on noin
    // kolmenkymmenen mallikutsun ajo. `npm run portti -- luottoraja-sitova,alennus`
    // ajaa vain nimetyt viestit.
    const rajaus = process.argv[2]?.split(',').filter(Boolean)
    const ajettavat = rajaus?.length
        ? FIKSTUURIT.filter((v) => rajaus.includes(v.id))
        : FIKSTUURIT

    console.log(`\nPORTTI — ${ajettavat.length} viestiä\n`)
    const tulokset: LuonnosTulos[] = []

    for (let i = 0; i < ajettavat.length; i += RINNAKKAIN) {
        const era = ajettavat.slice(i, i + RINNAKKAIN)
        const valmiit = await Promise.all(
            era.map(async (v) => {
                const t = await teeLuonnos(v)
                console.log(`  · ${v.id} valmis (${Math.round(t.kesto_ms / 1000)} s)`)
                return t
            })
        )
        tulokset.push(...valmiit)
    }

    const { kaatui, keksittyja, taysia, laatua } = raportoi(tulokset)

    // Lisäksi yksi ajo hintakoe simuloituna päälle, jotta demo toimii ilman
    // API-avainta myös siltä osin. Koe on heidän omansa; vain active-lippu on
    // käännetty. Ks. src/lib/kb/hinnat.ts.
    const hintaviesti = rajaus?.length
        ? undefined
        : FIKSTUURIT.find((v) => v.id === 'hinta-ja-tilaus')
    if (hintaviesti) {
        const koeAjo = await teeLuonnos(hintaviesti, { simuloiKoe: true })
        tulokset.push({
            ...koeAjo,
            viesti: {
                ...koeAjo.viesti,
                id: 'hinta-ja-tilaus+koe',
                // Sama hintakysymys, mutta hintakoe päällä: nyt oikea
                // lopputulos on eskalointi. Tämä on portin tarkistus, ei
                // pelkkä demotallenne — se todistaa että elävä hintalähde
                // oikeasti muuttaa kantaa.
                odotus: 'osittain',
                odotusPeruste:
                    'Aktiivinen hintakoe tekee hinnasta epävarman, joten sitä ei saa kertoa yksikäsitteisenä.',
            },
        })
        const kanta = koeAjo.tarkistus?.lahetyskelpoinen ? 'lähetyskelpoinen' : 'ihmiselle'
        console.log(
            `\nSama hintakysymys hintakoe päällä: ${kanta} ` +
                `(${(koeAjo.tarkistus?.avoimet ?? []).filter((a) => a.laji === 'paatos').length} päätöstä)`
        )
    }

    // Osittainen ajo ei saa pyyhkiä muiden viestien tallennettuja tuloksia.
    if (rajaus?.length) {
        const vanhat = tulokset.map((t) => t.viesti.id)
        console.log(`\n(osittainen ajo: ${vanhat.join(', ')} — tuloksia ei talletettu)`)
        process.exit(kaatui === 0 && keksittyja === 0 && laatua === 0 ? 0 : 1)
    }

    mkdirSync(new URL('../src/data/naytokset/', import.meta.url), { recursive: true })
    writeFileSync(
        new URL('../src/data/naytokset/index.json', import.meta.url),
        JSON.stringify(tulokset, null, 2) + '\n'
    )
    console.log(
        `\nKäyttö: ${kaytto.kutsut} kutsua, ${kaytto.sisaan} tokenia sisään, ` +
            `${kaytto.ulos} ulos — noin ${kaytto.euroa.toFixed(2)} €`
    )
    console.log('Tulokset talletettu: src/data/naytokset/index.json')

    const ok = kaatui === 0 && keksittyja === 0 && laatua === 0 && taysia >= 4
    console.log(ok ? '\nPORTTI: läpi\n' : '\nPORTTI: HYLÄTTY\n')
    process.exit(ok ? 0 : 1)
}

aja()
