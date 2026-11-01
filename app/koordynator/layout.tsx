export default function CoordinatorLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen bg-gray-100">
            <aside className="w-64 bg-white border-r p-6">
                <h2 className="text-lg font-bold mb-6">Koordynator</h2>
                <nav className="space-y-2">
                    <a href="/koordynator" className="block p-2 rounded hover:bg-gray-100">Przegląd</a>
                    <a href="/koordynator" className="block p-2 rounded hover:bg-gray-100">Zarządzanie</a>
                </nav>
            </aside>
            <main className="flex-1 p-8 overflow-y-auto">
                {children}
            </main>
        </div>
    )
}