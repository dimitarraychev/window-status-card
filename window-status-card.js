/*!
 * Window Status Card
 * A custom Home Assistant card showing window state, duration, and animated indicators.
 */

const CARD_TAG = "window-status-card";
const EDITOR_TAG = "window-status-card-editor";
const CARD_NAME = "Window Status Card";
const CARD_VERSION = "0.1.2-beta";

const UNAVAILABLE = ["unknown", "unavailable", "", undefined, null];

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

class WindowStatusCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        .card {
          position: relative;
          box-sizing: border-box;
          height: 56px;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .pill {
          position: relative;
          box-sizing: border-box;
          height: 100%;
          display: flex;
          align-items: center;
          border-radius: 32px;
          background: color-mix(in srgb, var(--wsc-color) 10%, transparent);
          box-shadow: inset 0 0 10px color-mix(in srgb, var(--wsc-color) 45%, transparent);
          overflow: hidden;
        }
        .card:focus-visible { outline: none; }
        .card:focus-visible .pill { outline: 2px solid var(--wsc-color); outline-offset: 2px; }
        .icon-container {
          flex: none;
          width: 42px;
          height: 42px;
          margin: 8px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--wsc-color);
          background: color-mix(in srgb, var(--wsc-color) 20%, transparent);
          --mdc-icon-size: 24px;
        }
        .main-icon {
          animation: var(--wsc-animation, none);
        }
        .text {
          flex: 1;
          min-width: 0;
          align-self: center;
          margin-top: 0;
          line-height: 1.2;
          margin-left: 2px;
        }
        .name {
          font-size: 14px;
          font-weight: 600;
          color: var(--primary-text-color);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .status {
          font-size: 12px;
          color: var(--primary-text-color);
          opacity: 0.7;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .end {
          flex: none;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 16px 0 8px;
        }
        .duration {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 1rem;
          font-weight: 600;
          color: var(--wsc-color);
          white-space: nowrap;
        }
        .duration ha-icon {
          --mdc-icon-size: 20px;
        }
        @keyframes ultra-window-on {
          0%   { transform: perspective(200px) rotateY(0deg) scale(1); }
          25%  { transform: perspective(200px) rotateY(-8deg) scale(1.05) translateY(-1px); }
          50%  { transform: perspective(200px) rotateY(-14deg) scale(1.08) translateY(-2px); }
          75%  { transform: perspective(200px) rotateY(-8deg) scale(1.04) translateY(-1px); }
          100% { transform: perspective(200px) rotateY(0deg) scale(1); }
        }
      </style>
      <div class="card" tabindex="0" role="button">
        <div class="pill">
          <div class="icon-container">
            <div class="main-icon"></div>
          </div>
          <div class="text"></div>
          <div class="end">
            <div class="duration"></div>
          </div>
        </div>
      </div>`;

    const $ = (s) => this.shadowRoot.querySelector(s);
    this._card = $(".card");
    this._iconContainer = $(".icon-container");
    this._mainIcon = $(".main-icon");
    this._text = $(".text");
    this._duration = $(".duration");

    this._card.addEventListener("click", () => this._onTap());
    this._card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this._onTap();
      }
    });
  }

  // ---------- Lovelace API ----------
  static getConfigElement() {
    return document.createElement(EDITOR_TAG);
  }

  static getStubConfig(hass) {
    const first = Object.keys(hass?.states || {}).find(
      (id) => id.startsWith("binary_sensor.") && hass.states[id].attributes?.device_class === "window"
    );
    return { entity: first || "binary_sensor.window", name: "Window" };
  }

  setConfig(config) {
    if (!config || !config.entity) throw new Error("Set `entity` to a binary sensor.");
    this._config = { tap_action: { action: "more-info" }, ...config };
    this._key = null;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    return 1;
  }

  getGridOptions() {
    return { columns: 12, rows: 1, min_columns: 6, min_rows: 1 };
  }

  // ---------- Model & Calculation ----------
  _compute() {
    const cfg = this._config;
    const hass = this._hass;
    const stateObj = hass?.states[cfg.entity];

    const isOpen = stateObj ? stateObj.state === "on" : false;
    const color = isOpen ? "#FF9F0A" : "#8E8E93";
    const animation = isOpen ? "ultra-window-on 1.8s ease-in-out infinite" : "none";

    let minutes = 0;
    if (stateObj && stateObj.last_changed) {
      const lastChanged = new Date(stateObj.last_changed).getTime();
      const now = Date.now();
      minutes = Math.max(0, Math.floor((now - lastChanged) / 60000));
    }

    let durationText = "";
    if (minutes >= 1440) {
      durationText = `${Math.floor(minutes / 1440)}d ${Math.floor((minutes % 1440) / 60)}h`;
    } else if (minutes >= 60) {
      durationText = `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    } else {
      durationText = `${minutes % 60}m`;
    }

    const defaultOpenIcon = "mdi:window-open";
    const defaultClosedIcon = "mdi:window-closed";
    const icon = isOpen ? (cfg.open_icon || defaultOpenIcon) : (cfg.closed_icon || defaultClosedIcon);

    return {
      name: cfg.name ?? stateObj?.attributes?.friendly_name ?? cfg.entity,
      status: isOpen ? "Open" : "Closed",
      isOpen,
      color,
      animation,
      durationText,
      icon,
    };
  }

  // ---------- Rendering ----------
  _render() {
    if (!this._config || !this._hass) return;
    const m = this._compute();
    const key = JSON.stringify(m);
    if (key === this._key) return;
    this._key = key;

    this._card.style.setProperty("--wsc-color", m.color);
    this._card.style.setProperty("--wsc-animation", m.animation);
    this._mainIcon.innerHTML = `<ha-icon icon="${esc(m.icon)}"></ha-icon>`;
    this._text.innerHTML = `<div class="name">${esc(m.name)}</div><div class="status">${esc(m.status)}</div>`;
    this._duration.innerHTML = `<ha-icon icon="mdi:progress-clock"></ha-icon>${esc(m.durationText)}`;
    this._card.setAttribute("aria-label", `${m.name}, ${m.status}, open for ${m.durationText}`);
  }

  // ---------- Actions ----------
  _fire(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
  }

  _onTap() {
    const a = this._config.tap_action || { action: "more-info" };
    const hass = this._hass;
    const entityId = a.entity || this._config.entity;
    switch (a.action) {
      case "navigate":
        if (!a.navigation_path) return;
        if (a.navigation_replace) history.replaceState(null, "", a.navigation_path);
        else history.pushState(null, "", a.navigation_path);
        window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: !!a.navigation_replace } }));
        break;
      case "more-info":
        this._fire("hass-more-info", { entityId });
        break;
      case "toggle":
        hass.callService("homeassistant", "toggle", { entity_id: entityId });
        break;
      case "perform-action":
      case "call-service": {
        const svc = a.perform_action || a.service;
        if (!svc) return;
        const [domain, service] = svc.split(".");
        hass.callService(domain, service, a.data || a.service_data || {}, a.target);
        break;
      }
      case "url":
        if (a.url_path) window.open(a.url_path, "_blank");
        break;
      default:
        break;
    }
  }
}

