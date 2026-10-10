import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import * as turf from '@turf/turf';
import 'leaflet-polylinedecorator';

// =========================================================================
// 1. INICJALIZACJA MAPY
// =========================================================================
const map = L.map('map').setView([52.069, 19.480], 6);



L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

map.pm.addControls({
    position: 'topleft',
    drawCircleMarker: false,
    drawCircle: false,
    drawText: false,
    editMode: false,
    dragMode: true,
    cutPolygon: true,
    removalMode: true,
});

// MAGIA NA LAGI: Wyłączamy przyciąganie (snapping) do skomplikowanych granic!
map.pm.setGlobalOptions({ snappable: false });


// =========================================================================
// 2. ZMIENNE GLOBALNE I SYSTEM COFANIA (CTRL+Z)
// =========================================================================
let historiaMapy = [];
let wybraneDoAneksji = [];
let trybRysowaniaStrzalki = false; // <--- NOWA ZMIENNA
let frakcje = {
    pl: { nazwa: 'Polska', kolor: '#e63946' },
    de: { nazwa: 'Niemcy', kolor: '#495057' },
    su: { nazwa: 'ZSRR', kolor: '#d9480f' },
    sk: { nazwa: 'Słowacja', kolor: '#2b8a3e' },
    neutral: { nazwa: 'Neutralne', kolor: '#adb5bd' },
};
let aktywnaFrakcja = 'pl';
let trybMalowania = false;

function zapiszStan() {
    const warstwy = map.pm.getGeomanLayers();
    const features = warstwy.map(layer => layer.toGeoJSON());

    historiaMapy.push({
        type: "FeatureCollection",
        features: features
    });

    if (historiaMapy.length > 15) {
        historiaMapy.shift();
    }
}
zapiszStan();

function odtworzStan(geoJsonData) {
    map.pm.getGeomanLayers().forEach(layer => layer.remove());
    const geoJsonLayer = L.geoJSON(geoJsonData).addTo(map);

    geoJsonLayer.getLayers().forEach(layer => {
        layer.options.pmIgnore = false;
        L.PM.reInitLayer(layer);

        const props = layer.feature?.properties;
        if (props?.isArrow && layer instanceof L.Polyline) {
            stylujStrzalke(layer, props.color);
        }
        if (props?.frakcja && !(layer instanceof L.Marker)) zastosujFrakcje(layer, props.frakcja);
        if (props) {
            if (layer instanceof L.Marker && props.iconType) {
                zastosujIkone(layer, props.iconType, props.iconUrl);
            }
            const nazwa = props.name || props.NAME || props.Name || props.SUBJECTO;
            if (nazwa) {
                layer.bindTooltip(nazwa, { permanent: false, sticky: true, className: "moj-tooltip" });
            }
        }
        dodajEdycjeIKlikanie(layer);
    });
}

// =========================================================================
// 3. FUNKCJE POMOCNICZE (Klikanie i Aneksja)
// =========================================================================
function dodajEdycjeIKlikanie(layer) {
    layer.on('click', (e) => {
        if (map.pm.globalDrawModeEnabled()) return;

        L.DomEvent.stopPropagation(e);
        if (trybMalowania) {
            zastosujFrakcje(layer, aktywnaFrakcja);
            zapiszStan();
            return;
        }
        if (e.originalEvent.shiftKey) {
            layer.setStyle({ color: '#ff0000', fillColor: '#ff0000' });
            wybraneDoAneksji.push(layer);

            if (wybraneDoAneksji.length === 2) {
                wykonajAneksje(wybraneDoAneksji[0], wybraneDoAneksji[1]);
                wybraneDoAneksji = [];
            }
        } else {
            layer.pm.toggleEdit();
        }
    });

    layer.on('contextmenu', (e) => {
        if (map.pm.globalDrawModeEnabled()) return;

        L.DomEvent.stopPropagation(e);

        const props = layer.feature?.properties || {};
        const obecnaNazwa = props.name || props.NAME || props.Name || props.SUBJECTO || "";

        const nowaNazwa = prompt("Podaj nazwę dla tego obiektu:", obecnaNazwa);

        if (nowaNazwa !== null) {
            layer.feature = layer.feature || { type: "Feature", properties: {} };
            layer.feature.properties.name = nowaNazwa;

            if (layer.getTooltip()) {
                layer.setTooltipContent(nowaNazwa);
            } else {
                layer.bindTooltip(nowaNazwa, { permanent: false, sticky: true, className: "moj-tooltip" });
            }
            zapiszStan();
        }
    });
}

