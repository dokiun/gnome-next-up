"use strict";

import Adw from "gi://Adw";
import Gtk from "gi://Gtk";

import {
  ExtensionPreferences,
} from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

import { t, resolveLanguage } from "./src/i18n.js";

export default class NextUpExtensionPreferences extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    const settings = this.getSettings();

    let currentLangCode = settings.get_string("language") || "es";
    let activeLang = resolveLanguage(currentLangCode);

    const page = new Adw.PreferencesPage();
    const group = new Adw.PreferencesGroup();
    page.add(group);

    // --- Fila de posición del panel ---
    const getPanelNames = (lang) => [
      t("panelLeft", lang),
      t("panelCenter", lang),
      t("panelRight", lang),
    ];

    const panelRow = new Adw.ActionRow({
      title: t("panelRowTitle", activeLang),
      subtitle: t("panelRowSubtitle", activeLang),
    });
    group.add(panelRow);

    const panelDropdown = new Gtk.DropDown({
      model: Gtk.StringList.new(getPanelNames(activeLang)),
      valign: Gtk.Align.CENTER,
    });

    const currentPanel = settings.get_int("which-panel");
    panelDropdown.selected = currentPanel >= 0 && currentPanel <= 2 ? currentPanel : 1;
    panelDropdown.connect("notify::selected", () => {
      settings.set_int("which-panel", panelDropdown.selected);
    });

    panelRow.add_suffix(panelDropdown);
    panelRow.activatable_widget = panelDropdown;

    // --- Fila de selección de idioma ---
    const langCodes = ["es", "en", "system"];
    const getLangNames = (lang) => [
      t("langSpanish", lang),
      t("langEnglish", lang),
      t("langSystem", lang),
    ];

    const langRow = new Adw.ActionRow({
      title: t("languageRowTitle", activeLang),
      subtitle: t("languageRowSubtitle", activeLang),
    });
    group.add(langRow);

    const langDropdown = new Gtk.DropDown({
      model: Gtk.StringList.new(getLangNames(activeLang)),
      valign: Gtk.Align.CENTER,
    });

    let currentLangIdx = langCodes.indexOf(currentLangCode);
    if (currentLangIdx === -1) {
      currentLangIdx = 0;
    }
    langDropdown.selected = currentLangIdx;

    const updateTexts = (newLangCode) => {
      const resolved = resolveLanguage(newLangCode);
      panelRow.title = t("panelRowTitle", resolved);
      panelRow.subtitle = t("panelRowSubtitle", resolved);

      langRow.title = t("languageRowTitle", resolved);
      langRow.subtitle = t("languageRowSubtitle", resolved);

      const savedPanel = panelDropdown.selected;
      panelDropdown.model = Gtk.StringList.new(getPanelNames(resolved));
      panelDropdown.selected = savedPanel;

      const savedLang = langDropdown.selected;
      langDropdown.model = Gtk.StringList.new(getLangNames(resolved));
      langDropdown.selected = savedLang;
    };

    langDropdown.connect("notify::selected", () => {
      const chosenCode = langCodes[langDropdown.selected] ?? "es";
      if (settings.get_string("language") !== chosenCode) {
        settings.set_string("language", chosenCode);
        updateTexts(chosenCode);
      }
    });

    langRow.add_suffix(langDropdown);
    langRow.activatable_widget = langDropdown;

    window.add(page);
  }
}
