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

# Szczegółowa dokumentacja bazy danych

# 1. Jakie są tabele

| Nr  | Tabela           | Do czego służy?                                    |
| --- | ---------------- | -------------------------------------------------- |
| 1   | `battles`        | Informacje o bitwach                               |
| 2   | `sides`          | Strony konfliktu, np. wojska niebieskie i czerwone |
| 3   | `units`          | Jednostki wojskowe, np. bataliony                  |
| 4   | `unit_positions` | Pozycje jednostek w określonych momentach          |
| 5   | `orders`         | Rozkazy wydawane jednostkom                        |
| 6   | `unit_events`    | Inne wydarzenia historyczne, np. utrata jednostki  |
|     |                  |                                                    |


---

# 2. Struktura poszczególnych tabel

## Tabela 1: `battles`

Przechowuje informacje o bitwach dostępnych w menu głównym.

| Pole          | Typ danych   | Opis                    |
| ------------- | ------------ | ----------------------- |
| `id`          | UUID         | Klucz główny            |
| `name`        | VARCHAR(150) | Nazwa bitwy             |
| `description` | TEXT         | Opis bitwy              |
| `start_time`  | TIMESTAMPTZ  | Początek bitwy          |
| `end_time`    | TIMESTAMPTZ  | Koniec bitwy            |
| `created_at`  | TIMESTAMPTZ  | Data utworzenia rekordu |

**Przykładowy rekord:**

| id         | name    | description                        |
| ---------- | ------- | ---------------------------------- |
| `uuid-001` | Bitwa A | Przykładowy scenariusz historyczny |

Ta tabela pozwala wyświetlić listę bitew w menu i określić zakres dostępnego czasu na osi chronologicznej.

## Tabela 2: `sides`

Przechowuje strony konfliktu. Dzięki temu możecie przypisać jednostki do odpowiednich stron i odróżniać je kolorami na mapie.

| Pole          | Typ danych   | Opis                           |
| ------------- | ------------ | ------------------------------ |
| `id`          | UUID         | Klucz główny                   |
| `battle_id`   | UUID         | Bitwa, do której należy strona |
| `name`        | VARCHAR(100) | Nazwa strony                   |
| `color`       | VARCHAR(7)   | Kolor w formacie HEX           |
| `description` | TEXT         | Opis strony                    |

**Przykładowe rekordy:**

| name     | color     |
| -------- | --------- |
| Strona A | `#2563EB` |
| Strona B | `#DC2626` |

Relacja: jedna bitwa może mieć wiele stron konfliktu.

## Tabela 3: `units`

Przechowuje informacje o jednostkach wojskowych.

| Pole         | Typ danych   | Opis                                  |
| ------------ | ------------ | ------------------------------------- |
| `id`         | UUID         | Klucz główny                          |
| `battle_id`  | UUID         | Bitwa, w której uczestniczy jednostka |
| `side_id`    | UUID         | Strona konfliktu                      |
| `name`       | VARCHAR(150) | Nazwa jednostki                       |
| `unit_type`  | VARCHAR(50)  | Typ jednostki, np. batalion           |
| `symbol`     | VARCHAR(50)  | Symbol wyświetlany na mapie           |
| `created_at` | TIMESTAMPTZ  | Data utworzenia rekordu               |

**Przykładowe rekordy:**

| name                     | unit_type | symbol   |
| ------------------------ | --------- | -------- |
| 1. Batalion Piechoty     | battalion | infantry |
| 2. Batalion Pancerny     | battalion | armor    |
| 3. Kompania Rozpoznawcza | company   | recon    |

`side_id` określa stronę, a `battle_id` bitwę, do której należy jednostka.

Dzięki temu mapa może pobierać wszystkie jednostki konkretnej bitwy i kolorować je zgodnie z przynależnością do strony konfliktu.

## Tabela 4: `unit_positions`

**To najważniejsza tabela dla osi czasu.** Przechowuje pozycje jednostek w różnych momentach.

