'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Er is iets misgegaan</h1>
        <p className="text-gray-600">{error.message}</p>
        <button
          onClick={reset}
          className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
        >
          Probeer opnieuw
        </button>
      </div>
    </main>
  )
}
