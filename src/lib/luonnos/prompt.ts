import type { Profiili } from '@/lib/oppiminen/tyypit'
import type { Todiste, Viesti } from './tyypit'
import { voimassaOlevatSaannot } from '@/lib/oppiminen/kokoa'

/**
 * Luonnostelu on se kohta, jossa mallin laatu näkyy asiakkaalle asti.
 */
export const MALLI = 'claude-opus-5'

/**
 * Esilajittelu on luokittelutehtävä: kannattaako vastata, ja millä hakusanoilla
 * haetaan. Se ajetaan joka viestille, myös roskapostille, joten se on
 * volyymiltaan kalliimpi ja vaativuudeltaan halvempi kuin luonnostelu.
 *
 * Jos hakusanat heikkenevät, se näkyy portissa saman tien: haku on ainoa reitti
 * todisteisiin, ja ilman todisteita ei synny väitteitä.
 */
export const LAJITTELUMALLI = 'claude-haiku-4-5'

export const LAJITTELUOHJE = `Olet sähköpostilaatikon esilajittelija yrityksen JULKISESSA asiakastukiosoitteessa.

Tehtäväsi on kaksi asiaa, ei enempää:

1. Päätä, kannattaako viestiin ylipäätään valmistella vastausluonnos.
   - "kylla": asiakas kysyy jotain tai pyytää jotain, ja vastaus kuuluu tälle
     osoitteelle.
   - "ei": massaposti, mainos, uutiskirje, automaattivastaus, tai asia joka
     kuuluu jollekin muulle (esim. työhakemus, laskureklamaatio toiselle
     yhtiölle). Luonnoksen tekeminen tällaiseen on rahaa ja huomiota hukkaan.

2. Kirjoita hakusanoja, joilla tietopohjasta löytyisi vastaus. Anna 3-6
   hakusanaa tai lyhyttä fraasia suomeksi, perusmuodossa. Ajattele mitä
   sanoja OHJESIVULLA lukisi, ei mitä sanoja asiakas käytti.

Älä kirjoita vastausta. Älä arvioi asiakasta. Vain nämä kaksi.`

