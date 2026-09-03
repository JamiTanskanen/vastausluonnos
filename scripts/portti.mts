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
import { teeLuonnos, type LuonnosTulos } from '../src/lib/luonnos/tee.ts'
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

function arvioi(t: LuonnosTulos): { lapi: boolean; huomio: string } {
    const odotus = t.viesti.odotus
    const tark = t.tarkistus
    const paatoksia = (tark?.avoimet ?? []).filter((a) => a.laji === 'paatos').length
    const vastattavuus = t.malli?.vastattavuus ?? '-'

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

async function aja() {
    console.log(`\nPORTTI — ${FIKSTUURIT.length} viestiä\n`)
    const tulokset: LuonnosTulos[] = []

    for (let i = 0; i < FIKSTUURIT.length; i += RINNAKKAIN) {
        const era = FIKSTUURIT.slice(i, i + RINNAKKAIN)
        const valmiit = await Promise.all(
            era.map(async (v) => {
                const t = await teeLuonnos(v)
                console.log(`  · ${v.id} valmis (${Math.round(t.kesto_ms / 1000)} s)`)
                return t
            })
        )
        tulokset.push(...valmiit)
    }

    console.log('\n' + '─'.repeat(96))
    console.log(
        'viesti'.padEnd(20) + 'odotus'.padEnd(14) + 'tulos'.padEnd(10) + 'huomio'
    )
    console.log('─'.repeat(96))

    let kaatui = 0
    let keksittyja = 0
    let taysia = 0

    for (const t of tulokset) {
        const { lapi, huomio } = arvioi(t)
        const viat = auditoi(t)
        keksittyja += viat.length
        if (t.tarkistus?.lahetyskelpoinen) taysia++
        if (!lapi || viat.length) kaatui++
        console.log(
            t.viesti.id.padEnd(22) +
                String(t.viesti.odotus).padEnd(14) +
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

    mkdirSync(new URL('../src/data/naytokset/', import.meta.url), { recursive: true })
    writeFileSync(
        new URL('../src/data/naytokset/index.json', import.meta.url),
        JSON.stringify(tulokset, null, 2) + '\n'
    )
    console.log('\nTulokset talletettu: src/data/naytokset/index.json')

    const ok = kaatui === 0 && keksittyja === 0 && riittavastiVastauksia
    console.log(ok ? '\nPORTTI: läpi\n' : '\nPORTTI: HYLÄTTY\n')
    process.exit(ok ? 0 : 1)
}

aja()
