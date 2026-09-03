/**
 * Tarkistuskerros. Tässä tiedostossa ei ole yhtään kielimallikutsua.
 *
 * Luottoapurissa periaate oli "koodi laskee, malli arvioi". Sähköpostissa
 * lasketaan harvoin, mutta väitetään paljon, joten sama jako on tässä:
 *
 *      KOODI TARKISTAA, MALLI KIRJOITTAA.
 *
 * Malli ei palauta valmista sähköpostia vaan väitteitä, joissa jokaisessa on
 * lähde ja sanatarkka sitaatti siitä. Tämän moduulin työ on kolme kysymystä,
 * joihin kaikkiin vastaa merkkijonovertailu — ei arviointi, ei toinen malli,
 * ei "arvioi luottamuksesi asteikolla 1–10":
 *
 *   1. Onko sitaatti oikeasti lähteessä?
 *   2. Esiintyykö jokainen väitteen luku sen omassa sitaatissa?
 *   3. Sisältääkö väite lupauksen, jota lähde ei anna?
 *
 * Se mikä ei läpäise, ei katoa: se muuttuu kysymykseksi ihmiselle. Luonnos
 * kutistuu, avoimet kysymykset kasvavat, eikä mitään keksittyä jää tekstiin.
 */
import {
    estaako,
    type MallinLuonnos,
    type Tarkistettu,
    type Todiste,
    type Vaite,
    type Hylatty,
    type Lukutarkistus,
} from '@/lib/luonnos/tyypit'

