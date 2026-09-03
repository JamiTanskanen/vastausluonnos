/**
 * Vakaustesti.  npm run vakaus
 *
 * Sama viesti kolme kertaa. Kysymys ei ole siitä, tuleeko sanasta sanaan sama
 * teksti — ei tule, eikä pidäkään. Kysymys on, pysyykö KANTA samana:
 *
 *   - meneekö sama viesti kerran lähetettäväksi ja toisella kerralla ihmiselle
 *   - pysyykö ankkurointi voimassa joka kerralla
 *
 * Sähköpostiassistentti, jonka varovaisuus arpoutuu, on pahempi kuin
 * johdonmukaisesti liian varovainen: käyttäjä ei voi oppia luottamaan siihen.
 */
import 'dotenv/config'
import { config } from 'dotenv'
config({ path: '.env.local' })

import { fikstuuri } from '../src/data/viestit/fikstuurit.ts'
import { teeLuonnos } from '../src/lib/luonnos/tee.ts'

const TESTATTAVAT = ['luottoraja-sitova', 'alennus', 'luokitusero']
const KIERROKSIA = 3

async function aja() {
    let kaatui = 0

    for (const id of TESTATTAVAT) {
        const viesti = fikstuuri(id)!
        const ajot = await Promise.all(
            Array.from({ length: KIERROKSIA }, () => teeLuonnos(viesti))
        )

        const kannat = ajot.map((t) =>
            t.lajittelu.vastataanko === 'ei'
                ? 'ei-luonnosta'
                : t.tarkistus!.lahetyskelpoinen
                  ? 'lähetyskelpoinen'
                  : 'ihmiselle'
        )
        const ankkurointi = ajot.every((t) => (t.tarkistus?.hylatyt.length ?? 0) === 0)
        const vaitteet = ajot.map((t) => t.tarkistus?.hyvaksytyt.length ?? 0)
        const vakaa = new Set(kannat).size === 1

        if (!vakaa || !ankkurointi) kaatui++
        console.log(
            `${id.padEnd(22)} kanta: ${kannat.join(' / ').padEnd(52)} ` +
                `väitteitä: ${vaitteet.join('/')}  ${vakaa && ankkurointi ? 'ok' : 'EI'}`
        )
    }

    console.log(
        kaatui === 0
            ? '\nVAKAUS: kanta pysyi samana kaikilla kierroksilla\n'
            : `\nVAKAUS: ${kaatui} viestissä kanta heitteli\n`
    )
    process.exit(kaatui === 0 ? 0 : 1)
}

aja()
