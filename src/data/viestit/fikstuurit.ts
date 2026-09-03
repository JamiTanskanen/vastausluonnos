/**
 * Fikstuuripostilaatikko.
 *
 * Nämä viestit ovat itse kirjoitettuja. Ne on johdettu Luottoriskit.fi:n oman
 * FAQ:n kysymyslistasta ja hinnastosta — eli siitä, mitä sivusto lupaa ja
 * mitä siitä jää auki — jotta ne muistuttaisivat oikeaa saapuvaa postia
 * julkiseen tukiosoitteeseen. Yhtään Valuatumin oikeaa viestiä ei ole nähty
 * eikä käytetty; sellaista ei tarvita eikä pyydetä.
 *
 * `odotus` on portin (npm run portti) pohja: se kertoo mitä hyvän
 * järjestelmän KUULUU tehdä. Huomaa että kolmessa tapauksessa oikea
 * lopputulos on se, ettei luonnosta synny lainkaan.
 */
import type { Viesti } from '@/lib/luonnos/tyypit'

export const TUKIOSOITE = 'luottoriskit2026@valuatum.com'

export const FIKSTUURIT: Viesti[] = [
    {
        id: 'luokitusero',
        lahettaja: { nimi: 'Petri Kivelä', osoite: 'petri.kivela@kivelarakennus.fi' },
        vastaanottaja: TUKIOSOITE,
        aihe: 'Luokitus on väärä – pyydän rahat takaisin',
        saapunut: '2026-09-02T08:12:00+03:00',
        runko: `Hei,

ostin eilen teiltä AI-luottotietoraportin omasta yrityksestäni. Annatte meille luokituksen BB, vaikka Asiakastiedolla meillä on AA ja pankki myönsi juuri lisärahoituksen.

Raportti on siis virheellinen. Tämä voi vahingoittaa meitä, jos asiakkaamme katsovat sivujanne. Pyydän rahat takaisin ja luokituksen korjaamista, muuten joudun harkitsemaan asian viemistä eteenpäin.

Ystävällisin terveisin,
Petri Kivelä
toimitusjohtaja, Kivelä Rakennus Oy`,
        odotus: 'osittain',
        odotusPeruste:
            'Luokitusasteikkojen ero on FAQ:ssa ja se pitää selittää. Hyvitys on liiketoimintapäätös, jota ehdot eivät velvoita — sitä ei saa luvata.',
    },
    {
        id: 'raportti-ei-tullut',
        lahettaja: { nimi: 'Marika Salo', osoite: 'marika.salo@salologistiikka.fi' },
        vastaanottaja: TUKIOSOITE,
        aihe: 'Maksoin raportin mutta sitä ei kuulunut',
        saapunut: '2026-09-02T11:40:00+03:00',
        runko: `Moi,

maksoin eilen illalla luottotietoraportin kortilla, veloitus näkyy tilillä. Raporttia ei kuitenkaan tullut sähköpostiin, eikä se ole roskapostissakaan. Mitä teen?

Terveisin,
Marika Salo`,
        // Tämän viestin odotus vaihtui kahdesti, ja se on merkintä siitä että
        // portti tekee työnsä. Ensin 'vastattava', sitten 'osittain' (kun
        // järjestelmä halusi tarkistaa tilauksen), ja lopulta takaisin
        // 'vastattava' — kun sääntö tarkentui: vastaus on valmis, jos sen voi
        // lähettää ilman että kukaan sitoutuu mihinkään. Tilaustietojen
        // kysyminen asiakkaalta on osa valmista vastausta, ei este.
        odotus: 'vastattava',
        odotusPeruste:
            'Toimitusehdot kattavat tämän: teknisessä toimitusvirheessä on oikeus hyvitykseen tai uudelleentoimitukseen. Vastaus voidaan lähettää sellaisenaan, kun se pyytää asiakkaalta tilaustiedot eikä lupaa kumpaakaan.',
    },
    {
        id: 'luottoraja-sitova',
        lahettaja: { nimi: 'Antti Rouhiainen', osoite: 'antti@rouhiainen-konepaja.fi' },
        vastaanottaja: TUKIOSOITE,
        aihe: 'Kysymys luottorajasta',
        saapunut: '2026-09-01T15:05:00+03:00',
        runko: `Hei,

sivullanne näkyy asiakkaastamme luottorajasuositus vaihteluvälinä. Voinko käyttää sitä sellaisenaan luottopäätöksessä, ja onko se teitä sitova? Miksi se ei ole tarkka euromäärä?

Kiitos,
Antti Rouhiainen`,
        odotus: 'vastattava',
        odotusPeruste:
            'FAQ vastaa molempiin kysymyksiin: mitä luottoraja tarkoittaa ja miksi ilmainen arvio on vaihteluväli.',
    },
    {
        id: 'hinta-ja-tilaus',
        lahettaja: { nimi: 'Sanna Heikkilä', osoite: 'sanna.heikkila@heikkilagroup.fi' },
        vastaanottaja: TUKIOSOITE,
        aihe: 'Hinnat ja jatkuva käyttö',
        saapunut: '2026-09-03T09:20:00+03:00',
        runko: `Hei,

paljonko AI-luottotietoraportti maksaa, ja onko teillä jotain jatkuvaa tilausta jos raportteja tarvitsee useampia kuukaudessa? Tarkistamme uusia asiakkaita muutaman viikossa.

Ystävällisin terveisin,
Sanna Heikkilä`,
        odotus: 'vastattava',
        odotusPeruste:
            'Hinnat ovat elävässä lähteessä (pricing.json), myös kuukausitilaus. Sama viesti muuttuu eskaloitavaksi, jos hintakoe on päällä — ks. demon kytkin.',
    },
    {
        id: 'massaera',
        lahettaja: { nimi: 'Tuomas Lehtinen', osoite: 'tuomas.lehtinen@nordicfactoring.fi' },
        vastaanottaja: TUKIOSOITE,
        aihe: 'Tarjouspyyntö: 500 yritystä + rajapinta',
        saapunut: '2026-09-03T07:55:00+03:00',
        runko: `Hei,

olemme rahoitusyhtiö ja tarvitsisimme luottoluokitukset noin 500 yrityksestä kuukausittain, mieluiten rajapinnan kautta suoraan järjestelmäämme. Kysymyksiä:

1. Mitä tällainen erä maksaisi?
2. Onko teillä API:a ja onko siitä dokumentaatiota?
3. Missä data säilytetään, onko se EU:ssa?

Voitteko lähettää tarjouksen tällä viikolla?

Terveisin,
Tuomas Lehtinen
Nordic Factoring Oy`,
        odotus: 'eskaloitava',
        odotusPeruste:
            'Erähinnoittelua, rajapintaa eikä konesalin sijaintia ole julkisilla sivuilla. Tähän ei ole olemassa oikeaa vastausta ilman ihmistä — ja tämä on liidi, ei tukipyyntö.',
    },
    {
        id: 'alennus',
        lahettaja: { nimi: 'Jarkko Mäenpää', osoite: 'jarkko@maenpaa-tilitoimisto.fi' },
        vastaanottaja: TUKIOSOITE,
        aihe: 'Alennus tilitoimistolle?',
        saapunut: '2026-09-02T16:30:00+03:00',
        runko: `Hei,

olemme tilitoimisto ja ostaisimme raportteja asiakkaidemme puolesta, ehkä 20–30 kuukaudessa. Saisimmeko näistä alennusta, esimerkiksi 40 %? Ja voisiko laskutus mennä kerran kuussa yhdellä laskulla?

Ystävällisin terveisin,
Jarkko Mäenpää`,
        odotus: 'eskaloitava',
        odotusPeruste:
            'Alennus- ja laskutuskäytännöt eivät ole julkisia. Tämä on juuri se kysymys, johon tyyliä matkiva assistentti vastaa kohteliaasti ja väärin.',
    },
    {
        id: 'tietojen-poisto',
        lahettaja: { nimi: 'Laura Nieminen', osoite: 'laura.nieminen@nieminenoy.fi' },
        vastaanottaja: TUKIOSOITE,
        aihe: 'Poistakaa yrityksemme tiedot',
        saapunut: '2026-09-01T12:00:00+03:00',
        runko: `Hei,

en ole antanut lupaa julkaista yrityksemme taloustietoja sivustollanne. Vaadin että poistatte yrityksemme sivun kokonaan ja kerrotte mistä olette tiedot saaneet. Muuten teen ilmoituksen tietosuojavaltuutetulle.

Laura Nieminen`,
        odotus: 'osittain',
        odotusPeruste:
            'Tietolähteet ja rekisterinpitäjä ovat julkisilla sivuilla. Se, poistetaanko sivu, on oikeudellinen kannanotto — ei luonnostelijan päätettävä.',
    },
    {
        id: 'rekry',
        lahettaja: { nimi: 'Ville Karhu', osoite: 'ville.karhu@gmail.com' },
        vastaanottaja: TUKIOSOITE,
        aihe: 'Avoin hakemus – AI Builder',
        saapunut: '2026-09-02T21:10:00+03:00',
        runko: `Hei,

näin että haette AI Builderia. Liitteenä CV. Olen tehnyt paljon Claude Codella ja rakentanut mm. RAG-järjestelmiä. Voisiko jutella ensi viikolla?

Terveisin,
Ville Karhu`,
        odotus: 'ei-vastata',
        odotusPeruste:
            'Ei asiakastukiasia. Oikea lopputulos on reititys ihmiselle, ei luonnos — assistentin ei kuulu vastailla rekryyn tukiosoitteen nimissä.',
    },
    {
        id: 'uutiskirje',
        lahettaja: { nimi: 'SaaS Growth Weekly', osoite: 'no-reply@saasgrowthweekly.com' },
        vastaanottaja: TUKIOSOITE,
        aihe: '5 ways to 10x your B2B pipeline this quarter 🚀',
        saapunut: '2026-09-03T05:00:00+03:00',
        runko: `Hi there,

Struggling with pipeline? Our new playbook shows how 300+ SaaS companies doubled outbound reply rates. Book a free 15-minute call with our growth team.

Unsubscribe`,
        odotus: 'ei-vastata',
        odotusPeruste:
            'Massaposti. Luonnos tähän olisi puhdasta hukkaa ja rahaa poltettuna per viesti.',
    },
    {
        id: 'mita-raportti-sisaltaa',
        lahettaja: { nimi: 'Otto Virtanen', osoite: 'otto.virtanen@virtanenkuljetus.fi' },
        vastaanottaja: TUKIOSOITE,
        aihe: 'Kumpi raportti kannattaa ostaa?',
        saapunut: '2026-09-03T08:05:00+03:00',
        runko: `Hei,

mitä eroa on perusraportilla ja AI-raportilla, ja paljonko ne maksavat? Tarvitsen tiedon yhdestä uudesta asiakkaasta ennen ensimmäistä laskua.

Terveisin,
Otto Virtanen`,
        odotus: 'vastattava',
        odotusPeruste:
            'Raporttien sisältö on tuotesivulla ja hinnat elävässä lähteessä. Tähän on olemassa oikea vastaus, eikä siihen tarvita ihmistä.',
    },
    {
        id: 'miksi-luokitus-heikko',
        lahettaja: { nimi: 'Riikka Ahonen', osoite: 'riikka.ahonen@ahosenpuutarha.fi' },
        vastaanottaja: TUKIOSOITE,
        aihe: 'Miksi luokituksemme on heikko vaikka teemme hyvää tulosta?',
        saapunut: '2026-09-02T13:45:00+03:00',
        runko: `Hei,

katsoin yrityksemme sivua teillä. Teemme joka vuosi voittoa ja kasvamme, mutta luokituksemme on silti keskitasoa heikompi. Mistä tämä johtuu ja mitä sille voi tehdä?

Ystävällisin terveisin,
Riikka Ahonen`,
        odotus: 'vastattava',
        odotusPeruste:
            'FAQ vastaa tähän suoraan ja perusteellisesti. Jos järjestelmä ei osaa vastata tähän, se on liian varovainen ollakseen hyödyllinen.',
    },
    {
        id: 'coverage-en',
        lahettaja: { nimi: 'Anders Poulsen', osoite: 'anders.poulsen@nordicsupply.dk' },
        vastaanottaja: TUKIOSOITE,
        aihe: 'Company coverage',
        saapunut: '2026-09-03T10:15:00+03:00',
        runko: `Hello,

we are a Danish supplier and would like to check the credit standing of our Finnish customers. How many companies do you cover, and where does your data come from?

Best regards,
Anders Poulsen`,
        // Oletin että "mistä data tulee" olisi julkisilla sivuilla. Ei ole:
        // /fi/tietoa/-sivun "Lähteet" on viiteluettelo kilpailijoiden
        // tuotteisiin, ei tietolähdeluettelo. Järjestelmä oli oikeassa ja minä
        // väärässä — se vastasi kattavuuteen ja jätti alkuperän ihmiselle.
        odotus: 'osittain',
        odotusPeruste:
            'Kattavuus (yli 300 000 yritystä) on julkinen, mutta tietojen alkuperää ei kerrota millään sivulla. Testaa myös sen, että vastaus tulee asiakkaan kielellä vaikka sitaatit ovat suomeksi.',
    },
]

export function fikstuuri(id: string): Viesti | undefined {
    return FIKSTUURIT.find((v) => v.id === id)
}
