# CWEL(f) – Czasowa Wizualizacja Ewolucji Linii (frontu)

> **Interaktywna platforma do chronologicznej rekonstrukcji starć zbrojnych oraz wizualizacji dynamiki teatru działań wojennych.**

---

## 📌 Problem i Cel Projektu

Tradycyjne mapy historyczne w podręcznikach i atlasach są **statyczne, przeładowane informacjami i nieczytelne dla laika**. Zrozumienie manewrów oskrzydlających, tempa natarcia czy odwrotu jednostek z dziesiątek nałożonych na siebie wektorów wymaga wiedzy eksperckiej.

**CWEL(f)** rozwiązuje ten problem:
* **Przystępność dla każdego:** Przekształca suche fakty historyczne w interaktywną symulację czasoprzestrzenną, idealną do zastosowań edukacyjnych w szkołach.
* **Dynamika w czasie:** Umożliwia płynne przesuwanie suwaka osi czasu, ukazując ewolucję linii frontu godzina po godzinie.
* **Głębia taktyczna:** Każda jednostka posiada własną historię rozkazów, stan liczebny oraz wektory ruchu.

---

## ✨ Główne Funkcjonalności

- **Chronologiczna Oś Czasu (Player):** Suwak czasu z możliwością płynnego odtwarzania przebiegu bitwy lub manualnego skoku do konkretnego momentu.
- **Wizualizacja Taktyczna (Leaflet.js):** Jednostki reprezentowane są jako punkty na mapie oznaczone kolorami swoich stron konfliktu.
- **Wektory i Kierunki Ruchu:** Dynamiczne przeliczanie pozycji w czasie oraz wizualizacja celów rozkazów (`target line`).
- **Inspekcja Rozkazów:** Po kliknięciu w dowolny oddział boczny panel wyświetla aktualny rozkaz obowiązujący dokładnie w wybranym momencie osi czasu.
- **Podział na Odtwarzacz i Edytor:**
  - *Wizualizacja:* Czysty tryb prezentacyjny bez zbędnych kontrolek, skupiony na analizie.
  - *Edytor:* Panel umożliwiający tworzenie nowych scenariuszy, nanoszenie batalionów i rejestrację rozkazów.

---

## 🛠️ Stos Technologiczny

- **Frontend:** HTML5, Tailwind CSS, Font Awesome 6
- **Silnik Mapowy:** [Leaflet.js](https://leafletjs.com/) z podkładem OpenStreetMap
- **Baza Danych & Backend:** [Supabase](https://supabase.com/) (PostgreSQL z relacjami czasoprzestrzennymi)

---

## 🗄️ Model Bazy Danych

Struktura bazy danych została zaprojektowana z myślą o efektywnej obsłudze danych czasowo-przestrzennych:

| Tabela | Opis |
| :--- | :--- |
| `battles` | Metadane bitwy, zakres dat (`start_time`, `end_time`) i opis scenariusza. |
| `sides` | Strony konfliktu wraz z definicją barw identyfikacyjnych (kod HEX). |
| `units` | Identyfikatory jednostek, ich typy oraz symbole taktyczne. |
| `unit_positions` | Kluczowa tabela osi czasu: współrzędne geograficzne (`lat`, `lng`), kierunek (`heading`) i liczebność w konkretnych momentach. |
| `orders` | Rozkazy wydawane jednostkom (`valid_from`, `valid_until`, opis oraz koordynaty celu). |
| `unit_events` | Zdarzenia taktyczne (straty, posiłki, przegrupowania). |

---
