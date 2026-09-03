/**
 * Tarkistuskerroksen yksikkötestit.  npm test  (tai: npx tsx scripts/testit.mts)
 *
 * Nämä ovat mahdollisia vain siksi, että tarkistus on puhdasta koodia.
 * Jos ankkurointi olisi toteutettu "pyydä mallia arvioimaan onko väite katettu",
 * tässä tiedostossa ei olisi mitään testattavaa — vain toiveita.
 */
import {
    sitaattiLoytyy,
    lupauksia,
    tarkista,
} from '../src/lib/tarkistus/tarkista.ts'
import { estaako } from '../src/lib/luonnos/tyypit.ts'
import type { MallinLuonnos, Todiste } from '../src/lib/luonnos/tyypit.ts'

let ajettu = 0
let kaatui = 0
function on(nimi: string, ehto: boolean) {
    ajettu++
    if (ehto) {
        console.log(`  ok   ${nimi}`)
    } else {
        kaatui++
        console.log(`  EI   ${nimi}`)
    }
}

const LAHDE =
    'Peruuttaminen ja hyvitys\n\nKuluttajalla on lähtökohtaisesti 14 päivän ' +
    'peruuttamisoikeus etämyynnissä. Palautuspyynnöt tulee esittää osoitteeseen ' +
    'luottoriskit2026@valuatum.com.'

console.log('\nsitaattiLoytyy')
on('sanatarkka sitaatti kelpaa', sitaattiLoytyy('14 päivän peruuttamisoikeus', LAHDE))
on('rivinvaihdot ja välit eivät haittaa', sitaattiLoytyy('Peruuttaminen ja hyvitys   Kuluttajalla on', LAHDE))
on('isot kirjaimet eivät haittaa', sitaattiLoytyy('KULUTTAJALLA ON LÄHTÖKOHTAISESTI', LAHDE))
on('ellipsi sallitaan osissa', sitaattiLoytyy('Kuluttajalla on … peruuttamisoikeus etämyynnissä', LAHDE))
on('ellipsin osat väärässä järjestyksessä hylätään', !sitaattiLoytyy('etämyynnissä … Kuluttajalla on', LAHDE))
on('keksitty sitaatti hylätään', !sitaattiLoytyy('30 päivän peruuttamisoikeus', LAHDE))
on('liian lyhyt sitaatti hylätään', !sitaattiLoytyy('14 päivän', LAHDE))
on('yksi sana muutettu → hylätään', !sitaattiLoytyy('14 arkipäivän peruuttamisoikeus', LAHDE))

console.log('\nlupauksia')
on('lupaus ilman katetta jää kiinni', lupauksia('Hyvitämme raportin luonnollisesti.', LAHDE) === 'hyvitämme')
on('sama lupaus sitaatissa sallitaan', lupauksia('Hyvitämme raportin.', 'Hyvitämme raportin aina teknisessä virheessä.') === null)
on('neutraali virke menee läpi', lupauksia('Palautuspyynnöt käsitellään ehtojen mukaisesti.', LAHDE) === null)

console.log('\ntarkista (kokonaisuus)')
const todisteet: Todiste[] = [
    { id: 'toimitusehdot#peruuttaminen', otsikko: 'Peruuttaminen ja hyvitys', url: 'https://luottoriskit.fi/fi/toimitus-ja-palautukset/', teksti: LAHDE, haettu: '2026-09-03', laji: 'kb' },
    { id: 'hinnat', otsikko: 'Hinnat', url: 'https://luottoriskit.fi/pricing.json', teksti: 'AI-luottotietoraportti: 10 €\nLuottotietoraportti (perusraportti): 9 €', haettu: '2026-09-03', laji: 'elava' },
    { id: 'ketju', otsikko: 'Asiakkaan viesti', url: '', teksti: 'Maksoin raportista 12 euroa viime viikolla.', haettu: '2026-09-03', laji: 'ketju' },
]
const pohja: MallinLuonnos = {
    kieli: 'fi', tervehdys: 'Hei,', lopetus: 'Ystävällisin terveisin,', vaitteet: [], avoimet: [],
}

const a = tarkista({ ...pohja, vaitteet: [
    { teksti: 'Kuluttajalla on lähtökohtaisesti 14 päivän peruuttamisoikeus etämyynnissä.', lahde: 'toimitusehdot#peruuttaminen', sitaatti: '14 päivän peruuttamisoikeus etämyynnissä' },
]}, todisteet)
on('kelvollinen väite hyväksytään', a.hyvaksytyt.length === 1 && a.hylatyt.length === 0)
on('teksti sisältää väitteen', a.teksti.includes('14 päivän'))
on('puhdas luonnos on lähetyskelpoinen', a.lahetyskelpoinen)

