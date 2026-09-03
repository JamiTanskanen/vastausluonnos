'use client'

import { useMemo, useState } from 'react'
import naytoksetJson from '@/data/naytokset/index.json'
import { FIKSTUURIT } from '@/data/viestit/fikstuurit'
import { PROFIILIPOHJA } from '@/data/profiili'
import { SIEMENTAPAHTUMAT } from '@/data/tapahtumat'
import { kokoa, KYNNYS, mittarit } from '@/lib/oppiminen/kokoa'
import { SIGNAALIT } from '@/lib/oppiminen/tyypit'
import type { LuonnosTulos } from '@/lib/luonnos/tee'

const NAYTOKSET = naytoksetJson as unknown as LuonnosTulos[]

function tila(t: LuonnosTulos | undefined) {
    if (!t) return { teksti: '—', luokka: '' }
    if (t.lajittelu.vastataanko === 'ei') return { teksti: 'ei luonnosta', luokka: 'ei' }
    if (t.tarkistus?.lahetyskelpoinen) return { teksti: 'lähetyskelpoinen', luokka: 'ok' }
    const n = (t.tarkistus?.avoimet ?? []).filter((a) => a.laji === 'paatos').length
    return { teksti: `${n} päätöstä sinulle`, luokka: 'osa' }
}