function wykonajAneksje(warstwa1, warstwa2) {
    const poly1 = warstwa1.toGeoJSON();
    const poly2 = warstwa2.toGeoJSON();
    const fid = warstwa1.feature?.properties?.frakcja;
    try {
        const polaczonePanstwo = turf.union(turf.featureCollection([poly1, poly2]));

        if (polaczonePanstwo) {
            warstwa1.remove();
            warstwa2.remove();

            const nowaWarstwa = L.geoJSON(polaczonePanstwo).addTo(map);

            nowaWarstwa.getLayers().forEach(nowyKraj => {
                nowyKraj.options.pmIgnore = false;
                L.PM.reInitLayer(nowyKraj);
                dodajEdycjeIKlikanie(nowyKraj);

                const nazwa = prompt("Aneksja zakończona! Podaj nazwę nowego terytorium:");
                nowyKraj.feature = nowyKraj.feature || { type: "Feature", properties: {} };
                if (fid) zastosujFrakcje(nowyKraj, fid);

                if (nazwa) {
                    nowyKraj.feature.properties.name = nazwa;
                    nowyKraj.bindTooltip(nazwa, { permanent: false, sticky: true, className: "moj-tooltip" });
                }
            });
            zapiszStan();
        }
    } catch (error) {
        alert("Nie udało się połączyć tych kształtów.");
        console.error(error);
        [warstwa1, warstwa2].forEach(w => {
            const id = w.feature?.properties?.frakcja;
            id ? zastosujFrakcje(w, id) : w.setStyle({ color: '#3388ff', fillColor: '#3388ff' });
        });
    }
}
const ZDARZENIA_EDYCJI = 'pm:edit pm:markerdrag pm:drag pm:vertexadded pm:vertexremoved';

function stylujStrzalke(layer, kolor = '#e74c3c') {
    layer.feature = layer.feature || { type: "Feature", properties: {} };
    layer.feature.properties.isArrow = true;
    layer.feature.properties.color = kolor;

    layer.setStyle({ color: kolor, weight: 4, dashArray: '10, 10' });

    if (layer._grot) map.removeLayer(layer._grot);
    if (layer._odswiezGrot) layer.off(ZDARZENIA_EDYCJI, layer._odswiezGrot);
    if (layer._usunGrot) layer.off('remove', layer._usunGrot);

    layer._grot = L.polylineDecorator(layer, {
        patterns: [{
            offset: '100%',
            repeat: 0,
            symbol: L.Symbol.arrowHead({
                pixelSize: 18,
                polygon: true,
                pathOptions: { color: kolor, fillColor: kolor, fillOpacity: 1, weight: 2, pmIgnore: true }
            })
        }]
    }).addTo(map);

    layer._odswiezGrot = () => layer._grot && layer._grot.setPaths(layer.getLatLngs());
    layer._usunGrot = () => { if (layer._grot) map.removeLayer(layer._grot); };
    layer.on(ZDARZENIA_EDYCJI, layer._odswiezGrot);
    layer.on('remove', layer._usunGrot);
}
function zastosujFrakcje(layer, id) {
    const f = frakcje[id];
    if (!f) return;
    layer.feature = layer.feature || { type: "Feature", properties: {} };
    layer.feature.properties = layer.feature.properties || {};
    const props = layer.feature.properties;
    props.frakcja = id;

    if (layer instanceof L.Marker) {
        if (props.iconType) zastosujIkone(layer, props.iconType, props.iconUrl); // obwódka w kolorze frakcji
    } else if (props.isArrow && layer instanceof L.Polyline) {
        stylujStrzalke(layer, f.kolor);
    } else if (layer instanceof L.Polygon) {
        layer.setStyle({ color: f.kolor, fillColor: f.kolor, fillOpacity: 0.35, weight: 2 });
    } else if (layer instanceof L.Polyline) {
        layer.setStyle({ color: f.kolor });
    }
}
// =========================================================================
// 4. EVENTY MAPY (Rysowanie, Modale)
// =========================================================================
let oczekujacyMarker = null;

