# Notchly

**Dynamic Island for Windows 10 & 11** — a lightweight, customizable floating notch built with Tauri + Rust, featuring media controls, per-app volume scroll, smart notifications with real app icons, quick notes, clipboard history, file shelf, and a standalone interactive Settings studio.

[![Download](https://img.shields.io/github/v/release/AmirAbbas8585/Notchly?label=download&style=flat-square)](https://github.com/AmirAbbas8585/Notchly/releases/latest)
[![License](https://img.shields.io/github/license/AmirAbbas8585/Notchly?style=flat-square)](LICENSE)

---

## Features

- **Media & Per-App Volume**: Live WinRT SMTC playback (`Spotify`, browsers, players), album art, seek bar, and **per-app WASAPI audio session volume** when scrolling on the island in Music mode (adjusts only the playing app without changing Windows master volume).
- **Smart Notifications with Real App Icons**: Captures Windows toast notifications and resolves real application icons (UWP `AppsFolder`, Registry AUMID, Start Menu `.lnk`, and running executables).
- **4 Island Styles & 14 Themes**: Switch between `iPhone`, `Glass`, `Minimal`, and `Neon` styles, plus 14 unified themes and `None (Default)` skin options for both Normal and Music modes.
- **Standalone Frameless Settings Studio**: Interactive live preview notch at the top, live dock preview at the bottom, drag-and-drop toolbar icon ordering, quick presets, and persistent window size.
- **3 Languages**: Full support for **English**, **فارسی (Persian)**, and **Fingilish**.
- **Productivity Tools**: Snipping screenshot, Clipboard history (`Ctrl+Shift+V`), Quick Notes, File Shelf (drag & drop), and Music / Play toggles.

---

## Install

Download `Notchly-Setup.exe` from the [latest release](https://github.com/AmirAbbas8585/Notchly/releases/latest) and run it — one-click silent install into `%LOCALAPPDATA%\Notchly`.

Or build from source (requires Rust + MSVC + Node.js):

```powershell
cd src-tauri
cargo build --release
```

---

## Attribution & License

Notchly is an enhanced fork originally inspired by [raminturne/peeky](https://github.com/raminturne/peeky) (MIT License).
See [LICENSE](LICENSE) for full copyright and MIT license details.
