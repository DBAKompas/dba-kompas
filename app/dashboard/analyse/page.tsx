'use client'

import { useState } from 'react'

const vragen = [
  {
    id: 'gezag',
    vraag: 'Geeft de opdrachtgever instructies over hoe je het werk uitvoert?',
    toelichting: 'Denk aan werktijden, werkwijze of directe sturing.',
  },
  {
    id: 'vervanging',
    vraag: 'Mag je jezelf laten vervangen door iemand anders?',
    toelichting: 'Zonder toestemming vooraf van de opdrachtgever.',
  },
  {
    id: 'meerdere_opdrachtgevers',
    vraag: 'Werk je ook voor andere opdrachtgevers?',
    toelichting: 'Of ben je exclusief voor deze opdrachtgever beschikbaar?',
  },
  {
    id: 'eigen_materiaal',
    vraag: 'Gebruik je je eigen materiaal en gereedschap?',
    toelichting: 'Zoals laptop, software of apparatuur.',
  },
  {
    id: 'ondernemersrisico',
    vraag: 'Loop je financieel risico als het werk tegenvalt?',
    toelichting: 'Bijv. aansprakelijkheid of onbetaalde uren.',
  },
]

type Antwoord = 'ja' | 'nee' | null

export default function AnalysePage() {
  const [antwoorden, setAntwoorden] = useState<Record<string, Antwoord>>({})
  const [resultaat, setResultaat] = useState<string | null>(null)

  function beantwoord(id: string, waarde: Antwoord) {
    setAntwoorden((prev) => ({ ...prev, [id]: waarde }))
  }

  function bereken() {
    const scores = {
      gezag: antwoorden.gezag === 'nee' ? 1 : -1,
      vervanging: antwoorden.vervanging === 'ja' ? 1 : -1,
      meerdere_opdrachtgevers: antwoorden.meerdere_opdrachtgevers === 'ja' ? 1 : -1,
      eigen_materiaal: antwoorden.eigen_materiaal === 'ja' ? 1 : -1,
      ondernemersrisico: antwoorden.ondernemersrisico === 'ja' ? 1 : -1,
    }
    const totaal = Object.values(scores).reduce((a, b) => a + b, 0)

    if (totaal >= 3) setResultaat('laag')
    else if (totaal >= 0) setResultaat('middel')
    else setResultaat('hoog')
  }

  const allesBeantwoord = vragen.every((v) => antwoorden[v.id] !== undefined)

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <a href="/dashboard" className="text-blue-600 hover:underline text-sm mb-6 block">
          ← Terug naar dashboard
        </a>
        <h1 className="text-2xl font-bold mb-2">Wet DBA Analyse</h1>
        <p className="text-gray-600 mb-8">
          Beantwoord de vragen om het risicoprofiel van jouw opdrachtrelatie te bepalen.
        </p>

        <div className="space-y-6">
          {vragen.map((v) => (
            <div key={v.id} className="border rounded-lg p-5">
              <p className="font-medium mb-1">{v.vraag}</p>
              <p className="text-sm text-gray-500 mb-3">{v.toelichting}</p>
              <div className="flex gap-3">
                {(['ja', 'nee'] as const).map((optie) => (
                  <button
                    key={optie}
                    onClick={() => beantwoord(v.id, optie)}
                    className={`px-4 py-2 rounded border font-medium capitalize ${
                      antwoorden[v.id] === optie
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {optie}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {allesBeantwoord && !resultaat && (
          <button
            onClick={bereken}
            className="mt-8 w-full bg-blue-600 text-white rounded py-3 font-semibold hover:bg-blue-700"
          >
            Bekijk resultaat
          </button>
        )}

        {resultaat && (
          <div className={`mt-8 p-6 rounded-lg border-2 ${
            resultaat === 'laag' ? 'border-green-500 bg-green-50' :
            resultaat === 'middel' ? 'border-yellow-500 bg-yellow-50' :
            'border-red-500 bg-red-50'
          }`}>
            <h2 className="text-xl font-bold mb-2">
              Risicoprofiel:{' '}
              {resultaat === 'laag' ? '🟢 Laag risico' :
               resultaat === 'middel' ? '🟡 Middel risico' :
               '🔴 Hoog risico'}
            </h2>
            <p className="text-gray-700">
              {resultaat === 'laag' &&
                'Op basis van jouw antwoorden lijkt de opdrachtrelatie goed te voldoen aan de Wet DBA. Blijf dit regelmatig toetsen.'}
              {resultaat === 'middel' &&
                'Er zijn enkele aandachtspunten. Overweeg de werkafspraken te herzien om het risico te verlagen.'}
              {resultaat === 'hoog' &&
                'De opdrachtrelatie heeft kenmerken van loondienst. Dit brengt risico\'s mee onder de Wet DBA. Raadpleeg een adviseur.'}
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
