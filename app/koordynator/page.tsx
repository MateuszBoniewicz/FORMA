export default function CoordinatorPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold mb-6">Zarządzanie strukturą klubu</h1>
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">Aktywne drużyny</h2>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b">
                                <th className="pb-3 font-semibold">Nazwa drużyny</th>
                                <th className="pb-3 font-semibold">Rocznik</th>
                                <th className="pb-3 font-semibold">Trener prowadzący</th>
                                <th className="pb-3 font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b">
                                <td className="py-3">Juniorzy Starsi</td>
                                <td className="py-3">2006/2007</td>
                                <td className="py-3">trener@forma.pl</td>
                                <td className="py-3 text-green-600 font-medium">Aktywny</td>
                            </tr>
                            <tr>
                                <td className="py-3">Młodzicy</td>
                                <td className="py-3">2012/2013</td>
                                <td className="py-3">brak przypisania</td>
                                <td className="py-3 text-yellow-600 font-medium">Oczekuje</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Dodaj nową drużynę</h2>
                <form className="space-y-4 max-w-md">
                    <div>
                        <label className="block text-sm font-medium mb-1">Nazwa drużyny</label>
                        <input type="text" className="w-full border rounded p-2" placeholder="np. Trampkarze" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Rocznik</label>
                        <input type="text" className="w-full border rounded p-2" placeholder="np. 2010/2011" />
                    </div>
                    <button type="button" className="bg-blue-600 text-white px-4 py-2 rounded">
                        Zapisz drużynę
                    </button>
                </form>
            </div>
        </div>
    )
}