/**
 * Hakee tietopohjan Valuatumin julkisilta sivuilta ja kirjoittaa sen
 * tiedostoon src/data/kb/index.json.
 *
 *   npm run kb:hae
 *
 * Tietopohjaa EI ole kirjoitettu käsin. Se on heidän oma sivustonsa, sanasta
 * sanaan, ja jokaisella katkelmalla on julkinen URL ja hakuaika. Tämä on
 * tarkoituksellista kahdesta syystä:
 *
 *   1. Sitaattitarkistus (src/lib/tarkistus) vertaa mallin sitaattia tähän
 *      tekstiin kirjaimellisesti. Jos teksti olisi käsin tiivistetty, tarkistus
 *      todistaisi vain että malli osaa lainata minun tiivistelmääni.
 *
 *   2. Faktat vanhenevat. `haettu`-aikaleima kulkee luonnokseen asti, joten
 *      käyttäjä näkee milloin väitteen lähde on viimeksi luettu.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { parse } from 'node-html-parser'
import { LAHTEET, type Lahde } from '../src/lib/kb/lahteet.ts'

export interface Katkelma {
    id: string
    lahde_id: string
    otsikko: string
    /** Julkinen, klikattava URL — ankkurilla jos sivulla on sellainen. */
    url: string
    teksti: string
    haettu: string
}

const UA = 'vastausluonnos-kb/0.1 (rekrytehtävän prototyyppi; julkiset sivut)'

/** HTML-solmu → siistiä tekstiä. Ei fiksuja temppuja: rivinvaihdot lohkoista. */
function teksti(node: any): string {
    const raaka = node.structuredText ?? node.text ?? ''
    return raaka
        .replace(/ /g, ' ')
        .split('\n')
        .map((r: string) => r.trim())
        .filter(Boolean)
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
}

/** Otsikko → luettava tunniste. Sitaattien lähdeviite näkyy myös UI:ssa. */
function slug(s: string): string {
    return s
        .toLowerCase()
        .replace(/[äå]/g, 'a')
        .replace(/ö/g, 'o')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .split('-')
        .slice(0, 7)
        .join('-')
}

/** Osiot joita ei kannata indeksoida: lomakkeet, evästebannerit, navigaatio. */
const OHITA = /^(anna palautetta|kiitos palautteesta|evästeet|hae yritystä)/i

function pilko(html: string, lahde: Lahde, haettu: string): Katkelma[] {
    const juuri = parse(html)
    const main = juuri.querySelector('main') ?? juuri
    main.querySelectorAll('script,style,noscript,form,nav,footer').forEach((n) =>
        n.remove()
    )

    const katkelmat: Katkelma[] = []

    // 1) FAQ-tyyliset <details>-elementit ovat valmiiksi täydellisiä
    //    katkelmia: yksi kysymys + yksi vastaus, ja niillä on oma ankkuri.
    for (const d of main.querySelectorAll('details')) {
        const kysymys = teksti(d.querySelector('summary'))
        const vastaus = teksti(d.querySelector('.faq-answer') ?? d)
            .replace(kysymys, '')
            .trim()
        if (!kysymys || vastaus.length < 40) continue
        const ankkuri = d.getAttribute('id')
        katkelmat.push({
            id: `${lahde.id}#${slug(kysymys) || katkelmat.length}`,
            lahde_id: lahde.id,
            otsikko: kysymys,
            url: ankkuri ? `${lahde.url}#${ankkuri}` : lahde.url,
            teksti: `${kysymys}\n\n${vastaus}`,
            haettu,
        })
        d.remove()
    }

    // 2) Loput: pilkotaan otsikoiden kohdalta. Otsikko kulkee mukaan, koska
    //    "Palautukset" ilman otsikkoa on hakukoneelle näkymätön.
    const lohkot = main.querySelectorAll('h1,h2,h3,p,li,td,th')
    let nykyinen: { otsikko: string; rivit: string[] } | null = null
    const talleta = () => {
        if (!nykyinen) return
        const runko = nykyinen.rivit.join('\n').trim()
        if (runko.length >= 60 && !OHITA.test(nykyinen.otsikko)) {
            katkelmat.push({
                id: `${lahde.id}#${slug(nykyinen.otsikko) || katkelmat.length}`,
                lahde_id: lahde.id,
                otsikko: nykyinen.otsikko,
                url: lahde.url,
                teksti: `${nykyinen.otsikko}\n\n${runko}`,
                haettu,
            })
        }
        nykyinen = null
    }
    for (const el of lohkot) {
        const t = teksti(el)
        if (!t) continue
        if (/^h[1-3]$/i.test(el.tagName ?? '')) {
            talleta()
            nykyinen = { otsikko: t, rivit: [] }
        } else if (nykyinen) {
            if (!nykyinen.rivit.includes(t)) nykyinen.rivit.push(t)
        }
    }
    talleta()

    return katkelmat
}

async function aja() {
    const haettu = new Date().toISOString()
    const kaikki: Katkelma[] = []

    for (const lahde of LAHTEET) {
        process.stdout.write(`  ${lahde.url} … `)
        try {
            const res = await fetch(lahde.url, { headers: { 'User-Agent': UA } })
            if (!res.ok) {
                console.log(`HTTP ${res.status} — ohitetaan`)
                continue
            }
            const osat = pilko(await res.text(), lahde, haettu)
            kaikki.push(...osat)
            console.log(`${osat.length} katkelmaa`)
        } catch (e) {
            console.log(`virhe: ${(e as Error).message}`)
        }
    }

    mkdirSync(new URL('../src/data/kb/', import.meta.url), { recursive: true })
    writeFileSync(
        new URL('../src/data/kb/index.json', import.meta.url),
        JSON.stringify(kaikki, null, 2) + '\n'
    )
    const merkkeja = kaikki.reduce((s, k) => s + k.teksti.length, 0)
    console.log(
        `\n${kaikki.length} katkelmaa, ${merkkeja} merkkiä → src/data/kb/index.json`
    )
}

aja()
