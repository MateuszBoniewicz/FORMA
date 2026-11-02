# ADR 0002: Baza Danych i Izolacja Danych — PostgreSQL i Multi-Tenancy (`club_id`)

- **Status:** Zaakceptowany
- **Data:** 2026-10
- **Obszar:** Baza Danych / Architektura Danych

---

## 1. Kontekst i Problem

Zgodnie z wymaganiami biznesowymi **BR-001**, **BR-073** oraz **BR-074**, system FORMA musi docelowo obsługiwać wiele niezależnych akademii piłkarskich (model SaaS). Dane jednego klubu (zawodnicy, oceny, notatki, kontakty rodziców) pod żadnym pozorem nie mogą być dostępne dla użytkowników innej organizacji.

Rozważano trzy warianty architektoniczne:
1. *Database-per-tenant* (osobna instancja bazy danych dla każdego klubu).
2. *Schema-per-tenant* (osobny schemat PostgreSQL dla każdego klubu).
3. *Shared-database, shared-schema with Discriminator Column* (jedna baza, kolumna `club_id` + Row Level Security).

---

## 2. Podjęta Decyzja

Wybrano wariant **współdzielonej bazy danych z kolumną dyskryminującą (`club_id`)** zarządzaną przez silnik **PostgreSQL** w ekosystemie **Supabase**.

Kluczowe mechanizmy implementacyjne:
1. **Klucz obcy `club_id`**: Każda kluczowa tabela domenowa (`teams`, `profiles`, `players`, `trainings`, `evaluations`, `audit_logs`) posiada kolumnę `club_id UUID NOT NULL REFERENCES public.clubs(id)`.
2. **Indeksowanie**: Założono indeksy B-Tree na kolumnach `club_id` w celu zapewnienia stałego czasu zapytań ($O(\log N)$) niezależnie od wzrostu liczby klubów w systemie.
3. **Wymuszenie kontekstu w warstwie aplikacji**: Wszystkie akcje serwerowe rozpoczynają się od pomocnika `requireAdmin()` lub `requireCoach()`, który odczytuje tożsamość z sesji i wstrzykuje `clubId` do każdego zapytania SQL.

---

## 3. Konsekwencje

### Zalety (Pozytywne)
- **Minimalne koszty infrastruktury**: Jedna instancja bazy danych obsługuje wszystkie kluby w fazie MVP.
- **Uproszczone migracje schematu**: Każda zmiana struktury tabeli (np. dodanie `avatar_url` czy `birth_date`) aplikuje się natychmiast dla całego systemu.
- **Wydajne raportowanie Master Admina**: Możliwość budowania agregatów globalnych platformy bez cross-database queries.

### Ograniczenia i Środki Zaradcze
- **Ryzyko wycieku danych przy błędzie programistycznym**: Pominięcie warunku `.eq("club_id", clubId)` mogłoby zwrócić rekordy innego klubu. Środek zaradczy: hermetyzacja zapytań w bezpiecznych akcjach serwerowych oraz docelowe uzupełnienie o reguły PostgreSQL RLS (*Row Level Security*).