/** Välilyönnit, rivinvaihdot ja lainausmerkkityypit pois vertailun tieltä. */
function normalisoi(s: string): string {
    return s
        .toLowerCase()
        .replace(/[""«»]/g, '"')
        .replace(/['´`]/g, "'")
        .replace(/[   ]/g, ' ')
        .replace(/[–—]/g, '-')
        .replace(/\s+/g, ' ')
        .trim()
}

/**
 * Onko sitaatti lähteessä kirjaimellisesti?
 *
 * Sallitaan yksi vapaus: kolme pistettä tai ellipsi katkaisee sitaatin, jolloin
 * jokaisen osan on löydyttävä lähteestä ja oikeassa järjestyksessä. Ilman tätä
 * malli joutuisi lainaamaan kokonaisia kappaleita, ja pitkä sitaatti on
 * käytännössä löysempi tarkistus kuin kaksi lyhyttä oikeassa järjestyksessä.
 */
export function sitaattiLoytyy(sitaatti: string, lahde: string): boolean {
    const teksti = normalisoi(lahde)
    const osat = normalisoi(sitaatti)
        .split(/\s*(?:\.\.\.|…)\s*/)
        .map((o) => o.trim())
        .filter((o) => o.length > 0)
    if (osat.length === 0) return false

    let kohta = 0
    for (const osa of osat) {
        // Liian lyhyt pätkä osuisi mihin tahansa. 12 merkkiä on noin kaksi
        // suomen sanaa; sitä lyhyempi sitaatti ei todista mitään.
        if (osa.length < 12) return false
        const i = teksti.indexOf(osa, kohta)
        if (i === -1) return false
        kohta = i + osa.length
    }
    return true
}

/** Luvut vertailukelpoisiksi: "1,5" ja "1.5" ovat sama luku, "10 €" on 10. */
function luvut(s: string): string[] {
    const osumat = s.match(/\d+(?:[.,]\d+)?/g) ?? []
    return osumat.map((n) => String(parseFloat(n.replace(',', '.'))))
}

/**
 * Sitoumuslinttari.
 *
 * Toinen verkko sitaattitarkistuksen jälkeen, ja tarkoituksella tyhmä: lista
 * ensimmäisen persoonan lupauksia, jotka sitovat vastaanottajan johonkin.
 * Tällainen sanonta ei käytännössä esiinny ehtosivulla sanatarkasti — ehdot
 * sanovat "olet oikeutettu hyvitykseen", eivät "hyvitämme" — joten sääntö on:
 * lupaus sallitaan vain jos se on sitaatissa sellaisenaan.
 *
 * Tämä on se kohta, jossa tyylikloonaava assistentti tekee vahingon: se
 * kirjoittaa lämpimästi "hyvitämme raportin luonnollisesti", ja koska viesti
 * lähtee toimitusjohtajan nimissä, siitä tuli juuri yrityksen kanta.
 */
const LUPAUKSET = [
    'hyvitämme','palautamme rahat','palautamme summan','korjaamme','korjaan',
    'lupaamme','lupaan','takaamme','takaan','sitoudumme','järjestämme',
    'saat alennuksen','annamme alennuksen','tarjoamme alennusta','voimme tarjota',
    'soitan sinulle','soitamme','sovitaan tapaaminen','toimitamme huomenna',
    'ehdimme','hoidamme tämän','laitamme uuden raportin','peruutamme veloituksen',
]

export function lupauksia(teksti: string, sitaatti: string): string | null {
    const t = normalisoi(teksti)
    const s = normalisoi(sitaatti)
    for (const lupaus of LUPAUKSET) {
        const l = normalisoi(lupaus)
        if (t.includes(l) && !s.includes(l)) return lupaus
    }
    return null
}

export function tarkista(
    luonnos: MallinLuonnos,
    todisteet: Todiste[]
): Tarkistettu {
    const indeksi = new Map(todisteet.map((t) => [t.id, t]))

    const hyvaksytyt: Vaite[] = []
    const hylatyt: Hylatty[] = []
    const lukulista: Lukutarkistus[] = []

    for (const vaite of luonnos.vaitteet) {
        const todiste = indeksi.get(vaite.lahde)

        if (!todiste) {
            hylatyt.push({
                vaite,
                syy: `lähdettä "${vaite.lahde}" ei ollut annetussa aineistossa`,
            })
            continue
        }

        if (!sitaattiLoytyy(vaite.sitaatti, todiste.teksti)) {
            hylatyt.push({
                vaite,
                syy: `sitaattia ei löydy lähteestä ${todiste.id} sanatarkasti`,
            })
            continue
        }

        const lupaus = lupauksia(vaite.teksti, vaite.sitaatti)
        if (lupaus) {
            hylatyt.push({
                vaite,
                syy: `sisältää lupauksen "${lupaus}", jota lähde ei anna`,
            })
            continue
        }

        // Luvut: väitteen jokaisen luvun on oltava sen OMASSA sitaatissa.
        // Ensimmäinen versio salli luvun myös asiakkaan viestistä, ja
        // yksikkötesti kaatoi sen: kun asiakas kirjoitti maksaneensa 12 euroa,
        // malli sai luvan väittää hinnaksi 12 € vedoten hinnastoon. Asiakkaan
        // oma luku saa toistua vastauksessa, mutta silloin väitteen lähde on
        // ketju ja sitaatti on hänen omasta viestistään.
        // Sääntö on tiukka tarkoituksella: väärä euromäärä luottotuotteen
        // asiakastuessa on pahempi kuin puuttuva euromäärä.
        const sallitut = new Set(luvut(vaite.sitaatti))
        const puuttuvat = luvut(vaite.teksti).filter((n) => !sallitut.has(n))
        for (const n of luvut(vaite.teksti)) {
            lukulista.push({
                luku: n,
                ok: sallitut.has(n),
                missa: sallitut.has(n) ? todiste.id : undefined,
            })
        }
        if (puuttuvat.length > 0) {
            hylatyt.push({
                vaite,
                syy: `luku ${puuttuvat.join(', ')} ei esiinny lähteessä ${todiste.id}`,
            })
            continue
        }

        hyvaksytyt.push(vaite)
    }

    // Lajin päättää koodi mallin ilmoittaman tarpeen perusteella — ei malli
    // itse. Ks. TARVITSEE-taulukko ja sen perustelu tyypit.ts:ssä.
    const avoimet: Tarkistettu['avoimet'] = [
        ...luonnos.avoimet.map((a) => ({
            ...a,
            laji: (estaako(a.tarvitsee) ? 'paatos' : 'ehdotus') as 'paatos' | 'ehdotus',
            lahde: 'malli' as const,
        })),
        ...hylatyt.map((h) => ({
            kysymys: `Poistin virkkeen: "${h.vaite.teksti}"`,
            miksi: `${h.syy}. Jos tämä pitää sanoa, kirjoita se itse tai lisää lähde.`,
            tarvitsee: 'liiketoimintalinjaus' as const,
            laji: 'paatos' as const,
            lahde: 'tarkistus' as const,
        })),
    ]

    const teksti = [
        luonnos.tervehdys,
        '',
        ...hyvaksytyt.map((v) => v.teksti),
        '',
        luonnos.lopetus,
    ]
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()

    const estavia = avoimet.some((a) => a.laji === 'paatos')
    const vastattavuus =
        hyvaksytyt.length === 0 ? 'ei' : estavia ? 'osittain' : 'taysin'

    return {
        vastattavuus,
        hyvaksytyt,
        hylatyt,
        teksti,
        avoimet,
        luvut: lukulista,
        // Lähetyskelpoinen = ei hylkäyksiä eikä ihmisen päätöstä vaativia
        // kysymyksiä. Pelkkä ehdotus ei estä lähettämistä.
        lahetyskelpoinen: hylatyt.length === 0 && vastattavuus === 'taysin',
    }
}
