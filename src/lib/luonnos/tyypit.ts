/** Yhteiset tyypit: saapunut viesti, mallin tuottama luonnos, tarkistuksen tulos. */

export interface Ketjuviesti {
    kirjoittaja: string
    aika: string
    runko: string
}

export interface Viesti {
    id: string
    lahettaja: { nimi: string; osoite: string }
    vastaanottaja: string
    aihe: string
    saapunut: string
    runko: string
    /** Aiemmat viestit samassa ketjussa, vanhin ensin. */
    ketju?: Ketjuviesti[]
    /** Vain fikstuureissa: mitä tästä viestistä on tarkoitus tapahtua. */
    odotus?: 'vastattava' | 'osittain' | 'eskaloitava' | 'ei-vastata'
    odotusPeruste?: string
}

/**
 * Malli ei kirjoita vapaata sähköpostia vaan väitteitä. Jokainen väite kantaa
 * oman lähteensä ja sanatarkan sitaatin siitä. Vasta koodi kasaa niistä
 * tekstin — ja vain niistä, jotka läpäisevät tarkistuksen.
 */
export interface Vaite {
    teksti: string
    /** Katkelman id, 'hinnat' (elävä lähde) tai 'ketju' (asiakkaan oma viesti). */
    lahde: string
    sitaatti: string
}

export interface Avoin {
    kysymys: string
    miksi: string
    /**
     * Kaikki avoimet asiat eivät ole samanarvoisia, ja tämä ero löytyi
     * porttitestistä: järjestelmä merkitsi kolme täysin vastattua viestiä
     * "osittaisiksi", koska se oli keksinyt niihin vapaaehtoisia lisäyksiä
     * ("tarjotaanko asiakkaalle läpikäyntiä?"). Se on ehdotus, ei este.
     *
     *   'paatos'   = vaatii ihmisen päätöksen tai pääsyn johonkin (hyvitys,
     *                alennus, juridiikka, tilaustietojen tarkistus).
     *                Estää lähettämisen sellaisenaan.
     *   'ehdotus'  = luonnos on valmis ilman tätäkin; tämä on vain idea.
     */
    laji: 'paatos' | 'ehdotus'
}

export interface MallinLuonnos {
    kieli: string
    vastattavuus: 'taysin' | 'osittain' | 'ei'
    tervehdys: string
    vaitteet: Vaite[]
    lopetus: string
    avoimet: Avoin[]
    /** Kenelle viesti kuuluisi, jos ei vastaanottajalle itselleen. */
    reititys?: string
}

export interface Hylatty {
    vaite: Vaite
    syy: string
}

export interface Lukutarkistus {
    luku: string
    ok: boolean
    missa?: string
}

export interface Tarkistettu {
    hyvaksytyt: Vaite[]
    hylatyt: Hylatty[]
    /** Lopullinen, lähetettävä teksti. Sisältää vain hyväksytyt väitteet. */
    teksti: string
    avoimet: (Avoin & { lahde: 'malli' | 'tarkistus' })[]
    luvut: Lukutarkistus[]
    /** Kaikki tarkistukset läpi eikä avoimia kysymyksiä → voi lähettää sellaisenaan. */
    lahetyskelpoinen: boolean
}

export interface Todiste {
    id: string
    otsikko: string
    url: string
    teksti: string
    haettu: string
    /** 'kb' = indeksoitu sivu, 'elava' = haettu juuri nyt, 'ketju' = asiakkaan viesti. */
    laji: 'kb' | 'elava' | 'ketju'
}
