# Window Status Card

A clean, standalone, single-row Lovelace card for Home Assistant designed to monitor window and binary sensor states with zero external dependencies, helper entities, or HACS requirements. It calculates state durations entirely on its own and features built-in animations and custom icon support.

The card provides a rich set of visual indicators in a compact design:
- **Autonomous Duration Tracking:** Automatically calculates how long the window has been open or closed since the last state change.
- **Dynamic Color & Pill Styling:** Dynamically updates the pill background, inner shadow, text color, and icon glow depending on whether the window is open or closed.
- **State-Based Animations:** Smooth 3D rotating animation when the window is open to immediately draw attention.
- **Customizable UI Icons:** Fully configurable custom open and closed icons directly through the visual dashboard editor or YAML.

---

## Screenshots

<div align="center">
  <img src="screenshots/window-open-example.png" width="45%" alt="Window Open State" />
  <img src="screenshots/window-closed-example.png" width="45%" alt="Window Closed State" />
</div>

---

## Features & Behavior

1. **`binary_sensor` Integration:** Designed specifically for binary sensors with device classes like `window`, `door`, or general binary sensors.
2. **Dynamic States:** 
   * **Open (`on`):** Highlighted with an orange accent (`#FF9F0A`), active 3D opening animation, custom open icon, and open duration counter.
   * **Closed (`off`):** Styled with a muted gray accent (`#8E8E93`), static view, custom closed icon, and closed duration counter.

---

## Installation

### Manual Installation
1. Copy `window-status-card.js` into your `config/www/` folder.
2. In Home Assistant, go to **Settings** → **Dashboards** → **Three dots (top right)** → **Resources**.
3. Add a new resource with URL `/local/window-status-card.js` and type **JavaScript Module**.

### HACS (Custom Repository)
1. Open **HACS** → **Dashboards** → **Three-dot menu (top right)** → **Custom repositories**.
2. Paste this repository URL, set the type to **Dashboard**, and click **Add**.
3. Install **Window Status Card** and refresh your browser.

---

## Usage Examples

### Minimal Configuration
```yaml
type: custom:window-status-card
entity: binary_sensor.living_room_window
```

### Full Custom Configuration with Custom Icons and Tap Action
```yaml
type: custom:window-status-card
entity: binary_sensor.living_room_window
name: Living Room Window
open_icon: mdi:window-open
closed_icon: mdi:window-closed
tap_action:
  action: more-info
```

## Configuration Options

All features can be configured visually in the dashboard editor or via YAML:

| Option | Default | Description |
|---|---|---|
| `entity` | **Required** | Binary sensor entity ID to display. |
| `name` | Friendly name | Card title. Falls back to entity friendly name. |
| `open_icon` | `mdi:window-open` | Icon displayed when the binary sensor state is `on` (open). |
| `closed_icon` | `mdi:window-closed` | Icon displayed when the binary sensor state is `off` (closed). |
| `tap_action` | `more-info` | Tap action (`navigate`, `more-info`, `toggle`, `perform-action`, `url`, `none`). |
