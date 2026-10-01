import GLib from "gi://GLib";
import Gio from "gi://Gio";

import * as Main from "resource:///org/gnome/shell/ui/main.js";
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";

import Indicator from "./src/indicator.js";
import * as DateHelperFunctions from "./src/date.js";
import { getLanguage } from "./src/i18n.js";

export default class NextUpExtension extends Extension {
  enable() {
    this._settings = this.getSettings();
    const lang = getLanguage(this._settings);

    this._indicator = new Indicator({
      lang,
      confettiGicon: Gio.icon_new_for_string(
        this.path + "/assets/party-popper.png"
      ),
      openPrefsCallback: this.openPreferences.bind(this),
    });

    if (this._indicator._calendarSource) {
      this._calendarChangedId = this._indicator._calendarSource.connect(
        "changed",
        () => {
          this.refreshIndicator();
        }
      );
    }

    this._panelChangedSignal = this._settings.connect(
      "changed::which-panel",
      () => {
        this.loadIndicator();
      }
    );

    this._langChangedSignal = this._settings.connect(
      "changed::language",
      () => {
        const newLang = getLanguage(this._settings);
        if (this._indicator) {
          this._indicator.setLanguage(newLang);
        }
        this.refreshIndicator();
      }
    );

    // Wait 3 seconds before loading the indicator
    // So that it isn't loaded too early and positioned after other elements in the panel
    this.delaySourceId = GLib.timeout_add_seconds(
      GLib.PRIORITY_DEFAULT,
      3,
      () => {
        this.loadIndicator();
        this.refreshIndicator();
        this._startLoop();

        this.delaySourceId = null;
        return GLib.SOURCE_REMOVE;
      }
    );
  }

  _startLoop() {
    this.sourceId = GLib.timeout_add_seconds(
      GLib.PRIORITY_DEFAULT,
      5, // seconds to wait
      () => {
        this.refreshIndicator();

        return GLib.SOURCE_CONTINUE;
      }
    );
  }

  loadIndicator() {
    if (!this._indicator?.container) {
      return;
    }

    this.unloadIndicator();

    const boxes = [
      Main.panel._leftBox,
      Main.panel._centerBox,
      Main.panel._rightBox,
    ];

    const whichPanel = this._settings ? this._settings.get_int("which-panel") : 1;
    const panelIdx = whichPanel >= 0 && whichPanel < boxes.length ? whichPanel : 1;

    // If aligned to left, place it after workspaces indicator
    const index = panelIdx === 0 ? 1 : 0;

    boxes[panelIdx].insert_child_at_index(this._indicator.container, index);
  }

  unloadIndicator() {
    if (!this._indicator?.container) {
      return;
    }

    const parent = this._indicator.container.get_parent();
    if (parent) {
      parent.remove_child(this._indicator.container);
    }
  }

  refreshIndicator() {
    if (!this._indicator) {
      return;
    }

    const lang = getLanguage(this._settings);
    const todaysEvents = DateHelperFunctions.getTodaysEvents(
      this._indicator._calendarSource
    );
    const eventStatus =
      DateHelperFunctions.getNextEventsToDisplay(todaysEvents);
    const text = DateHelperFunctions.eventStatusToIndicatorText(eventStatus, lang);

    if (eventStatus.currentEvent === null && eventStatus.nextEvent === null) {
      this._indicator.showConfettiIcon();
    } else {
      this._indicator.showAlarmIcon();
    }

    this._indicator.setText(text);
  }

  disable() {
    if (this.delaySourceId) {
      GLib.Source.remove(this.delaySourceId);
      this.delaySourceId = null;
    }

    if (this.sourceId) {
      GLib.Source.remove(this.sourceId);
      this.sourceId = null;
    }

    if (this._panelChangedSignal && this._settings) {
      this._settings.disconnect(this._panelChangedSignal);
      this._panelChangedSignal = null;
    }

    if (this._langChangedSignal && this._settings) {
      this._settings.disconnect(this._langChangedSignal);
      this._langChangedSignal = null;
    }
    this._settings = null;

    if (this._calendarChangedId && this._indicator?._calendarSource) {
      this._indicator._calendarSource.disconnect(this._calendarChangedId);
      this._calendarChangedId = null;
    }

    this.unloadIndicator();

    if (this._indicator) {
      this._indicator.destroy();
      this._indicator = null;
    }
  }
}