const b = tarkista({ ...pohja, vaitteet: [
    { teksti: 'Peruuttamisoikeus on 30 päivää.', lahde: 'toimitusehdot#peruuttaminen', sitaatti: '30 päivän peruuttamisoikeus' },
]}, todisteet)
on('keksitty sitaatti hylätään', b.hylatyt.length === 1 && b.hyvaksytyt.length === 0)
on('hylätty väite ei päädy tekstiin', !b.teksti.includes('30 päivää'))
on('hylkäyksestä tulee kysymys ihmiselle', b.avoimet.some((x) => x.lahde === 'tarkistus'))
on('hylkäys estää lähettämisen', !b.lahetyskelpoinen)

const c = tarkista({ ...pohja, vaitteet: [
    { teksti: 'AI-luottotietoraportti maksaa 12 €.', lahde: 'hinnat', sitaatti: 'AI-luottotietoraportti: 10 €' },
]}, todisteet)
on('oikea sitaatti mutta väärä luku hylätään', c.hylatyt.length === 1 && /luku 12/.test(c.hylatyt[0].syy))

const d = tarkista({ ...pohja, vaitteet: [
    { teksti: 'Maksamasi 12 euroa näkyy tilauksessa.', lahde: 'ketju', sitaatti: 'Maksoin raportista 12 euroa viime viikolla' },
]}, todisteet)
on('asiakkaan omasta viestistä tuleva luku sallitaan', d.hyvaksytyt.length === 1)

const e = tarkista({ ...pohja, vaitteet: [
    { teksti: 'Hyvitämme raportin luonnollisesti.', lahde: 'toimitusehdot#peruuttaminen', sitaatti: 'Palautuspyynnöt tulee esittää osoitteeseen' },
]}, todisteet)
on('kate-eton lupaus hylätään', e.hylatyt.length === 1 && /lupauksen/.test(e.hylatyt[0].syy))

const f = tarkista({ ...pohja, vaitteet: [
    { teksti: 'Vastaus löytyy ehdoista.', lahde: 'ehdot#ei-ole', sitaatti: 'jotain mitä ei ole olemassakaan' },
]}, todisteet)
on('tuntematon lähde hylätään', f.hylatyt.length === 1 && /ei ollut/.test(f.hylatyt[0].syy))

console.log('\nestaako — kenen päätös lähetyskelpoisuus on')
on('hyvitys estää', estaako('hyvitys_tai_alennus'))
on('juridiikka estää', estaako('juridinen_kannanotto'))
on('epävarma hinta estää', estaako('hinta_epavarma'))
on('yrityskohtaiset luvut EIVÄT estä', !estaako('asiakkaan_omat_luvut'))
on('asiakkaalta kysyminen EI estä', !estaako('lisatieto_asiakkaalta'))
on('vapaaehtoinen lisäys EI estä', !estaako('vapaaehtoinen_lisays'))
on('tuntematon tarve tulkitaan estäväksi', estaako('jokin_ihan_muu'))

const g = tarkista({ ...pohja, vaitteet: [
    { teksti: 'Kuluttajalla on lähtökohtaisesti 14 päivän peruuttamisoikeus etämyynnissä.', lahde: 'toimitusehdot#peruuttaminen', sitaatti: '14 päivän peruuttamisoikeus etämyynnissä' },
], avoimet: [
    { kysymys: 'Katsotaanko hänen omat lukunsa?', miksi: '', tarvitsee: 'asiakkaan_omat_luvut' },
]}, todisteet)
on('ei-estävä avoin asia ei estä lähettämistä', g.lahetyskelpoinen && g.avoimet[0].laji === 'ehdotus')

const h = tarkista({ ...pohja, vaitteet: g.hyvaksytyt, avoimet: [
    { kysymys: 'Hyvitetäänkö?', miksi: '', tarvitsee: 'hyvitys_tai_alennus' },
]}, todisteet)
on('estävä avoin asia estää lähettämisen', !h.lahetyskelpoinen && h.avoimet[0].laji === 'paatos')

console.log(`\n${ajettu - kaatui}/${ajettu} testiä läpi`)
process.exit(kaatui === 0 ? 0 : 1)