| Pole          | Typ danych                          | Opis                                 |
| ------------- | ----------------------------------- | ------------------------------------ |
| `id`          | BIGINT GENERATED ALWAYS AS IDENTITY | Klucz główny                         |
| `unit_id`     | UUID                                | Jednostka, której dotyczy pozycja    |
| `recorded_at` | TIMESTAMPTZ                         | Moment, dla którego zapisano pozycję |
| `longitude`   | DOUBLE PRECISION                    | Długość geograficzna                 |
| `latitude`    | DOUBLE PRECISION                    | Szerokość geograficzna               |
| `heading`     | REAL                                | Kierunek jednostki w stopniach       |
| `strength`    | INTEGER                             | Liczebność jednostki                 |

**Przykładowe rekordy:**

| unit_id  | recorded_at | longitude | latitude | heading | strength |
| -------- | ----------- | --------- | -------- | ------- | -------- |
| unit-001 | 10:00       | 17.0385   | 51.1079  | 90      | 500      |
| unit-001 | 11:00       | 17.0500   | 51.1100  | 90      | 450      |
| unit-001 | 12:00       | 17.0700   | 51.1150  | 45      | 420      |

Współrzędne są przykładowe.

W tym modelu jedna jednostka może mieć tysiące rekordów w tabeli `unit_positions`.

Jeśli użytkownik przesunie suwak na 11:00, aplikacja znajdzie pozycję tej jednostki zapisaną dla tego momentu.

**Ważne:** `heading` oznacza kierunek, w którym skierowana jest jednostka, a niekoniecznie kierunek jej ruchu. Jeśli potrzebujecie obu informacji, dodajcie osobne pole lub obliczajcie kierunek ruchu z kolejnych pozycji.

## Tabela 5: `orders`

Przechowuje rozkazy wydawane jednostkom.

| Pole               | Typ danych       | Opis                                |
| ------------------ | ---------------- | ----------------------------------- |
| `id`               | UUID             | Klucz główny                        |
| `unit_id`          | UUID             | Jednostka, której dotyczy rozkaz    |
| `issued_at`        | TIMESTAMPTZ      | Czas wydania rozkazu                |
| `valid_from`       | TIMESTAMPTZ      | Początek obowiązywania              |
| `valid_until`      | TIMESTAMPTZ      | Koniec obowiązywania; może być NULL |
| `order_type`       | VARCHAR(50)      | Typ rozkazu                         |
| `description`      | TEXT             | Treść rozkazu                       |
| `target_longitude` | DOUBLE PRECISION | Długość geograficzna celu           |
| `target_latitude`  | DOUBLE PRECISION | Szerokość geograficzna celu         |

**Przykładowy rekord:**

| Pole               | Wartość                 |
| ------------------ | ----------------------- |
| `unit_id`          | unit-001                |
| `issued_at`        | 10:00                   |
| `valid_from`       | 10:15                   |
| `valid_until`      | 12:00                   |
| `order_type`       | move                    |
| `description`      | Przesunąć się na północ |
| `target_longitude` | 17.0800                 |
| `target_latitude`  | 51.1300                 |

Dzięki tej tabeli kliknięcie jednostki na mapie może wyświetlić jej rozkaz.

Jeśli użytkownik ogląda godzinę 11:00, aplikacja pokaże rozkaz obowiązujący o 11:00. Jeśli ogląda godzinę 09:00, nie powinna pokazywać go jako aktywnego.

Warto pamiętać, że jedna jednostka może mieć wiele rozkazów w trakcie bitwy.

## Tabela 6: `unit_events`

Przechowuje dodatkowe wydarzenia dotyczące jednostek.

Możecie jej używać do rejestrowania utraty sprzętu, zmian podporządkowania, rozwiązania jednostki czy innych zdarzeń wpływających na przebieg bitwy.

| Pole          | Typ danych  | Opis                                 |
| ------------- | ----------- | ------------------------------------ |
| `id`          | UUID        | Klucz główny                         |
| `unit_id`     | UUID        | Jednostka, której dotyczy wydarzenie |
| `occurred_at` | TIMESTAMPTZ | Czas wydarzenia                      |
| `event_type`  | VARCHAR(50) | Typ wydarzenia                       |
| `description` | TEXT        | Opis wydarzenia                      |

Przykładowe typy wydarzeń:

- `reinforcement` — otrzymanie posiłków;
- `casualties` — straty;
- `retreat` — odwrót;
- `attachment` — przydzielenie do innej jednostki.



