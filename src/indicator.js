import GObject from "gi://GObject";
import St from "gi://St";
import Clutter from "gi://Clutter";
import * as Calendar from "resource:///org/gnome/shell/ui/calendar.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import { t } from "./i18n.js";

export default GObject.registerClass(
class Indicator extends PanelMenu.Button {
  _init(props = {}) {
    this._lang = props.lang || "es";
    super._init(0.0, t("indicatorTitle", this._lang));

    this._confettiGicon = props.confettiGicon;
    this._openPrefsCallback = props.openPrefsCallback;

    this._calendarSource = new Calendar.DBusEventSource();

    this._loadGUI();
    this._initialiseMenu();
    this._setupGestures();
  }

  setLanguage(lang) {
    this._lang = lang;
    if (this._settingsItem?.label) {
      this._settingsItem.label.set_text(t("settings", lang));
    }
    this.accessible_name = t("indicatorTitle", lang);
  }

  _loadGUI() {
    this._menuLayout = new St.BoxLayout({
      vertical: false,
      clip_to_allocation: true,
      x_align: Clutter.ActorAlign.START,
      y_align: Clutter.ActorAlign.CENTER,
      reactive: true,
      x_expand: true,
    });

    this._alarmIcon = new St.Icon({
      icon_name: "alarm-symbolic",
      style_class: "system-status-icon",
    });

    this.icon = this._alarmIcon;

    this.text = new St.Label({
      text: t("loading", this._lang),
      y_expand: true,
      y_align: Clutter.ActorAlign.CENTER,
    });

    this._menuLayout.add_child(this.icon);
    this._menuLayout.add_child(this.text);
    this.add_child(this._menuLayout);
  }

  _initialiseMenu() {
    this._settingsItem = new PopupMenu.PopupMenuItem(t("settings", this._lang));
    this._settingsItem.connect("activate", () => {
      if (this._openPrefsCallback) {
        this._openPrefsCallback();
      }
    });
    this.menu.addMenuItem(this._settingsItem);
  }

  _setupGestures() {
    if (this._clickGesture) {
      // In GNOME 50, PanelMenu.Button uses Clutter.ClickGesture to open menu.
      // Re-target the default gesture to right click (secondary button) for settings:
      this._clickGesture.required_button = Clutter.BUTTON_SECONDARY;

      // Add a primary button gesture to toggle calendar on left click:
      this._primaryClickGesture = new Clutter.ClickGesture({
        required_button: Clutter.BUTTON_PRIMARY,
        recognize_on_press: true,
      });
      this._primaryClickGesture.connect("recognize", () => {
        if (this.menu?.isOpen) {
          this.menu.close();
        } else {
          Main.panel.toggleCalendar();
        }
      });
      this.add_action(this._primaryClickGesture);
    }
  }

  setText(text) {
    this.text.set_text(text);
  }

  showAlarmIcon() {
    this.icon.set_icon_name("alarm-symbolic");
  }

  showConfettiIcon() {
    this.icon.set_gicon(this._confettiGicon);
  }

  vfunc_event(event) {
    // If ClickGesture is present (GNOME 48+), gestures handle click events
    if (this._clickGesture) {
      return Clutter.EVENT_PROPAGATE;
    }

    if (
      event.type() === Clutter.EventType.TOUCH_END ||
      event.type() === Clutter.EventType.BUTTON_RELEASE
    ) {
      if (event.get_button() === Clutter.BUTTON_PRIMARY) {
        // Show calendar on left click
        if (this.menu?.isOpen) {
          this.menu.close();
        } else {
          Main.panel.toggleCalendar();
        }
      } else {
        // Show settings menu on right click
        this.menu?.toggle();
      }
    }

    return Clutter.EVENT_PROPAGATE;
  }

  destroy() {
    if (this._calendarSource) {
      if (typeof this._calendarSource.destroy === "function") {
        this._calendarSource.destroy();
      }
      this._calendarSource = null;
    }

    super.destroy();
  }
});
