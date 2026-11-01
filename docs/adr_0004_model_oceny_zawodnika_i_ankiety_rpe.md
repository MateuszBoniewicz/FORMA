# ADR 0004: Domena Sportowa — Względna Ocena Treningowa (`- / 0 / +`) i Ankiety RPE

- **Status:** Zaakceptowany
- **Data:** 2026-10
- **Obszar:** Logika Domenowa / Metodologia Szkolenia

---

## 1. Kontekst i Problem

Większość systemów piłkarskich popełnia błąd próby numerycznego oceniania zawodników w skali 1–10 lub tworzenia sztucznych rankingów po każdym treningu. Prowadzi to do subiektywizmu, zniechęcenia trenerów rozbudowaną biurokracją oraz fałszywych wniosków skautingowych.

Zgodnie z filozofią produktu (**Rozdział 2 i 28 wymagań biznesowych**):
- Aplikacja ma być zorientowana na rozwój indywidualny (*player-development centered*).
- Ocena musi być ultra-szybka (mniej niż 90 sekund na cały zespół).
- Ocena ma opisywać dyspozycję zawodnika **względem jego własnego, typowego poziomu**, a nie w porównaniu z kolegami z drużyny.

---

## 2. Podjęta Decyzja

Wdrożono trzystopniową skalę względną oraz zintegrowany model absencji:

1. **Skala Trenera (`evaluations.score`)**:
   - `+` — zawodnik funkcjonował powyżej swojego typowego poziomu;
   - `0` — zawodnik funkcjonował na swoim typowym poziomie;
   - `-` — zawodnik funkcjonował poniżej swojego typowego poziomu.
2. **Ścisłe Rozróżnienie Absencji (RB-005, RB-006)**:
   - Zawodnik nieobecny **nie otrzymuje** oceny sportowej.
   - Wymagany jest powód absencji: `kontuzja`, `choroba`, `usprawiedliwiona`, `nieusprawiedliwiona`.
3. **Ankieta Potreningowa RPE bez logowania (BR-033 – BR-042)**:
   - Trener może jednym kliknięciem wygenerować bezpieczne, jednorazowe tokeny ankiet (`post_training_surveys`).
   - Odbiorca (junior/rodzic lub senior) ocenia poziom zmęczenia (skala 1–5 / RPE) oraz poziom zadowolenia z treningu bezpośrednio z poziomu przeglądarki w telefonie.

---

## 3. Konsekwencje

### Zalety (Pozytywne)
- **Wysoka ergonomia pracy trenera**: Interfejs typu „jeden zawodnik na ekranie” pozwala na błyskawiczne przejście przez skład po zakończeniu jednostki.
- **Brak fałszywych rankingów**: Zabezpieczenie przed tworzeniem krzywdzących zestawień dzieci w akademiach.
- **Korelacja subiektywna**: Możliwość zestawienia oceny trenera z deklarowanym zmęczeniem zawodnika w module analityki.

### Ograniczenia i Środki Zaradcze
- **Wymóg edukacji kadry trenerskiej**: Trenerzy muszą rozumieć, że nota `+` dla zawodnika początkującego nie oznacza, że jest on lepszy od lidera drużyny ocenionego na `0`. W interfejsie umieszczono opisy edukacyjne.