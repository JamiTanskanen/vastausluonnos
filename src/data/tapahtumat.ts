/**
 * Tapahtumaloki: mitä ihminen teki luonnokselle.
 *
 * Tämä loki on siemennetty käsin, ja se on demon rehellisin kohta: oppimista
 * ei voi näyttää kolmessa minuutissa, koska kynnyksen ylittäminen vaatii
 * kolme samansuuntaista havaintoa. Siksi näytän mekanismin lokin päältä —
 * mukana on sekä sääntöjä jotka ovat ylittäneet kynnyksen että ehdokkaita
 * jotka eivät vielä ole. Kynnys on näkyvä, ei väitetty.
 *
 * Uudet tapahtumat syntyvät oikeasti: käyttöliittymässä luonnoksen voi
 * muokata ja tallentaa, jolloin muutos luokitellaan samaan kiinteään
 * signaalilistaan ja lisätään tähän lokiin.
 */
import type { Tapahtuma } from '@/lib/oppiminen/tyypit'

export const SIEMENTAPAHTUMAT: Tapahtuma[] = [
    { id: 't01', pvm: '2026-07-21', viesti_id: 'hist-tilinpaatos-vanha', lopputulos: 'muokattu', muutos_merkkeina: -310, signaalit: ['pituus_lyhyempi', 'poista_kohteliaisuus'] },
    { id: 't02', pvm: '2026-07-23', viesti_id: 'hist-luokitus-kysely', lopputulos: 'lahetetty_sellaisenaan', signaalit: [] },
    { id: 't03', pvm: '2026-07-28', viesti_id: 'hist-kortti-veloitus', lopputulos: 'muokattu', muutos_merkkeina: -180, signaalit: ['poista_pahoittelu', 'pituus_lyhyempi'] },
    { id: 't04', pvm: '2026-08-04', viesti_id: 'hist-toimiala-kysymys', lopputulos: 'muokattu', muutos_merkkeina: -95, signaalit: ['poista_kohteliaisuus'] },
    { id: 't05', pvm: '2026-08-06', viesti_id: 'hist-mainospost', lopputulos: 'poistettu', signaalit: [] },
    { id: 't06', pvm: '2026-08-11', viesti_id: 'hist-luottoraja', lopputulos: 'lahetetty_sellaisenaan', signaalit: [] },
    { id: 't07', pvm: '2026-08-13', viesti_id: 'hist-hyvityspyynto', lopputulos: 'muokattu', muutos_merkkeina: -240, signaalit: ['poista_pahoittelu', 'pituus_lyhyempi'], faktaehdokas: 'Hyvityksistä päättää aina ihminen, ei tukiviesti.' },
    { id: 't08', pvm: '2026-08-18', viesti_id: 'hist-tilitoimisto-1', lopputulos: 'muokattu', muutos_merkkeina: -120, signaalit: ['poista_kohteliaisuus', 'konkreettinen_askel'], faktaehdokas: 'Tilitoimistoille ei ole erillistä alennushinnastoa; suuremmat erät sovitaan tapauskohtaisesti.' },
    { id: 't09', pvm: '2026-08-20', viesti_id: 'hist-englanti-kysely', lopputulos: 'lahetetty_sellaisenaan', signaalit: [] },
    { id: 't10', pvm: '2026-08-25', viesti_id: 'hist-raportti-sisalto', lopputulos: 'muokattu', muutos_merkkeina: -60, signaalit: ['pituus_lyhyempi'] },
    { id: 't11', pvm: '2026-08-26', viesti_id: 'hist-tilitoimisto-2', lopputulos: 'muokattu', muutos_merkkeina: -150, signaalit: ['konkreettinen_askel'], faktaehdokas: 'Tilitoimistoille ei ole erillistä alennushinnastoa; suuremmat erät sovitaan tapauskohtaisesti.' },
    { id: 't12', pvm: '2026-08-28', viesti_id: 'hist-uutiskirje', lopputulos: 'poistettu', signaalit: [] },
    { id: 't13', pvm: '2026-09-01', viesti_id: 'hist-pahoittelu-turha', lopputulos: 'muokattu', muutos_merkkeina: -75, signaalit: ['poista_pahoittelu'] },
    { id: 't14', pvm: '2026-09-02', viesti_id: 'hist-kolme-kysymysta', lopputulos: 'muokattu', muutos_merkkeina: 40, signaalit: ['numeroi_kysymykset'] },
]
