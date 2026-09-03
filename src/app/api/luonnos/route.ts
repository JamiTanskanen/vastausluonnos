import { NextResponse } from 'next/server'
import { teeLuonnos } from '@/lib/luonnos/tee'
import { fikstuuri } from '@/data/viestit/fikstuurit'
import type { Viesti } from '@/lib/luonnos/tyypit'

export const maxDuration = 120

export async function POST(pyynto: Request) {
    const runko = await pyynto.json().catch(() => ({}))
    const { viestiId, oma, simuloiKoe } = runko as {
        viestiId?: string
        oma?: { aihe: string; runko: string; lahettaja: string }
        simuloiKoe?: boolean
    }

    let viesti: Viesti | undefined
    if (oma?.runko?.trim()) {
        viesti = {
            id: 'oma',
            lahettaja: { nimi: oma.lahettaja || 'Asiakas', osoite: '' },
            vastaanottaja: 'luottoriskit2026@valuatum.com',
            aihe: oma.aihe || '(ei aihetta)',
            saapunut: new Date().toISOString(),
            runko: oma.runko,
        }
    } else if (viestiId) {
        viesti = fikstuuri(viestiId)
    }

    if (!viesti) {
        return NextResponse.json({ virhe: 'viestiä ei löytynyt' }, { status: 400 })
    }

    try {
        const tulos = await teeLuonnos(viesti, { simuloiKoe })
        return NextResponse.json(tulos)
    } catch (e) {
        // Yleisin vika julkisessa demossa ei ole bugi vaan loppunut saldo tai
        // puuttuva avain. Sanotaan se suoraan, ettei käyttäjä arvaile.
        const viesti = (e as Error).message ?? 'tuntematon virhe'
        const selko = /credit balance|api key|authentication/i.test(viesti)
            ? 'Elävä ajo ei ole juuri nyt käytettävissä (API-avain tai saldo). ' +
              'Näytöllä olevat luonnokset ovat valmiiksi ajettuja oikeita tuloksia.'
            : viesti
        return NextResponse.json({ virhe: selko }, { status: 500 })
    }
}
