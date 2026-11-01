# ADR 0006: Interfejs Użytkownika — Tailwind CSS i System Design Pitch

- **Status:** Zaakceptowany
- **Data:** 2026-10
- **Obszar:** UI / UX / Design System

---

## 1. Kontekst i Problem

Większość aplikacji sportowych korzysta z generycznych szablonów dashboardów (Bootstrap, Material UI), które wyglądają bezosobowo i nie budują tożsamości dyscypliny. Aplikacja FORMA wymagała wyrazistego, taktycznego języka wizualnego, który:
1. Kojarzy się z boiskiem piłkarskim, tablicą taktyczną i dynamiką sportu.
2. Zapewnia doskonałą widoczność na zewnątrz w ostrym słońcu (wysoki kontrast, wyraźne obramowania).
3. Jest w 100% responsywny (płynne przejście z desktopowego centrum zarządzania do smartfona trenera).

---

## 2. Podjęta Decyzja

Zastosowano framework **Tailwind CSS** z autorskim systemem projektowym **Pitch / Neo-brutalism**:

1. **Stylistyka Wizualna**:
   - Twarde obrysy (`border-2 border-foreground/20` oraz `border-foreground`).
   - Cienie rzutowane offsetem neo-brutalizmu: `shadow-[2px_2px_0_0_var(--foreground)]` oraz `shadow-[3px_3px_0_0_var(--foreground)]`.
   - Tło taktyczne: wektory linii boiska piłkarskiego (`PitchArt`, `PitchMark`) o niskim kryciu.
   - Kolorystyka: zieleń murawy (`--primary`), głęboka czerń tekstu (`--foreground`) oraz ciepłe, papierowe tło (`--background`).
2. **Architektura Nawigacji Responsywnej (`AdminNavbar`)**:
   - Ekrany duże (desktop): poziomy pasek zakładek.
   - Ekrany mobilne (< 768px): automatyczne zwijanie do menu hamburgerowego z dużymi obszarami dotykowymi (zapobiega obcinaniu tekstu na urządzeniach 360–390px).

---

## 3. Konsekwencje

### Zalety (Pozytywne)
- **Unikalny charakter marki**: Aplikacja natychmiast wyróżnia się na rynku oprogramowania piłkarskiego.
- **Zero nieużywanego kodu CSS**: Tailwind kompiluje wyłącznie faktycznie użyte klasy użytkowe.
- **Wysoka dostępność na boisku**: Duże przyciski i twarde kontury minimalizują błędy dotykowe trenera pracującego w pośpiechu.

### Ograniczenia i Środki Zaradcze
- Wymóg dbania o kanoniczne klasy Tailwind (np. `stroke-3` zamiast arbitralnych `stroke-[3]`).