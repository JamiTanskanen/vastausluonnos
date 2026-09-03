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

/**
 * Mitä avoin asia tarvitsee — ja estääkö se lähettämisen.
 *
 * Tämä taulukko on korjaus vikaan, jonka vakaustesti löysi. Aluksi malli sai
 * itse päättää, estääkö avoin asia lähettämisen. Sama viesti meni silloin
 * kolmella peräkkäisellä ajolla kahdesti lähetettäväksi ja kerran ihmiselle:
 * kysymys "miksi meidän luokitus on heikko" on rajatapaus, koska siihen on
 * olemassa hyvä yleinen vastaus mutta ei asiakaskohtaista.
 *
 * Arpova varovaisuus on tuotteen kannalta pahempi vika kuin johdonmukainen
 * varovaisuus: käyttäjä ei voi oppia luottamaan siihen, milloin hänen pitää
 * lukea luonnos huolella.
 *
 * Ratkaisu on sama jako kuin oppimisessa: malli tulkitsee, sovellus päättää.
 * Malli kertoo vain, mitä asia tarvitsee — kiinteästä listasta. Estääkö se
 * lähettämisen, on tämän tiedoston päätös eikä mallin mielipide, ja siksi se on
 * yksikkötestattavissa.
 */
export const TARVITSEE = {
    hyvitys_tai_alennus: { estaa: true, kuvaus: 'Rahaa koskeva päätös' },
    juridinen_kannanotto: { estaa: true, kuvaus: 'Oikeudellinen kanta' },
    hinta_epavarma: { estaa: true, kuvaus: 'Hinta ei ole yksikäsitteinen' },
    lupaus_tai_aikataulu: { estaa: true, kuvaus: 'Sitoumus tulevasta' },
    jarjestelmatieto: { estaa: true, kuvaus: 'Tilaus- tai maksutieto järjestelmästä' },
    liiketoimintalinjaus: { estaa: true, kuvaus: 'Julkaisematon politiikka' },

    // Nämä eivät estä: luonnos on valmis ja lähetettävissä ilmankin.
    asiakkaan_omat_luvut: {
        estaa: false,
        kuvaus: 'Yrityskohtainen analyysi — yleinen vastaus riittää',
    },
    lisatieto_asiakkaalta: {
        estaa: false,
        kuvaus: 'Luonnos kysyy tiedon asiakkaalta itseltään',
    },
    vapaaehtoinen_lisays: { estaa: false, kuvaus: 'Idea, ei puute' },
} as const

export type Tarve = keyof typeof TARVITSEE

export interface Avoin {
    kysymys: string
    miksi: string
    /** Malli valitsee vain tämän. Seurauksen päättää koodi. */
    tarvitsee: string
    /** Koodin johtama: estääkö tämä lähettämisen. */
    laji?: 'paatos' | 'ehdotus'
}

/** Malli saa erehtyä listan ulkopuolelle; tuntematon tarve tulkitaan estäväksi. */
export function estaako(tarve: string): boolean {
    return TARVITSEE[tarve as Tarve]?.estaa ?? true
}

export interface MallinLuonnos {
    kieli: string
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
    /**
     * Johdettu rakenteesta, ei kysytty mallilta:
     *   'taysin'   = katettuja väitteitä, ei estäviä avoimia asioita
     *   'osittain' = katettuja väitteitä JA estäviä avoimia asioita
     *   'ei'       = ei yhtään katettua väitettä
     *
     * Aiemmin tämä oli mallin oma arvio, ja se oli viimeinen kohta, jossa sama
     * viesti saattoi saada eri kannan eri ajolla. Nyt kanta seuraa siitä, mitä
     * luonnoksessa oikeasti on.
     */
    vastattavuus: 'taysin' | 'osittain' | 'ei'
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
