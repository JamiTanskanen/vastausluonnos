/**
 * Profiilin kokoaminen tapahtumalokista. Puhdasta koodia, ei mallikutsuja.
 *
 * Ero ChatGPT-tyyliseen "self-learning agent" -ideaan on tässä:
 *
 *   Malli tulkitsee signaalin. Sovellus päättää mitä siitä seuraa.
 *
 * Yksi editointi ei muuta mitään. Kolme samansuuntaista muuttaa. Ja faktat
 * eivät muutu koskaan ilman ihmisen nimenomaista vahvistusta, koska
 * "emme anna alennusta alle 20 raportin erissä" on yrityksen kanta — ei
 * kirjoitustyylin piirre, ja sen keksiminen väärin maksaa rahaa.
 */
import type { Profiili, Signaali, Tapahtuma, Tyylisaanto } from './tyypit'
import { SIGNAALIT } from './tyypit'

/** Montako samansuuntaista havaintoa tarvitaan ennen kuin sääntö otetaan käyttöön. */
export const KYNNYS = 3

export function kokoaTyyli(tapahtumat: Tapahtuma[]): Tyylisaanto[] {
    const kertymä = new Map<Signaali, string[]>()
    for (const t of [...tapahtumat].sort((a, b) => a.pvm.localeCompare(b.pvm))) {
        for (const s of t.signaalit) {
            if (!(s in SIGNAALIT)) continue // tuntematon signaali ei kelpaa
            kertymä.set(s, [...(kertymä.get(s) ?? []), t.pvm])
        }
    }
    return [...kertymä.entries()]
        .map(([signaali, pvmt]) => ({
            signaali,
            havaintoja: pvmt.length,
            kaytossa: pvmt.length >= KYNNYS,
            ensin: pvmt[0],
            viimeksi: pvmt[pvmt.length - 1],
        }))
        .sort((a, b) => b.havaintoja - a.havaintoja)
}

/** Profiiliversio = montako sääntöä on kertaalleen ylittänyt kynnyksen. */
export function kokoa(pohja: Profiili, tapahtumat: Tapahtuma[]): Profiili {
    const tyyli = kokoaTyyli(tapahtumat)
    return {
        ...pohja,
        versio: 1 + tyyli.filter((t) => t.kaytossa).length,
        tyyli,
    }
}

/** Käytössä olevat säännöt luonnostelun promptiin, ihmisluettavina. */
export function voimassaOlevatSaannot(profiili: Profiili): string[] {
    return profiili.tyyli
        .filter((t) => t.kaytossa)
        .map((t) => `${SIGNAALIT[t.signaali]} (${t.havaintoja} havaintoa)`)
}

/** Mittarit, joita tuotteesta oikeasti seurattaisiin. */
export function mittarit(tapahtumat: Tapahtuma[]) {
    const n = tapahtumat.length || 1
    const sellaisenaan = tapahtumat.filter(
        (t) => t.lopputulos === 'lahetetty_sellaisenaan'
    ).length
    const poistetut = tapahtumat.filter((t) => t.lopputulos === 'poistettu').length
    const muokatut = tapahtumat.filter((t) => t.lopputulos === 'muokattu')
    const keskimuutos =
        muokatut.length === 0
            ? 0
            : Math.round(
                  muokatut.reduce(
                      (s, t) => s + Math.abs(t.muutos_merkkeina ?? 0),
                      0
                  ) / muokatut.length
              )
    return {
        luonnoksia: tapahtumat.length,
        hyvaksyntaosuus: Math.round((sellaisenaan / n) * 100),
        poisto_osuus: Math.round((poistetut / n) * 100),
        keskimaarainen_muokkaus_merkkeina: keskimuutos,
    }
}