map.on('pm:create', (e) => {
    const layer = e.layer;
    layer.feature = layer.feature || { type: "Feature", properties: {} };

    if (e.shape === 'Marker') {
        layer.feature.properties.frakcja = aktywnaFrakcja; // ikona odczyta to w zastosujIkone
        oczekujacyMarker = layer;
        document.getElementById('icon-modal').style.display = 'flex';

    } else if (e.shape === 'Line') {
        if (trybRysowaniaStrzalki) {
            layer.feature.properties.isArrow = true;
            trybRysowaniaStrzalki = false;
            zastosujFrakcje(layer, aktywnaFrakcja);
        }
        dodajEdycjeIKlikanie(layer);
        zapiszStan();

    } else {
        zastosujFrakcje(layer, aktywnaFrakcja);
        dodajEdycjeIKlikanie(layer);
        zapiszStan();
    }
});

window.wybierzIkone = function (typ) {
    zastosujIkone(oczekujacyMarker, typ, null);
    zamknijModalIDokoncz();
}

window.anulujDodawanie = function () {
    document.getElementById('icon-modal').style.display = 'none';
    if (oczekujacyMarker) {
        map.removeLayer(oczekujacyMarker);
        oczekujacyMarker = null;
    }
}

document.getElementById('custom-icon-upload').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
        zastosujIkone(oczekujacyMarker, 'custom', event.target.result);
        zamknijModalIDokoncz();
        document.getElementById('custom-icon-upload').value = '';
    }
    reader.readAsDataURL(file);
});

function zastosujIkone(layer, typ, url) {
    layer.feature = layer.feature || { type: "Feature", properties: {} };
    layer.feature.properties.iconType = typ;
    if (url) layer.feature.properties.iconUrl = url;

    let icon;
    if (typ === 'custom') {
        icon = L.icon({ iconUrl: url, iconSize: [40, 40], iconAnchor: [20, 20] });
    } else {
        let emoji = '📍';
        if (typ === 'czolg') emoji = '🛡️';
        if (typ === 'piechota') emoji = '🪖';
        if (typ === 'zmech') emoji = '⚙️';
        if (typ === 'kwadrat') emoji = '⬛';
        if (typ === 'kolo') emoji = '🔴';

        const kolor = frakcje[layer.feature.properties.frakcja]?.kolor || '#888';
        icon = L.divIcon({
            html: `<div style="width:38px;height:38px;margin:-19px 0 0 -19px;display:flex;align-items:center;justify-content:center;font-size:22px;background:#fff;border:3px solid ${kolor};border-radius:50%;">${emoji}</div>`,
            className: 'custom-div-icon'
        });
    }
    layer.setIcon(icon);
}

function zamknijModalIDokoncz() {
    document.getElementById('icon-modal').style.display = 'none';
    const nazwa = prompt("Podaj nazwę dla tej jednostki (np. 'Armia Łódź'):");
    if (nazwa) {
        oczekujacyMarker.feature.properties.name = nazwa;
        oczekujacyMarker.bindTooltip(nazwa, { permanent: false, sticky: true, className: "moj-tooltip" });
    }
    dodajEdycjeIKlikanie(oczekujacyMarker);
    zapiszStan();
    oczekujacyMarker = null;
}

map.on('pm:remove', (e) => zapiszStan());
map.on('pm:globaleditmodetoggled', (e) => { if (!e.enabled) zapiszStan(); });

