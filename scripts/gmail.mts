/**
 * Oikea postilaatikko.  npm run gmail -- <komento>
 *
 *   npm run gmail -- lista               näytä 10 uusinta saapunutta
 *   npm run gmail -- vastaa              luonnostele uusimpaan ja kirjoita Luonnoksiin
 *   npm run gmail -- vastaa <uid>        luonnostele tiettyyn viestiin
 *   npm run gmail -- fikstuuri <id>      luonnostele fikstuuriviestiin (tyhjä postilaatikko käy)
 *
 * Tämä on koko työn ainoa kohta, joka koskee oikeaa sähköpostia — ja se tekee
 * vain yhden kirjoitusoperaation: APPEND Luonnokset-kansioon. Lähetystoimintoa
 * ei ole toteutettu, ei edes kytkettynä pois: sitä ei ole olemassa.
 */
import 'dotenv/config'
import { config } from 'dotenv'
config({ path: '.env.local' })

import { avaaImap, gmailAsetukset } from '../src/lib/posti/imap.ts'
import { teeLuonnos } from '../src/lib/luonnos/tee.ts'
import { fikstuuri, FIKSTUURIT } from '../src/data/viestit/fikstuurit.ts'
import type { Viesti } from '../src/lib/luonnos/tyypit.ts'

function tulostaLuonnos(t: Awaited<ReturnType<typeof teeLuonnos>>) {
    console.log('\n' + '─'.repeat(72))
    console.log(t.tarkistus?.teksti ?? '(ei luonnosta)')
    console.log('─'.repeat(72))
    const paatokset = (t.tarkistus?.avoimet ?? []).filter((a) => a.laji === 'paatos')
    if (paatokset.length) {
        console.log('\nTarvitsen sinulta ennen lähetystä:')
        paatokset.forEach((a, i) => console.log(`  ${i + 1}. ${a.kysymys}\n     ${a.miksi}`))
    }
    console.log(
        `\nväitteitä ${t.tarkistus?.hyvaksytyt.length ?? 0}, ` +
            `hylättyjä ${t.tarkistus?.hylatyt.length ?? 0}, ` +
            `lähetyskelpoinen: ${t.tarkistus?.lahetyskelpoinen ? 'kyllä' : 'ei'}`
    )
}

async function aja() {
    const [komento = 'lista', arvo] = process.argv.slice(2)
    const posti = await avaaImap(gmailAsetukset())
    console.log(`Yhdistetty: ${gmailAsetukset().kayttaja}`)

    try {
        if (komento === 'lista') {
            const viestit = await posti.haeViestit(10)
            if (!viestit.length) return console.log('Saapuneet on tyhjä.')
            for (const v of viestit) {
                console.log(
                    `  uid ${v.id.padEnd(6)} ${v.saapunut.slice(0, 16).replace('T', ' ')}  ` +
                        `${v.lahettaja.nimi.slice(0, 24).padEnd(26)} ${v.aihe.slice(0, 50)}`
                )
            }
            console.log('\nLuonnostele: npm run gmail -- vastaa <uid>')
            return
        }

        let viesti: Viesti | undefined
        if (komento === 'fikstuuri') {
            viesti = fikstuuri(arvo ?? '')
            if (!viesti) {
                console.log('Tunnetut fikstuurit: ' + FIKSTUURIT.map((f) => f.id).join(', '))
                return
            }
            // Luonnos kirjoitetaan omaan postilaatikkoon, joten vastaanottaja
            // on käyttäjä itse — fikstuurin lähettäjä ei ole oikea henkilö.
            viesti = { ...viesti, lahettaja: { ...viesti.lahettaja, osoite: '' } }
        } else if (komento === 'vastaa') {
            const viestit = await posti.haeViestit(10)
            viesti = arvo ? viestit.find((v) => v.id === arvo) : viestit[0]
            if (!viesti) return console.log('Viestiä ei löytynyt.')
        } else {
            return console.log('Komennot: lista | vastaa [uid] | fikstuuri <id>')
        }

        console.log(`\nViesti: ${viesti.lahettaja.nimi} — ${viesti.aihe}`)
        const tulos = await teeLuonnos(viesti)

        if (tulos.lajittelu.vastataanko === 'ei') {
            console.log(
                `\nEi luonnosta. Luokka: ${tulos.lajittelu.luokka}. ${tulos.lajittelu.syy}\n` +
                    'Tämä on lopputulos, ei virhe.'
            )
            return
        }

        tulostaLuonnos(tulos)
        const kansio = await posti.luoLuonnos(viesti, tulos.tarkistus!.teksti)
        console.log(`\nLuonnos kirjoitettu kansioon: ${kansio}`)
        console.log('Avaa Gmail → Luonnokset. Mitään ei ole lähetetty.')
    } finally {
        await posti.sulje()
    }
}

aja()
