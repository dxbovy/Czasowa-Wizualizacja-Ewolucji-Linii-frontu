// supabaseClient.js
const SUPABASE_URL = 'https://pdshnuybcijmotizpgxy.supabase.co'; // wklej skopiowany URL
const SUPABASE_KEY = 'sb_publishable_Q8cmNNSUVGzlSoev2GK-Gg_CiKxQkth';             // wklej skopiowany klucz publiczny

// Inicjalizacja klienta Supabase w przeglądarce
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
