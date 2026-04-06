export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-gray-600">Deze pagina bestaat niet.</p>
        <a href="/" className="inline-block bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700">Terug naar home</a>
      </div>
    </main>
  )
}