// ---------- Visual Editor ----------
const EDITOR_LABELS = {
  entity: "Window Entity",
  name: "Name",
  open_icon: "Open Icon",
  closed_icon: "Closed Icon",
  tap_action: "Tap Action",
};

const EDITOR_SCHEMA = [
  { name: "entity", required: true, selector: { entity: { domain: "binary_sensor" } } },
  { name: "name", selector: { text: {} } },
  { name: "open_icon", selector: { icon: {} } },
  { name: "closed_icon", selector: { icon: {} } },
  { name: "tap_action", selector: { ui_action: {} } },
];

const prune = (obj) => {
  if (Array.isArray(obj)) return obj;
  if (obj && typeof obj === "object") {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      const p = prune(v);
      const empty =
        p === undefined ||
        p === null ||
        p === "" ||
        (Array.isArray(p) && p.length === 0) ||
        (typeof p === "object" && !Array.isArray(p) && Object.keys(p).length === 0);
      if (!empty) out[k] = p;
    }
    return out;
  }
  return obj;
};

class WindowStatusCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
    this._update();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._form) this._form.hass = hass;
    this._update();
  }

  _update() {
    if (!this._config || !this._hass) return;
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) => EDITOR_LABELS[s.name] || s.name;
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        const config = prune({ ...this._config, ...ev.detail.value });
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    this._form.hass = this._hass;
    this._form.schema = EDITOR_SCHEMA;
    this._form.data = this._config;
  }
}

customElements.define(CARD_TAG, WindowStatusCard);
customElements.define(EDITOR_TAG, WindowStatusCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: CARD_TAG,
  name: CARD_NAME,
  description: "A custom window row card with built-in duration tracking, animations, and custom icons.",
  preview: true,
});

console.info(`%c WINDOW-STATUS-CARD %c v${CARD_VERSION} `, "color:white;background:#FF9F0A;font-weight:700", "color:#FF9F0A;background:white");
