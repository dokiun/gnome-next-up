import GLib from "gi://GLib";

export const translations = {
  es: {
    loading: "Cargando…",
    settings: "Configuración",
    doneForToday: "¡Listo por hoy!",
    indicatorTitle: "Indicador Next Up",
    panelRowTitle: "Panel donde mostrar el indicador",
    panelRowSubtitle: "Elige la posición del indicador en la barra superior",
    panelLeft: "Izquierda",
    panelCenter: "Centro",
    panelRight: "Derecha",
    languageRowTitle: "Idioma",
    languageRowSubtitle: "Selecciona el idioma de la extensión",
    langSpanish: "Español",
    langEnglish: "English",
    langSystem: "Predeterminado del sistema",
    hrShort: "h",
    minShort: "min",
    atTime: "a las",
    inTime: "En",
    endsIn: "Termina en",
    nextEvent: "Siguiente",
  },
  en: {
    loading: "Loading…",
    settings: "Settings",
    doneForToday: "Done for today!",
    indicatorTitle: "Next Up Indicator",
    panelRowTitle: "Panel to show indicator in",
    panelRowSubtitle: "Choose the indicator position in the top panel",
    panelLeft: "Left",
    panelCenter: "Center",
    panelRight: "Right",
    languageRowTitle: "Language",
    languageRowSubtitle: "Select the language for the extension",
    langSpanish: "Español",
    langEnglish: "English",
    langSystem: "System Default",
    hrShort: "hr",
    minShort: "min",
    atTime: "at",
    inTime: "In",
    endsIn: "Ends in",
    nextEvent: "Next",
  },
};

export function resolveLanguage(pref) {
  if (pref === "es" || pref === "en") {
    return pref;
  }

  // System locale detection
  const langs = GLib.get_language_names();
  for (const l of langs) {
    if (l.toLowerCase().startsWith("es")) {
      return "es";
    }
    if (l.toLowerCase().startsWith("en")) {
      return "en";
    }
  }

  return "es";
}

export function getLanguage(settings) {
  const pref = settings ? settings.get_string("language") : "es";
  return resolveLanguage(pref);
}

export function t(key, lang = "es") {
  const dict = translations[lang] || translations.es;
  return dict[key] ?? translations.en[key] ?? key;
}