// Kiedy użyjesz narzędzia Nożyczek (Cut), dodaj naszą magię do nowych, pociętych kawałków
map.on('pm:cut', (e) => {
    // Geoman usuwa stary kraj i tworzy nowe warstwy (kawałki)
    e.layer.getLayers().forEach(nowyKawalek => {
        dodajEdycjeIKlikanie(nowyKawalek);
    });
    zapiszStan(); // Zapiszemy to do Ctrl+Z!
});
// --- OBSŁUGA DEDYKOWANEGO GUZIKA STRZAŁKI ---
document.getElementById('draw-arrow-btn').addEventListener('click', () => {
    trybRysowaniaStrzalki = true;
    // Uruchamiamy wbudowane w Geomana rysowanie linii
    map.pm.enableDraw('Line', {
        snappable: false
    });
});
// =========================================================================
// 5. IMPORT I EKSPORT
// =========================================================================
document.getElementById('export-btn').addEventListener('click', () => {
    const layers = map.pm.getGeomanLayers();
    if (layers.length === 0) {
        alert("Najpierw coś narysuj na mapie!");
        return;
    }
    const features = layers.map(layer => layer.toGeoJSON());
    const featureCollection = { type: "FeatureCollection", features: features, frakcje: frakcje };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(featureCollection, null, 2));
    
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `kampania_front_${new Date().getTime()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
});

const importBtn = document.getElementById('import-btn');
const importInput = document.getElementById('import-input');

importBtn.addEventListener('click', () => importInput.click());

importInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const geoJsonData = JSON.parse(e.target.result);
            if (geoJsonData.frakcje) {
                Object.assign(frakcje, geoJsonData.frakcje);
                odswiezListeFrakcji();
            }
            const geoJsonLayer = L.geoJSON(geoJsonData).addTo(map);

            geoJsonLayer.getLayers().forEach(layer => {
                layer.options.pmIgnore = false;
                L.PM.reInitLayer(layer);

                const props = layer.feature?.properties;
                if (props?.isArrow && layer instanceof L.Polyline) {
                    stylujStrzalke(layer, props.color);
                }
                if (props?.frakcja && !(layer instanceof L.Marker)) zastosujFrakcje(layer, props.frakcja);
                if (props) {
                    if (layer instanceof L.Marker && props.iconType) {
                        zastosujIkone(layer, props.iconType, props.iconUrl);
                    }
                    const nazwa = props.name || props.NAME || props.Name || props.SUBJECTO;
                    if (nazwa) {
                        layer.bindTooltip(nazwa, { permanent: false, sticky: true, className: "moj-tooltip" });
                    }
                }
                dodajEdycjeIKlikanie(layer);
            });
            console.log("Pomyślnie zaimportowano plik:", file.name);
            zapiszStan();
        } catch (error) {
            alert("Błąd! To nie jest poprawny plik JSON.");
            console.error(error);
        }
        importInput.value = '';
    };
    reader.readAsText(file);
});

document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (historiaMapy.length > 1) {
            historiaMapy.pop();
            const poprzedniStan = historiaMapy[historiaMapy.length - 1];
            odtworzStan(poprzedniStan);
            console.log("Cofnięto!");
        }
    }
});

document.getElementById('toggle-names-btn').addEventListener('click', () => {
    document.getElementById('map').classList.toggle('ukryj-nazwy');
});
const selectFrakcji = document.getElementById('frakcja-select');
const kolorInput = document.getElementById('frakcja-kolor');
const malujBtn = document.getElementById('maluj-btn');

function odswiezListeFrakcji() {
    selectFrakcji.innerHTML = '';
    for (const [id, f] of Object.entries(frakcje)) {
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = f.nazwa;
        selectFrakcji.appendChild(opt);
    }
    selectFrakcji.value = aktywnaFrakcja;
    kolorInput.value = frakcje[aktywnaFrakcja].kolor;
}
odswiezListeFrakcji();

selectFrakcji.addEventListener('change', () => {
    aktywnaFrakcja = selectFrakcji.value;
    kolorInput.value = frakcje[aktywnaFrakcja].kolor;
});

// zmiana koloru frakcji przemalowuje wszystkie jej obiekty
kolorInput.addEventListener('input', () => {
    frakcje[aktywnaFrakcja].kolor = kolorInput.value;
    map.pm.getGeomanLayers().forEach(l => {
        if (l.feature?.properties?.frakcja === aktywnaFrakcja) zastosujFrakcje(l, aktywnaFrakcja);
    });
});
kolorInput.addEventListener('change', () => zapiszStan());

document.getElementById('dodaj-frakcje-btn').addEventListener('click', () => {
    const nazwa = prompt("Nazwa nowej frakcji:");
    if (!nazwa) return;
    const id = 'f' + Date.now();
    const losowy = '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
    frakcje[id] = { nazwa, kolor: losowy };
    aktywnaFrakcja = id;
    odswiezListeFrakcji();
});

malujBtn.addEventListener('click', () => {
    trybMalowania = !trybMalowania;
    malujBtn.textContent = trybMalowania ? '🎨 Koloruj: WŁ.' : '🎨 Koloruj: wył.';
    malujBtn.style.background = trybMalowania ? '#f1c40f' : '';
    document.getElementById('map').style.cursor = trybMalowania ? 'crosshair' : '';
});