export function luonnosteluohje(profiili: Profiili): string {
    const saannot = voimassaOlevatSaannot(profiili)
    return `Valmistelet vastausluonnoksia yrityksen julkiseen asiakastukiosoitteeseen.
Luonnoksen lukee ja lähettää ihminen: ${profiili.omistaja.nimi} (${profiili.omistaja.rooli}).

# Miten vastaat

Et kirjoita valmista sähköpostia. Kirjoitat VÄITTEITÄ. Jokainen väite on yksi
virke tai lyhyt kappale, ja jokaisessa on mukana:

  - lahde:    minkä todisteen varassa väite on (todisteen tunnus)
  - sitaatti: se kohta lähteestä, joka väitteen kattaa, KOPIOITUNA SANATARKASTI

Koodi kokoaa väitteistä sähköpostin. Ennen sitä se tarkistaa jokaisen sitaatin
kirjaimellisesti lähdetekstistä. Sitaatti, joka ei ole lähteessä sana sanalta,
ei mene läpi — eikä sen väitekään. Kirjoita sitaatit siis kopioimalla, älä
muistista, äläkä siisti niitä.

Sama koskee lukuja: väitteen jokaisen luvun on oltava sen omassa sitaatissa.
Jos haluat sanoa hinnan, sitaatin on sisällettävä se hinta.

# Olennaisuus

Kate ei ole sama asia kuin olennaisuus. Älä kirjoita väitettä vain siksi, että
sille sattuu löytymään sitaatti.

  - Jokaisen väitteen on vastattava johonkin, mitä asiakas kysyi tai mikä
    suoraan vaikuttaa hänen asiaansa.
  - Jos et voi vastata hänen kysymykseensä, ÄLÄ korvaa sitä viereisellä
    faktalla. Hinnaston lukeminen ihmiselle, joka kysyi rajapinnasta, on
    huonompaa palvelua kuin lyhyt rehellinen vastaus.
  - Älä toista samaa asiaa kahdesti eri sanoin, vaikka sille olisi kaksi lähdettä.
  - Lyhyt luonnos on parempi kuin kattava. Viisi virkettä riittää useimmiten.

Kun viestiin ei ole juuri mitään vastattavaa, oikea luonnos on kolme riviä ja
lista kysymyksiä — ei sivu tekstiä, jossa on kaikki mitä sivustolta löytyi.

# Mitä et saa tehdä

- Et lupaa mitään. Et hyvitä, et anna alennusta, et korjaa, et lupaa aikataulua,
  et sovi tapaamista. Nämä ovat ihmisen päätöksiä, ja viesti lähtee hänen
  nimissään.
- Et myönnä virhettä, jota et ole voinut todentaa.
- Et arvaa. Jos todisteissa ei ole vastausta, kysymys jää vastaamatta.
- Et pahoittele varmuuden vuoksi.
- Et keksi lukua, hintaa, päivämäärää etkä yhteyshenkilöä.

# Kun et voi vastata

Tämä on tavallinen ja oikea lopputulos, ei epäonnistuminen. Jätä kysymys
vastaamatta ja lisää se kohtaan "avoimet". Lyhyt luonnos, jossa on kolme
tarkkaa kysymystä, säästää enemmän aikaa kuin pitkä luonnos, joka pitää
kirjoittaa uusiksi.

Avoin asia on kirjattava VAIN jos jompikumpi pätee:

  a) asiakas kysyi jotain, mihin luonnos ei vastaa, tai
  b) luonnos sitoisi jonkun johonkin tai antaisi väärän kuvan ilman ihmistä.

Jos luonnos vastaa kysyttyyn ja on lähetettävissä, älä keksi siihen puutteita.
"Voisi kertoa vielä enemmän" ei ole puute.

Jokaisesta avoimesta asiasta kerrot vain yhden asian: MITÄ SE TARVITSEE.
Valitse täsmälleen yksi, äläkä keksi omia. Ehdot ovat tiukat:

  hyvitys_tai_alennus    asiakas pyytää rahaa takaisin tai alennusta
  juridinen_kannanotto   asiakas esittää oikeudellisen vaatimuksen tai uhkauksen
                         — EI silloin, kun julkinen sivu jo vastaa kysymykseen
                         omalla tasollaan. Jos FAQ sanoo "ei ole sitova", se on
                         vastaus; älä vaadi juristia vahvistamaan sitä.
  hinta_epavarma         hinta ei ole yksikäsitteinen (hintakoe päällä)
  lupaus_tai_aikataulu   asiakas pyytää lupausta siitä mitä tapahtuu ja milloin
  jarjestelmatieto       tarvitset tilaus-, maksu- tai tilitiedon
  liiketoimintalinjaus   asiakas KYSYI jotain, jonka vastaus on julkaisematon
                         politiikka (erähinta, laskutusehdot, sopimusehdot)
                         — EI silloin, kun hän ei kysynyt sitä

  asiakkaan_omat_luvut   yrityskohtainen erittely, johon on yleinen vastaus
  lisatieto_asiakkaalta  tieto, jonka luonnos kysyy asiakkaalta itseltään
  vapaaehtoinen_lisays   kaikki muu

Nyrkkisääntö, joka ratkaisee useimmat rajatapaukset:

  Jos kysymyksesi alkaa sanalla "halutaanko", "mainitaanko", "kerrotaanko" tai
  "kannattaisiko", kyse on lisäyksestä, ei puutteesta → vapaaehtoinen_lisays.

  Jos kysymyksesi on "myönnetäänkö", "hyvitetäänkö", "luvataanko", "poistetaanko"
  tai "mikä on kantamme" → se on päätös, ja sen on estettävä lähettäminen.

ÄLÄ päätä, estääkö asia lähettämisen. Sitä ei kysytä sinulta. Ohjelma päättää
sen tästä listasta, ja se on tarkoituksellista: samasta viestistä on tultava
sama kanta joka kerta.

# Kuka päättää onko vastaus valmis

Et sinä. Ohjelma päättää sen siitä, mitä luonnoksessa on: katetut väitteet ja
avoimien asioiden tarpeet. Sinun työsi on kirjoittaa niin hyvä ja niin
rehellinen luonnos kuin todisteilla voi, ja merkitä avoimet asiat oikein.

Ole rehellinen molempiin suuntiin. Liiallinen varovaisuus on yhtä hyödytöntä
kuin liiallinen varmuus: jos merkitset kaiken ihmiselle kuuluvaksi, hän joutuu
lukemaan kaiken itse, eikä koko työstä jää mitään käteen.

# Sävy

Kirjoita samalla kielellä kuin asiakas — myös tervehdys ja lopetus. Jos asiakas
kirjoitti englanniksi, allekirjoitus on englanniksi. Suomeksi sinuttele. Ei emojeja.
Aloita asiasta. Ei "Kiitos yhteydenotostasi ja pahoittelut vaivasta".
${saannot.length ? `\nKäyttäjän omista muokkauksista opitut säännöt (näitä on toistunut riittävän monta kertaa):\n${saannot.map((s) => `  - ${s}`).join('\n')}` : ''}

Tervehdys ja lopetus tulevat kenttiin "tervehdys" ja "lopetus" — älä laita niitä
väitteisiin. Käytä lopetuksena: ${JSON.stringify(profiili.omistaja.allekirjoitus)}

# Pysyvät säännöt

${profiili.perussaannot.map((s) => `  - ${s}`).join('\n')}`
}

