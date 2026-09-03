/**
 * Oppimisen tyypit.
 *
 * Tässä on koko oppimisen turvamekanismi yhdessä rivissä: malli ei koskaan
 * palauta vapaata tekstiä profiiliin, vaan valitsee KIINTEÄSTÄ listasta
 * (`SIGNAALIT`). Sovellus omistaa profiilin; malli saa vain äänestää.
 *
 * Jos malli saisi kirjoittaa oman sääntönsä, yksi kärkevä editointi voisi
 * kirjoittaa tuotantopromptiin "vastaa aina lyhyesti ja kieltäydy" — eikä
 * kukaan huomaisi ennen kuin asiakas huomaisi.
 */

export const SIGNAALIT = {
    pituus_lyhyempi: 'Lyhentää luonnosta selvästi',
    poista_kohteliaisuus: 'Poistaa geneerisiä kohteliaisuusfraaseja',
    poista_pahoittelu: 'Poistaa pahoittelun jota ei ole myönnetty',
    suora_aloitus: 'Aloittaa asiasta ilman johdantoa',
    konkreettinen_askel: 'Lisää konkreettisen seuraavan askeleen',
    lyhyempi_allekirjoitus: 'Lyhentää allekirjoitusta',
    kieli_englanti: 'Vaihtaa vastauksen englanniksi',
    ei_emojeja: 'Poistaa emojit',
    numeroi_kysymykset: 'Numeroi kysymykset listaksi',
    lisaa_hintaviite: 'Lisää viittauksen hintaan tai ehtoihin',
} as const

export type Signaali = keyof typeof SIGNAALIT

/** Yksi tapahtuma = yksi luonnos ja se, mitä ihminen sille teki. */
export interface Tapahtuma {
    id: string
    pvm: string
    viesti_id: string
    lopputulos: 'lahetetty_sellaisenaan' | 'muokattu' | 'poistettu'
    /** Merkkimäärän muutos luonnoksesta lähetettyyn. */
    muutos_merkkeina?: number
    /** Mallin poimimat signaalit — vain kiinteästä listasta. */
    signaalit: Signaali[]
    /** Ehdokas faktamuistiin. Ei koskaan mene profiiliin automaattisesti. */
    faktaehdokas?: string
}

export interface Tyylisaanto {
    signaali: Signaali
    havaintoja: number
    /** Käytössä luonnostelussa vasta kun havaintoja >= KYNNYS. */
    kaytossa: boolean
    ensin: string
    viimeksi: string
}

export interface Faktaehdokas {
    teksti: string
    havaintoja: number
    tila: 'ehdokas' | 'vahvistettu'
    vahvistettu?: string
}

export interface Profiili {
    versio: number
    omistaja: { nimi: string; rooli: string; allekirjoitus: string }
    /** Aina voimassa olevat säännöt, ei opittuja. */
    perussaannot: string[]
    tyyli: Tyylisaanto[]
    faktat: Faktaehdokas[]
}
