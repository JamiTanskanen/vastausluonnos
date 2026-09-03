/**
 * Postilaatikkoadapteri.
 *
 * En halunnut olettaa mitään kenenkään sähköpostialustasta, joten integraatio
 * on rajapinta ja referenssitoteutus on IMAP. IMAP on ainoa protokolla, joka
 * toimii sellaisenaan Microsoft 365:ssä, Google Workspacessa ja itse
 * ylläpidetyssä palvelimessa — ja ratkaiseva operaatio on sama kaikissa:
 *
 *      APPEND \Drafts
 *
 * eli luonnoksen kirjoittaminen postilaatikkoon. Ei lähetystä.
 *
 * Microsoft Graph- ja Gmail API -adapterit olisivat kumpikin noin viisikymmentä
 * riviä tämän rajapinnan taakse, ja ne kannattaa tehdä siinä vaiheessa kun
 * tiedetään kumpaa oikeasti käytetään: Graphilla saa lisäksi webhookit
 * (change notifications), Gmailin API:lla vastaavasti users.watch. IMAPilla
 * uudet viestit haetaan IDLEllä tai kyselemällä.
 */
import type { Viesti } from '@/lib/luonnos/tyypit'

export interface PostiAdapteri {
    /** Uusimmat viestit saapuneista. */
    haeViestit(maara: number): Promise<Viesti[]>
    /**
     * Kirjoittaa luonnoksen postilaatikon Luonnokset-kansioon.
     * Palauttaa kansion nimen, johon luonnos meni.
     */
    luoLuonnos(alkuperainen: Viesti, teksti: string): Promise<string>
    sulje(): Promise<void>
}
