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
        return NextResponse.json(
            { virhe: (e as Error).message ?? 'tuntematon virhe' },
            { status: 500 }
        )
    }
}
