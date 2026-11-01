# ADR 0001: Architektura Full-Stack — Next.js App Router i Server Actions

- **Status:** Zaakceptowany
- **Data:** 2026-10
- **Obszar:** Frontend / Backend / Routing

---

## 1. Kontekst i Problem

Platforma FORMA wymagała nowoczesnego frameworka full-stack, który pozwoli na:
1. Szybkie renderowanie interfejsów po stronie serwera (SSR) dla bezpieczeństwa danych klubowych.
2. Eliminację konieczności utrzymywania osobnego serwera API (REST/GraphQL) na wczesnym etapie MVP.
3. Rygorystyczne typowanie TypeScript w całym potoku (od bazy danych przez logikę serwerową po komponenty UI).
4. Płynne działanie na urządzeniach mobilnych przy boisku (trener oceniający zawodników bezpośrednio po jednostce treningowej).

Rozważano architekturę rozproszoną (React SPA w Vite + osobny backend w NestJS/FastAPI) oraz architekturę zintegrowaną w Next.js.

---

## 2. Podjęta Decyzja

Zdecydowano o wyborze **Next.js (App Router)** z silnikiem **React Server Components (RSC)** oraz **Server Actions** jako jedynego środowiska uruchomieniowego aplikacji.

Główne założenia wdrożenia:
- **Server Actions (`app/actions/*`)**: Wszystkie mutacje bazy danych (zarządzanie drużynami, rejestracja sztabu, import CSV, zapisywanie ocen) są realizowane jako asynchroniczne akcje serwerowe opatrzone klauzulą `"use server"`.
- **Dynamiczne renderowanie SSR**: Strony administracyjne i trenerskie korzystają z `await connection()`, co zabezpiecza przed błędami prerenderingu statycznego podczas budowania na platformie Vercel (`unstable Date.now()`).
- **Separacja ról w routingu**:
  - `/admin/*` — strefa zarządzania strukturą klubu (zarząd, koordynator).
  - `/trener/*` — zoptymalizowana pod urządzenia mobilne strefa realizacji i oceny treningu.
  - `/ankieta/*` — lekka, publicznie dostępna strefa ankiet RPE bez konieczności logowania.

---

## 3. Konsekwencje

### Zalety (Pozytywne)
- **Brak konieczności budowania warstwy API boilerplate**: Server Actions bezpośrednio weryfikują uprawnienia sesji i komunikują się z Supabase.
- **Automatyczna rewalidacja danych**: Funkcja `revalidatePath` gwarantuje natychmiastową spójność interfejsu bez ręcznego czyszczenia cache po stronie klienta.
- **Bezpieczeństwo kluczy**: Wszystkie wrażliwe operacje (np. klucz serwisowy Supabase Admin) wykonują się w izolowanym środowisku serwerowym Node.js.

### Ograniczenia i Środki Zaradcze
- **Wymóg jawnej kontroli prerenderingu**: Konieczność stosowania `await connection()` na stronach dynamicznych, aby zapobiec próbie statycznego kompilowania tras autoryzowanych podczas buildu Vercel.
- **Granice klient-serwer**: Wymóg precyzyjnego oznaczania `"use client"` na interaktywnych komponentach modalnych i formularzach.