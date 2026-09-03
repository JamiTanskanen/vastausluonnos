import type { Profiili } from '@/lib/oppiminen/tyypit'
import type { Todiste, Viesti } from './tyypit'
import { voimassaOlevatSaannot } from '@/lib/oppiminen/kokoa'

/** Malli, jota käytetään sekä lajitteluun että luonnosteluun. */
export const MALLI = 'claude-opus-5'

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

Jokaisella avoimella asialla on laji, ja ero on tärkeä:

  - "paatos"  = et voi edetä ilman ihmistä. Hyvitys, alennus, aikataulu,
                juridinen kannanotto, tai tieto johon sinulla ei ole pääsyä
                (tilaus, maksu, asiakkaan omat luvut). Tämä estää lähettämisen.
  - "ehdotus" = luonnos on valmis ilmankin. Ideoita ja lisäyksiä, joita ihminen
                voi halutessaan tehdä. Tämä ei estä lähettämistä.

Testaa jokainen avoin asia tällä kysymyksellä:

    Jos tämä luonnos lähtisi juuri nyt sellaisenaan, olisiko se väärin?

Väärin = joku sitoutuu johonkin, asiakas saa virheellisen kuvan, tai vastaus
ohittaa kysymyksen jonka hän esitti. Jos vastaus on ei — luonnos on kunnossa,
vain vähemmän kattava kuin voisi olla — asia on EHDOTUS.

Yleisellä tasolla vastaaminen ei ole puute, jos asiakas sai kysymykseensä
kelvollisen vastauksen. "Voisimme katsoa juuri hänen lukunsa" on ehdotus.
"En tiedä maksoiko hän 4 vai 10 euroa" on päätös.

Älä toista samaa kysymystä kahdesti eri sanoin.

# Vastattavuus

"vastattavuus" koskee VAIN niitä kysymyksiä, jotka asiakas oikeasti esitti.
Se ei koske asioita, jotka sinulle tulivat mieleen.

  - "taysin"   = jokaiseen asiakkaan esittämään kysymykseen löytyi kate
                 todisteista. Tämä on oikea arvo myös silloin, kun luonnos
                 pyytää asiakkaalta lisätietoa (esim. tilausnumeroa) — tiedon
                 kysyminen asiakkaalta on osa valmista vastausta, ei puute.
  - "osittain" = osaan löytyi kate, osa vaatii ihmisen päätöksen tai pääsyn.
  - "ei"       = mikään olennainen ei ole vastattavissa todisteiden nojalla.

Ole tässä rehellinen molempiin suuntiin. Liiallinen varovaisuus on yhtä
hyödytöntä kuin liiallinen varmuus: jos merkitset kaiken osittaiseksi, ihminen
joutuu lukemaan kaiken itse, ja koko työstä ei jää mitään käteen.

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
        vastattavuus: { type: 'string', enum: ['taysin', 'osittain', 'ei'] },
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
                    laji: {
                        type: 'string',
                        enum: ['paatos', 'ehdotus'],
                        description:
                            'paatos = estää lähettämisen, ehdotus = vapaaehtoinen',
                    },
                },
                required: ['kysymys', 'miksi', 'laji'],
                additionalProperties: false,
            },
        },
        reititys: { type: 'string' },
    },
    required: ['kieli', 'vastattavuus', 'tervehdys', 'vaitteet', 'lopetus', 'avoimet'],
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
