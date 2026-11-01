"use client";

import { useState } from "react";
import { 
  FileSpreadsheet, 
  Upload, 
  X, 
  AlertCircle, 
  CheckCircle2,
  Download,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { bulkImportPlayersAction, CsvPlayerRecord } from "@/app/actions/admin";

interface CsvImporterModalProps {
  teams: { id: string; name: string }[];
  onClose: () => void;
  onSuccess: (count: number) => void;
}

export function CsvImporterModal({
  teams,
  onClose,
  onSuccess,
}: CsvImporterModalProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teams[0]?.id || "");
  const [parsedRecords, setParsedRecords] = useState<CsvPlayerRecord[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Generuje i pobiera gotowy wzorcowy plik CSV z kodowaniem UTF-8 (BOM)
  function downloadCsvTemplate() {
    const headers = "imie;nazwisko;rocznik;numer;telefon_gracza;email_gracza;imie_rodzica;telefon_rodzica;email_rodzica";
    const sampleSenior = "Jakub;Błaszczykowski;2001;16;501200300;j.blaszczykowski@forma.pl;;;";
    const sampleJunior = "Kacper;Kowalski;2011;10;600100200;kacper.k@poczta.pl;Piotr Kowalski;509888777;piotr.kowalski@rodzic.pl";

    const csvContent = "\uFEFF" + [headers, sampleSenior, sampleJunior].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "wzorzec_importu_zawodnikow_forma.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function parseCsvContent(text: string) {
    setErrorMsg(null);
    const lines = text
      .split(/\r\n|\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      setErrorMsg("Plik CSV musi zawierać wiersz nagłówkowy oraz co najmniej jednego zawodnika.");
      setParsedRecords([]);
      return;
    }

    const delimiter = lines[0].includes(";") ? ";" : ",";
    const rawHeaders = lines[0].split(delimiter).map((h) => h.trim().toLowerCase());

    const colFirstName = rawHeaders.findIndex((h) => h.includes("imie") || h.includes("first"));
    const colLastName = rawHeaders.findIndex((h) => h.includes("nazwisk") || h.includes("last"));
    const colBirthYear = rawHeaders.findIndex((h) => h.includes("rocznik") || h.includes("rok") || h.includes("birth"));
    const colJersey = rawHeaders.findIndex((h) => h.includes("numer") || h.includes("jersey") || h.includes("nr"));

    // Rozróżnienie kontaktów gracza vs rodzica
    const colParentPhone = rawHeaders.findIndex((h) => h.includes("telefon_rodzica") || h.includes("rodzic_tel") || h.includes("parent_phone"));
    const colParentName = rawHeaders.findIndex((h) => h.includes("imie_rodzica") || h.includes("opiekun") || h.includes("rodzic"));
    const colParentEmail = rawHeaders.findIndex((h) => h.includes("email_rodzica") || h.includes("rodzic_email") || h.includes("parent_mail"));
    const colPlayerPhone = rawHeaders.findIndex((h) => (h.includes("telefon") || h.includes("tel") || h.includes("phone")) && !h.includes("rodzic"));
    const colPlayerEmail = rawHeaders.findIndex((h) => (h.includes("email") || h.includes("mail")) && !h.includes("rodzic"));

    if (colFirstName === -1 || colLastName === -1) {
      setErrorMsg("Plik CSV musi posiadać co najmniej kolumny: 'Imię' i 'Nazwisko'.");
      setParsedRecords([]);
      return;
    }

    const records: CsvPlayerRecord[] = [];
    const currentYear = new Date().getFullYear();

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(delimiter).map((p) => p.trim());
      if (parts.length <= 1) continue;

      const fName = parts[colFirstName] || "";
      const lName = parts[colLastName] || "";
      if (!fName || !lName) continue;

      let bYear = currentYear - 14;
      if (colBirthYear !== -1 && parts[colBirthYear]) {
        const parsed = parseInt(parts[colBirthYear], 10);
        if (!isNaN(parsed) && parsed > 1970 && parsed <= currentYear) {
          bYear = parsed;
        }
      }

      let jNum: number | null = null;
      if (colJersey !== -1 && parts[colJersey]) {
        const parsed = parseInt(parts[colJersey], 10);
        if (!isNaN(parsed)) jNum = parsed;
      }

      records.push({
        firstName: fName,
        lastName: lName,
        birthYear: bYear,
        jerseyNumber: jNum,
        phone: colPlayerPhone !== -1 ? parts[colPlayerPhone] || undefined : undefined,
        email: colPlayerEmail !== -1 ? parts[colPlayerEmail] || undefined : undefined,
        parentName: colParentName !== -1 ? parts[colParentName] || undefined : undefined,
        parentPhone: colParentPhone !== -1 ? parts[colParentPhone] || undefined : undefined,
        parentEmail: colParentEmail !== -1 ? parts[colParentEmail] || undefined : undefined,
      });
    }

    if (records.length === 0) {
      setErrorMsg("Nie odczytano prawidłowych wierszy z pliku.");
      setParsedRecords([]);
      return;
    }

    setParsedRecords(records);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) parseCsvContent(content);
    };
    reader.readAsText(file);
  }

  async function handleImportSubmit() {
    if (parsedRecords.length === 0) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await bulkImportPlayersAction(selectedTeamId || null, parsedRecords);

    if (res.success && res.count) {
      onSuccess(res.count);
    } else {
      setErrorMsg(res.error || "Błąd podczas importu danych do bazy.");
    }
    setIsSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border-2 border-foreground bg-card p-6 shadow-[5px_5px_0_0_var(--foreground)] space-y-4">
        
        {/* Nagłówek */}
        <div className="flex items-center justify-between border-b-2 border-foreground/15 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg border border-primary/30 bg-primary/10 p-2 text-primary">
              <FileSpreadsheet className="size-5" />
            </div>
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary block">
                Ewidencja Masowa
              </span>
              <h3 className="font-heading text-2xl uppercase tracking-tight">
                Import Zawodników z CSV
              </h3>
            </div>
          </div>

          <button type="button" onClick={onClose} className="rounded-full border p-1 hover:bg-muted">
            <X className="size-4" />
          </button>
        </div>

        {/* Pasek akcji: Pobieranie wzoru i poradnik */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-foreground/15 bg-muted/40 p-3">
          <button
            type="button"
            onClick={downloadCsvTemplate}
            className="inline-flex items-center gap-1.5 rounded-lg border border-foreground/20 bg-background px-3 py-1.5 font-mono text-xs font-bold text-foreground shadow-sm hover:bg-muted transition"
          >
            <Download className="size-3.5 text-primary" />
            <span>Pobierz wzorcowy plik CSV (.csv)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowGuide((prev) => !prev)}
            className="inline-flex items-center gap-1 font-mono text-xs font-bold text-primary hover:underline"
          >
            <HelpCircle className="size-3.5" />
            <span>Jak przygotować plik?</span>
            {showGuide ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>
        </div>

        {/* Rozwijany poradnik administratora */}
        {showGuide && (
          <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4 text-xs font-mono space-y-3 animate-in fade-in">
            <div className="font-bold text-primary uppercase tracking-wide">
              Instrukcja rozdzielania danych (Junior vs Senior)
            </div>
            <p className="text-muted-foreground leading-relaxed">
              System automatycznie klasyfikuje gracza na podstawie kolumny <strong>rocznik</strong>:
            </p>
            <ul className="list-disc list-inside space-y-1 text-foreground">
              <li>
                <strong>Senior (18+ lat):</strong> Uzupełnij kolumny <code>telefon_gracza</code> oraz <code>email_gracza</code>. Kolumny rodzica mogą pozostać puste.
              </li>
              <li>
                <strong>Junior (&lt; 18 lat):</strong> Wymagane są <code>imie_rodzica</code>, <code>telefon_rodzica</code> oraz <code>email_rodzica</code>. Kolumny gracza są opcjonalne (jeśli junior posiada już własny telefon lub mail).
              </li>
            </ul>
            <div className="border-t border-primary/20 pt-2 text-[11px] text-muted-foreground">
              Format pliku: separator średnik (<code>;</code>) lub przecinek (<code>,</code>). Kodowanie: UTF-8.
            </div>
          </div>
        )}

        {/* Wybór drużyny docelowej */}
        <div>
          <label className="font-mono text-xs font-bold uppercase text-muted-foreground block mb-1">
            Drużyna docelowa dla importu:
          </label>
          <select
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="h-10 w-full rounded-xl border-2 border-foreground/20 bg-background px-3 font-mono text-sm outline-none focus:border-foreground"
          >
            <option value="">-- Wolny transfer (bez przypisania do drużyny) --</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Dropzone pliku */}
        <div className="rounded-xl border-2 border-dashed border-foreground/30 bg-background p-5 text-center space-y-2">
          <Upload className="mx-auto size-6 text-primary" />
          <div>
            <label className="cursor-pointer font-heading text-sm uppercase font-bold text-primary hover:underline">
              <span>Wybierz plik CSV z komputera</span>
              <input type="file" accept=".csv,text/csv" onChange={handleFileChange} className="hidden" />
            </label>
          </div>

          {fileName && (
            <div className="inline-flex items-center gap-1.5 rounded-md border border-foreground/20 bg-muted px-2.5 py-1 font-mono text-xs text-foreground">
              <CheckCircle2 className="size-3.5 text-primary" />
              <span>{fileName}</span>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="rounded-xl border-2 border-destructive bg-destructive/10 p-3 text-xs font-mono text-destructive flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Podgląd tabeli */}
        {parsedRecords.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-foreground">Rozpoznano: {parsedRecords.length} graczy</span>
              <span className="text-muted-foreground">Podgląd pierwszych 4 wpisów</span>
            </div>

            <div className="max-h-36 overflow-y-auto rounded-xl border-2 border-foreground/15 bg-background p-2">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-border/80 text-muted-foreground uppercase text-[10px]">
                    <th className="p-1">Nr</th>
                    <th className="p-1">Zawodnik</th>
                    <th className="p-1">Rocznik</th>
                    <th className="p-1">Kontakt gracza</th>
                    <th className="p-1">Kontakt rodzica</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {parsedRecords.slice(0, 4).map((r, idx) => (
                    <tr key={idx}>
                      <td className="p-1 font-bold text-primary">{r.jerseyNumber ? `#${r.jerseyNumber}` : "—"}</td>
                      <td className="p-1">{r.lastName} {r.firstName}</td>
                      <td className="p-1 text-muted-foreground">{r.birthYear}</td>
                      <td className="p-1 text-[11px]">{r.phone || r.email || "—"}</td>
                      <td className="p-1 text-[11px] text-muted-foreground">{r.parentPhone || r.parentEmail || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="pt-2 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-11 w-1/2 rounded-xl border-2 border-foreground/20 bg-background font-heading text-xs uppercase hover:bg-muted"
          >
            Anuluj
          </button>
          <button
            type="button"
            onClick={handleImportSubmit}
            disabled={parsedRecords.length === 0 || isSubmitting}
            className="h-11 w-1/2 rounded-xl border-2 border-foreground bg-primary font-heading text-xs font-bold uppercase text-primary-foreground shadow-[2px_2px_0_0_var(--foreground)] disabled:opacity-40"
          >
            {isSubmitting ? "Importowanie..." : `Zapisz ${parsedRecords.length} graczy`}
          </button>
        </div>
      </div>
    </div>
  );
}