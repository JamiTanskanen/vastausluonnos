/**
 * Profiilin pohja: se osa, jota ei opita vaan joka päätetään.
 *
 * Omistaja olen tässä demossa minä itse. Se on tarkoituksellista: en ole
 * mallintanut kenenkään valuatumilaisen kirjoitustyyliä enkä ole nähnyt
 * heidän viestejään. Oikeassa käytössä omistaja on se, joka yhdistää
 * postilaatikkonsa, ja profiili syntyy hänen omista editoinneistaan.
 */
import type { Profiili } from '@/lib/oppiminen/tyypit'

export const PROFIILIPOHJA: Profiili = {
    versio: 1,
    omistaja: {
        nimi: 'Jami Tanskanen',
        rooli: 'asiakastuki (demokäyttäjä)',
        allekirjoitus: 'Ystävällisin terveisin,\nJami',
    },
    perussaannot: [
        'Älä koskaan lähetä viestiä itse. Tuota vain luonnos.',
        'Älä lupaa hyvitystä, alennusta, aikataulua tai korjausta.',
        'Älä esitä lukua, jota ei ole lähteessä.',
        'Älä myönnä virhettä, jota et ole voinut todentaa.',
        'Jos tieto puuttuu, kysy sitä ihmiseltä — älä täytä aukkoa.',
        'Vastaa samalla kielellä kuin asiakas kirjoitti.',
    ],
    tyyli: [],
    faktat: [
        {
            teksti:
                'Tilitoimistoille ei ole erillistä alennushinnastoa; suuremmat erät sovitaan tapauskohtaisesti.',
            havaintoja: 2,
            tila: 'ehdokas',
        },
    ],
}
