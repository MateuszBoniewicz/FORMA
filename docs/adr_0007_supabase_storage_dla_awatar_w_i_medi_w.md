# ADR 0007: Pliki Binarne — Supabase Storage do Obsługi Mediów

- **Status:** Zaakceptowany
- **Data:** 2026-10
- **Obszar:** Storage / Media Assets

---

## 1. Kontekst i Problem

Wymogi biznesowe **BR-014** oraz ewidencja sztabu zakłada opcjonalne zdjęcia profilowe trenerów i zawodników. 
Ręczne wprowadzanie zewnętrznych adresów URL w formularzach było rozwiązaniem tymczasowym, nieakceptowalnym dla użytkownika końcowego. Wrzucanie plików bezpośrednio do bazy PostgreSQL w polach `BYTEA` prowadziłoby do gwałtownego rozrostu bazy i degradacji wydajności kopii zapasowych.

---

## 2. Podjęta Decyzja

Zdecydowano o wykorzystaniu usługi **Supabase Storage** (opartej pod maską na protokole S3):

1. **Struktura Bucketów**:
   - Dedykowany publiczny bucket `avatars` zoptymalizowany pod kątem odczytu przez CDN.
2. **Ścieżki i Izolacja Danych**:
   - Pliki organizowane w przestrzeniach klubowych: `avatars/{clubId}/coaches/{timestamp}-{filename}` oraz `avatars/{clubId}/players/{timestamp}-{filename}`.
3. **Architektura Przesyłania (Direct-to-Storage)**:
   - Zdjęcia są przesyłane bezpośrednio z przeglądarki klienta do Supabase Storage.
   - Do bazy danych trafia wyłącznie wygenerowany publiczny adres URL zwracany przez `getPublicUrl()`.

---

## 3. Konsekwencje

### Zalety (Pozytywne)
- **Odciążenie serwera aplikacyjnego**: Next.js Server Actions nie transferują ciężkich strumieni binarnych zdjęć.
- **Globalny caching CDN**: Zdjęcia są serwowane z minimalnym opóźnieniem bezpośrednio z infrastruktury brzegowej CDN.
- **Prosty interfejs**: Możliwość wdrożenia komponentu `ImageUpload` z bezpośrednim podglądem i kadrowaniem.

### Ograniczenia i Środki Zaradcze
- Konieczność skonfigurowania polityki Storage RLS zezwalającej na upload wyłącznie autoryzowanym administratorom klubu.