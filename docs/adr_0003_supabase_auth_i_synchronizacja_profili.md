# ADR 0003: Tożsamość i Uprawnienia — Supabase Auth i `public.profiles`

- **Status:** Zaakceptowany
- **Data:** 2026-10
- **Obszar:** Bezpieczeństwo / Autoryzacja / Zarządzanie Użytkownikami

---

## 1. Kontekst i Problem

W systemie występują role o zróżnicowanych uprawnieniach: `master_admin`, `club_admin` oraz `coach` (wymogi **BR-067 – BR-072**). 
W klasycznym modelu Supabase tworzenie użytkownika przez API klienta wysyła mail potwierdzający i nie pozwala administratorowi na natychmiastowe utworzenie gotowego konta dla nowego trenera (z loginem, hasłem początkowym i danymi kontaktowymi). Ponadto dane autoryzacyjne (`auth.users`) są odseparowane od relacji domenowych klubu w schemacie publicznym.

---

## 2. Podjęta Decyzja

Wdrożono dwupoziomowy model tożsamości:
1. **Warstwa Uwierzytelniania (`auth.users`)**: Zarządzana przez instancję `supabaseAdmin` z wykorzystaniem klucza serwisowego `SUPABASE_SERVICE_ROLE_KEY`.
2. **Warstwa Domenowa (`public.profiles`)**: Przechowuje profil pracownika klubu, powiązany relacją `id REFERENCES auth.users(id) ON DELETE CASCADE`.

Schemat tworzenia konta trenera (`createCoachAccountAction`):
1. Administrator podaje dane: imię, nazwisko, e-mail, telefon, opcjonalny awatar oraz hasło startowe.
2. Serwer wywołuje `supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true })`.
3. Po uzyskaniu `user.id` następuje transakcyjny zapis rekordu w `public.profiles` z rolą `'coach'` i przypisanym `club_id`.
4. W przypadku niepowodzenia zapisu profilu następuje automatyczny rollback (usunięcie konta z `auth.users`).

---

## 3. Konsekwencje

### Zalety (Pozytywne)
- **Kompletny cykl życia trenera (CRUD)**: Administrator może tworzyć konta, aktualizować dane kontaktowe, zmieniać hasła oraz trwale usuwać konta bez interakcji z zewnętrznymi panelami.
- **Spójność referencyjna**: Usunięcie trenera kaskadowo czyści powiązania w tabeli sztabu `team_coaches`.
- **Brak konieczności klikania linków aktywacyjnych**: Trener otrzymuje dane od administratora i może od razu zalogować się na boisku.

### Ograniczenia i Środki Zaradcze
- **Wymóg ochrony klucza serwisowego**: `SUPABASE_SERVICE_ROLE_KEY` nigdy nie może trafić do kodu klienckiego (przeglądarki). Jest ściśle ograniczony do modułu `lib/supabase-admin.ts`.