export default function Sivu() {
    const [valittu, setValittu] = useState(FIKSTUURIT[0].id)
    const [tulokset, setTulokset] = useState<Record<string, LuonnosTulos>>(() =>
        Object.fromEntries(NAYTOKSET.map((t) => [t.viesti.id, t]))
    )
    const [ajossa, setAjossa] = useState(false)
    const [koe, setKoe] = useState(false)
    const [omaAuki, setOmaAuki] = useState(false)
    const [oma, setOma] = useState({ lahettaja: '', aihe: '', runko: '' })
    const [virhe, setVirhe] = useState<string | null>(null)

    const profiili = useMemo(() => kokoa(PROFIILIPOHJA, SIEMENTAPAHTUMAT), [])
    const luvut = useMemo(() => mittarit(SIEMENTAPAHTUMAT), [])

    // Hintakoe-kytkin näyttää valmiiksi ajetun koevariantin, jos sellainen on
    // tallessa — muuten sen saa "aja uudelleen" -napista livenä.
    const tulos = (koe && tulokset[`${valittu}+koe`]) || tulokset[valittu]
    const viesti = tulos?.viesti ?? FIKSTUURIT.find((v) => v.id === valittu)!

    async function aja(omalla = false) {
        setAjossa(true)
        setVirhe(null)
        try {
            const vastaus = await fetch('/api/luonnos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(
                    omalla
                        ? { oma, simuloiKoe: koe }
                        : { viestiId: valittu, simuloiKoe: koe }
                ),
            })
            const data = await vastaus.json()
            if (!vastaus.ok) throw new Error(data.virhe ?? 'virhe')
            setTulokset((edellinen) => ({ ...edellinen, [data.viesti.id]: data }))
            setValittu(data.viesti.id)
        } catch (e) {
            setVirhe((e as Error).message)
        } finally {
            setAjossa(false)
        }
    }

    const lahteet = tulos?.todisteet ?? []
    const numero = (lahdeId: string) => lahteet.findIndex((l) => l.id === lahdeId) + 1
    const paatokset = (tulos?.tarkistus?.avoimet ?? []).filter((a) => a.laji === 'paatos')
    const ehdotukset = (tulos?.tarkistus?.avoimet ?? []).filter((a) => a.laji === 'ehdotus')

    return (
        <div className="kuori">
            <header className="ylapalkki">
                <h1>Vastausluonnos</h1>
                <p>
                    Luonnostelija jaettuun tukipostilaatikkoon. Jokainen väite on
                    siteerattu Valuatumin julkiseen sivuun, ja koodi tarkistaa sitaatit
                    kirjaimellisesti. Se mikä ei mene läpi, ei päädy viestiin vaan
                    kysymykseksi sinulle. Mitään ei lähetetä.
                </p>
                <div className="saatimet">
                    <label className="kytkin" title="Käyttää heidän omaa hintakoettaan, active-lippu käännettynä">
                        <input
                            type="checkbox"
                            checked={koe}
                            onChange={(e) => setKoe(e.target.checked)}
                        />
                        simuloi hintakoe päällä
                    </label>
                    <button className="toiminto" onClick={() => aja()} disabled={ajossa}>
                        {ajossa ? 'ajetaan…' : 'aja uudelleen'}
                    </button>
                    <button className="toiminto" onClick={() => setOmaAuki((v) => !v)}>
                        oma viesti
                    </button>
                </div>
            </header>

            {omaAuki && (
                <div className="kortti">
                    <h2>Kokeile omalla viestillä</h2>
                    <div style={{ display: 'grid', gap: 8 }}>
                        <input
                            placeholder="Lähettäjän nimi"
                            value={oma.lahettaja}
                            onChange={(e) => setOma({ ...oma, lahettaja: e.target.value })}
                            style={{ padding: 8, font: 'inherit', border: '1px solid var(--viiva)', borderRadius: 6 }}
                        />
                        <input
                            placeholder="Aihe"
                            value={oma.aihe}
                            onChange={(e) => setOma({ ...oma, aihe: e.target.value })}
                            style={{ padding: 8, font: 'inherit', border: '1px solid var(--viiva)', borderRadius: 6 }}
                        />
                        <textarea
                            placeholder="Viestin teksti"
                            rows={6}
                            value={oma.runko}
                            onChange={(e) => setOma({ ...oma, runko: e.target.value })}
                            style={{ padding: 8, font: 'inherit', border: '1px solid var(--viiva)', borderRadius: 6 }}
                        />
                        <div>
                            <button className="toiminto" onClick={() => aja(true)} disabled={ajossa || !oma.runko.trim()}>
                                {ajossa ? 'ajetaan…' : 'luonnostele'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {virhe && <div className="huomio">Virhe: {virhe}</div>}

            <div className="ruudukko">
                {/* vasen: postilaatikko */}
                <div>
                    <div className="kortti">
                        <h2>Saapuneet — luottoriskit2026@</h2>
                        {FIKSTUURIT.map((v) => {
                            const t = tulokset[v.id]
                            const s = tila(t)
                            return (
                                <button
                                    key={v.id}
                                    className={`viesti-nappi${valittu === v.id ? ' valittu' : ''}`}
                                    onClick={() => setValittu(v.id)}
                                >
                                    <span className="aihe">{v.aihe}</span>
                                    <span className="lahettaja">{v.lahettaja.nimi}</span>
                                    <div style={{ marginTop: 4 }}>
                                        <span className={`merkki ${s.luokka}`}>{s.teksti}</span>
                                    </div>
                                </button>
                            )
                        })}
                        <p className="alaviite">
                            Viestit ovat itse kirjoitettuja ja johdettu heidän julkisesta
                            FAQ:staan. Valuatumin omaa postia ei ole nähty eikä käytetty.
                        </p>
                    </div>
                </div>

                {/* keski: viesti ja luonnos */}
                <div>
                    <div className="kortti">
                        <div className="otsikkorivi">
                            <div>
                                <h3>{viesti.aihe}</h3>
                                <div className="meta">
                                    {viesti.lahettaja.nimi}
                                    {viesti.lahettaja.osoite ? ` <${viesti.lahettaja.osoite}>` : ''}
                                    {' · '}
                                    {viesti.saapunut.slice(0, 16).replace('T', ' ')}
                                </div>
                            </div>
                        </div>
                        <p className="saapunut" style={{ marginBottom: 0 }}>
                            {viesti.runko}
                        </p>
                    </div>

                    {tulos && tulos.lajittelu.vastataanko === 'ei' ? (
                        <div className="kortti">
                            <h2>Ei luonnosta</h2>
                            <p style={{ marginTop: 0 }}>
                                Esilajittelu päätti, ettei tähän kannata valmistella vastausta.
                                Luokka: <strong>{tulos.lajittelu.luokka}</strong>.
                            </p>
                            <p className="meta">{tulos.lajittelu.syy}</p>
                            <p className="alaviite">
                                Tämä on lopputulos, ei virhe. Luonnos jokaiseen saapuvaan
                                viestiin maksaisi rahaa ja veisi huomion niiltä viesteiltä,
                                joissa siitä on hyötyä.
                            </p>
                        </div>
                    ) : (
                        tulos?.tarkistus && (
                            <>
                                <div className="kortti">
                                    <h2>
                                        Luonnos{' '}
                                        {tulos.tarkistus.lahetyskelpoinen ? (
                                            <span className="merkki ok">lähetyskelpoinen</span>
                                        ) : (
                                            <span className="merkki osa">
                                                odottaa {paatokset.length} päätöstä
                                            </span>
                                        )}
                                    </h2>
                                    <div className="luonnos">
                                        {tulos.malli?.tervehdys}
                                        {'\n\n'}
                                        {tulos.tarkistus.hyvaksytyt.map((v, i) => (
                                            <span key={i}>
                                                {v.teksti}
                                                <a
                                                    className="viite"
                                                    href={`#lahde-${v.lahde}`}
                                                    title={`${v.lahde}: "${v.sitaatti}"`}
                                                >
                                                    [{numero(v.lahde)}]
                                                </a>
                                                {'\n\n'}
                                            </span>
                                        ))}
                                        {tulos.malli?.lopetus}
                                    </div>
                                    <div className="saatimet" style={{ marginTop: 12 }}>
                                        <button
                                            className="toiminto"
                                            onClick={() =>
                                                navigator.clipboard.writeText(
                                                    tulos.tarkistus!.teksti
                                                )
                                            }
                                        >
                                            kopioi teksti
                                        </button>
                                        <span className="meta">
                                            {tulos.tarkistus.hyvaksytyt.length} väitettä ·{' '}
                                            {tulos.tarkistus.luvut.length} lukua tarkistettu ·{' '}
                                            {Math.round(tulos.kesto_ms / 1000)} s
                                        </span>
                                    </div>
                                </div>

                                {paatokset.length > 0 && (
                                    <div className="kortti">
                                        <h2>Tarvitsen sinulta ennen lähetystä</h2>
                                        <ol className="avoimet">
                                            {paatokset.map((a, i) => (
                                                <li key={i}>
                                                    {a.kysymys}
                                                    <span className="miksi">{a.miksi}</span>
                                                </li>
                                            ))}
                                        </ol>
                                    </div>
                                )}

                                {ehdotukset.length > 0 && (
                                    <div className="kortti">
                                        <h2>Ehdotuksia (eivät estä lähettämistä)</h2>
                                        <ol className="avoimet">
                                            {ehdotukset.map((a, i) => (
                                                <li key={i}>
                                                    {a.kysymys}
                                                    <span className="miksi">{a.miksi}</span>
                                                </li>
                                            ))}
                                        </ol>
                                    </div>
                                )}
                            </>
                        )
                    )}
                </div>

                {/* oikea: todisteet, tarkistus, profiili */}
                <div>
                    <div className="kortti">
                        <h2>Lähteet ({lahteet.length})</h2>
                        {lahteet.map((l, i) => (
                            <div className="lahde" key={l.id} id={`lahde-${l.id}`}>
                                <div>
                                    <span className="tunnus">[{i + 1}]</span>{' '}
                                    {l.url ? (
                                        <a href={l.url} target="_blank" rel="noreferrer">
                                            {l.otsikko}
                                        </a>
                                    ) : (
                                        <strong>{l.otsikko}</strong>
                                    )}
                                </div>
                                <div className="tunnus">
                                    {l.id} ·{' '}
                                    {l.laji === 'elava'
                                        ? 'haettu juuri nyt'
                                        : l.laji === 'ketju'
                                          ? 'asiakkaan oma viesti'
                                          : `indeksoitu ${l.haettu.slice(0, 10)}`}
                                </div>
                            </div>
                        ))}
                        {tulos?.hintaVaihtelee && (
                            <div className="huomio" style={{ marginTop: 12, marginBottom: 0 }}>
                                Hintakoe on käynnissä{tulos.hinnastoSimuloitu ? ' (simuloitu)' : ''}:
                                asiakkaan näkemä hinta riippuu siitä, mihin varianttiin hänen
                                selaimensa on arvottu. Luonnostelija ei saa kertoa yhtä hintaa
                                varmana.
                            </div>
                        )}
                    </div>

                    {tulos?.tarkistus && (
                        <div className="kortti">
                            <h2>Tarkistus</h2>
                            <table className="tarkistus">
                                <tbody>
                                    <tr>
                                        <td>Väitteitä mallilta</td>
                                        <td>
                                            {tulos.tarkistus.hyvaksytyt.length +
                                                tulos.tarkistus.hylatyt.length}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Sitaatti löytyi lähteestä</td>
                                        <td>{tulos.tarkistus.hyvaksytyt.length}</td>
                                    </tr>
                                    <tr>
                                        <td>Lukua ei ollut sitaatissa</td>
                                        <td>
                                            {tulos.tarkistus.luvut.filter((l) => !l.ok).length}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Poistettu luonnoksesta</td>
                                        <td>{tulos.tarkistus.hylatyt.length}</td>
                                    </tr>
                                    {tulos.korjaus && (
                                        <tr>
                                            <td>Korjauskierros</td>
                                            <td>
                                                {tulos.korjaus.korjattuja}/
                                                {tulos.korjaus.hylattyja} pelastettu
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            {tulos.tarkistus.hylatyt.map((h, i) => (
                                <div className="hylky-laatikko" key={i}>
                                    <strong>Poistettu:</strong> “{h.vaite.teksti}”
                                    <div className="meta" style={{ marginTop: 4 }}>
                                        {h.syy}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="kortti">
                        <h2>Profiili v{profiili.versio}</h2>
                        {profiili.tyyli.map((t) => (
                            <div key={t.signaali}>
                                <div className="saanto">
                                    <span>
                                        {SIGNAALIT[t.signaali]}
                                        {!t.kaytossa && (
                                            <em style={{ color: 'var(--himmea)' }}> — ei vielä käytössä</em>
                                        )}
                                    </span>
                                    <span className="luku">
                                        {t.havaintoja}/{KYNNYS}
                                    </span>
                                </div>
                                <div className={`palkki${t.kaytossa ? '' : ' kesken'}`}>
                                    <div
                                        style={{
                                            width: `${Math.min(100, (t.havaintoja / KYNNYS) * 100)}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                        <p className="alaviite">
                            Sääntö otetaan käyttöön vasta {KYNNYS}. samansuuntaisen havainnon
                            jälkeen. Malli saa ehdottaa vain kiinteästä listasta; sovellus
                            omistaa profiilin. Yksi editointi ei muuta mitään.
                        </p>
                    </div>

                    <div className="kortti">
                        <h2>Faktamuisti</h2>
                        {profiili.faktat.map((f, i) => (
                            <div className="saanto" key={i}>
                                <span>{f.teksti}</span>
                                <span className="luku">
                                    {f.tila === 'vahvistettu' ? 'vahvistettu' : 'odottaa sinua'}
                                </span>
                            </div>
                        ))}
                        <p className="alaviite">
                            Liiketoimintafaktat eivät koskaan siirry käyttöön automaattisesti,
                            vaikka havaintoja kertyisi kuinka monta. Väärä hinnoittelusääntö
                            maksaa rahaa; väärä tervehdys ei.
                        </p>
                    </div>

                    <div className="kortti">
                        <h2>Mittarit ({luvut.luonnoksia} luonnosta)</h2>
                        <table className="tarkistus">
                            <tbody>
                                <tr>
                                    <td>Lähetetty sellaisenaan</td>
                                    <td>{luvut.hyvaksyntaosuus} %</td>
                                </tr>
                                <tr>
                                    <td>Poistettu käyttämättä</td>
                                    <td>{luvut.poisto_osuus} %</td>
                                </tr>
                                <tr>
                                    <td>Muokkauksen keskikoko</td>
                                    <td>{luvut.keskimaarainen_muokkaus_merkkeina} merkkiä</td>
                                </tr>
                            </tbody>
                        </table>
                        <p className="alaviite">
                            Nämä ovat siemennetystä lokista. Oikeassa käytössä juuri nämä
                            kolme lukua kertovat, paraneeko assistentti — eivät fiilikset.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