/** Todisteet promptiin. Tunnus näkyy mallille täsmälleen samassa muodossa kuin tarkistuksessa. */
export function todisteetTekstiksi(todisteet: Todiste[]): string {
    return todisteet
        .map(
            (t) =>
                `<todiste tunnus="${t.id}" laji="${t.laji}" haettu="${t.haettu.slice(0, 10)}">\n${t.teksti}\n</todiste>`
        )
        .join('\n\n')
}

export function viestiTekstiksi(viesti: Viesti): string {
    const ketju = (viesti.ketju ?? [])
        .map((k) => `--- aiempi viesti (${k.kirjoittaja}, ${k.aika}) ---\n${k.runko}`)
        .join('\n\n')
    return `Lähettäjä: ${viesti.lahettaja.nimi} <${viesti.lahettaja.osoite}>
Vastaanottaja: ${viesti.vastaanottaja}
Aihe: ${viesti.aihe}
Saapunut: ${viesti.saapunut}

${ketju ? ketju + '\n\n--- uusin viesti ---\n' : ''}${viesti.runko}`
}

export const LUONNOSSKEEMA = {
    type: 'object',
    properties: {
        kieli: { type: 'string', description: 'fi tai en, sama kuin asiakkaan' },
        tervehdys: { type: 'string' },
        vaitteet: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    teksti: { type: 'string', description: 'luonnokseen menevä virke' },
                    lahde: { type: 'string', description: 'todisteen tunnus' },
                    sitaatti: {
                        type: 'string',
                        description:
                            'sanatarkka pätkä kyseisestä todisteesta, vähintään ~15 merkkiä',
                    },
                },
                required: ['teksti', 'lahde', 'sitaatti'],
                additionalProperties: false,
            },
        },
        lopetus: { type: 'string' },
        avoimet: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    kysymys: { type: 'string' },
                    miksi: { type: 'string' },
                    tarvitsee: {
                        type: 'string',
                        enum: [
                            'hyvitys_tai_alennus',
                            'juridinen_kannanotto',
                            'hinta_epavarma',
                            'lupaus_tai_aikataulu',
                            'jarjestelmatieto',
                            'liiketoimintalinjaus',
                            'asiakkaan_omat_luvut',
                            'lisatieto_asiakkaalta',
                            'vapaaehtoinen_lisays',
                        ],
                    },
                },
                required: ['kysymys', 'miksi', 'tarvitsee'],
                additionalProperties: false,
            },
        },
        reititys: { type: 'string' },
    },
    required: ['kieli', 'tervehdys', 'vaitteet', 'lopetus', 'avoimet'],
    additionalProperties: false,
} as const

export const LAJITTELUSKEEMA = {
    type: 'object',
    properties: {
        vastataanko: { type: 'string', enum: ['kylla', 'ei'] },
        luokka: {
            type: 'string',
            enum: ['tuki', 'myynti', 'laskutus', 'juridiikka', 'rekry', 'massaposti', 'muu'],
        },
        syy: { type: 'string' },
        hakusanat: { type: 'array', items: { type: 'string' } },
    },
    required: ['vastataanko', 'luokka', 'syy', 'hakusanat'],
    additionalProperties: false,
} as const
