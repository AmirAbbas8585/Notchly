// Small Win32 helpers shared by the whole backend.
use std::ffi::c_void;
use std::io::Write;
use std::path::PathBuf;
use std::sync::atomic::{AtomicIsize, Ordering};
use std::sync::OnceLock;
use std::time::{SystemTime, UNIX_EPOCH};

use base64::Engine;
use serde_json::Value;
use tauri::{AppHandle, Emitter};
use windows::core::{HSTRING, PWSTR};
use windows::Win32::Foundation::*;
use windows::Win32::Graphics::Gdi::*;
use windows::Win32::Storage::FileSystem::FILE_FLAGS_AND_ATTRIBUTES;
use windows::Win32::System::Com::{CoInitializeEx, CoTaskMemFree, COINIT_APARTMENTTHREADED};
use windows::Win32::System::SystemInformation::GetLocalTime;
use windows::Win32::System::Threading::*;
use windows::Win32::UI::Input::KeyboardAndMouse::{SendInput, INPUT};
use windows::Win32::UI::Shell::*;
use windows::Win32::UI::WindowsAndMessaging::*;

pub const APP_NAME: &str = "Notchly";
pub const OLD_NAME: &str = "Notchly";

pub static APP: OnceLock<AppHandle> = OnceLock::new();
pub static DEBUG_DIR: OnceLock<Option<PathBuf>> = OnceLock::new();
static HWND_MAIN: AtomicIsize = AtomicIsize::new(0);

pub fn set_hwnd(h: HWND) {
    HWND_MAIN.store(h.0 as isize, Ordering::SeqCst)
}
pub fn hwnd() -> HWND {
    HWND(HWND_MAIN.load(Ordering::SeqCst) as *mut c_void)
}
pub fn debug_dir() -> Option<&'static PathBuf> {
    DEBUG_DIR.get().and_then(|d| d.as_ref())
}

pub fn emit<S: serde::Serialize + Clone>(event: &str, payload: S) {
    if let Some(a) = APP.get() {
        let _ = a.emit(event, payload);
    }
}
/// Messages on the "helper" channel keep the shape the page already understands: { t: "...", ... }.
pub fn helper(v: Value) {
    emit("helper", v)
}

pub fn now_ms() -> u64 {
    SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_millis() as u64).unwrap_or(0)
}
pub fn b64(bytes: &[u8]) -> String {
    base64::engine::general_purpose::STANDARD.encode(bytes)
}
pub fn unb64(text: &str) -> Option<Vec<u8>> {
    base64::engine::general_purpose::STANDARD.decode(text.trim()).ok()
}
pub fn from_wide(buf: &[u16]) -> String {
    let n = buf.iter().position(|&c| c == 0).unwrap_or(buf.len());
    String::from_utf16_lossy(&buf[..n])
}
/// Takes ownership of a CoTaskMem string.
pub unsafe fn pwstr_take(p: PWSTR) -> String {
    if p.is_null() {
        return String::new();
    }
    let s = p.to_string().unwrap_or_default();
    CoTaskMemFree(Some(p.0 as *const c_void));
    s
}
pub fn com_init() {
    thread_local! { static DONE: std::cell::Cell<bool> = const { std::cell::Cell::new(false) }; }
    DONE.with(|d| {
        if !d.get() {
            d.set(true);
            unsafe {
                let _ = CoInitializeEx(None, COINIT_APARTMENTTHREADED);
            }
        }
    });
}

// ---------------------------------------------------------------- files
/// Settings, pins, notes and the vault live here (the same folder the Electron version used).
pub fn data_dir() -> PathBuf {
    let dir = match debug_dir() {
        Some(d) => d.join("userdata"),
        None => {
            let base = PathBuf::from(std::env::var_os("APPDATA").unwrap_or_default());
            let dir = base.join(APP_NAME);
            let old = base.join(OLD_NAME);
            if !dir.exists() && old.exists() {
                let _ = std::fs::rename(&old, &dir); // settings, pins, notes and passwords move with the new name
            }
            // The new folder may already have been there (then nothing was renamed): bring over, once, whatever it lacks.
            static CARRY: std::sync::Once = std::sync::Once::new();
            CARRY.call_once(|| {
                if old.exists() {
                    let _ = std::fs::create_dir_all(&dir);
                    for name in ["notes.json", "vault.bin", "clips.json", "settings.json"] {
                        if !dir.join(name).exists() && old.join(name).exists() {
                            let _ = std::fs::copy(old.join(name), dir.join(name));
                        }
                    }
                }
            });
            dir
        }
    };
    let _ = std::fs::create_dir_all(&dir);
    dir
}
pub fn temp_dir() -> PathBuf {
    std::env::temp_dir().join("NotchlyShelf")
}

/// A small rolling log: only unusual things are written (a click that never arrived, a window sitting on top…).
pub fn log(msg: &str) {
    let dir = data_dir();
    let p = dir.join("island.log");
    if std::fs::metadata(&p).map(|m| m.len() > 256 * 1024).unwrap_or(false) {
        let _ = std::fs::rename(&p, dir.join("island.old.log"));
    }
    let t = unsafe { GetLocalTime() };
    let line = format!("{:04}-{:02}-{:02} {:02}:{:02}:{:02} {}", t.wYear, t.wMonth, t.wDay, t.wHour, t.wMinute, t.wSecond, msg);
    if let Ok(mut f) = std::fs::OpenOptions::new().create(true).append(true).open(&p) {
        let _ = writeln!(f, "{line}");
    }
    if let Some(d) = debug_dir() {
        if let Ok(mut f) = std::fs::OpenOptions::new().create(true).append(true).open(d.join("out.log")) {
            let _ = writeln!(f, "[log] {line}");
        }
    }
}

// ---------------------------------------------------------------- windows
pub fn class_of(h: HWND) -> String {
    let mut b = [0u16; 128];
    let n = unsafe { GetClassNameW(h, &mut b) }.max(0) as usize;
    String::from_utf16_lossy(&b[..n.min(b.len())])
}
pub fn title_of(h: HWND) -> String {
    let mut b = [0u16; 300];
    let n = unsafe { GetWindowTextW(h, &mut b) }.max(0) as usize;
    String::from_utf16_lossy(&b[..n.min(b.len())])
}
pub fn pid_of(h: HWND) -> u32 {
    let mut p = 0u32;
    unsafe { GetWindowThreadProcessId(h, Some(&mut p)) };
    p
}
pub fn root_of(h: HWND) -> HWND {
    let r = unsafe { GetAncestor(h, GA_ROOT) };
    if r.0.is_null() { h } else { r }
}
pub fn exe_of_pid(pid: u32) -> Option<String> {
    unsafe {
        let h = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid).ok()?;
        let mut buf = [0u16; 520];
        let mut n = buf.len() as u32;
        let ok = QueryFullProcessImageNameW(h, PROCESS_NAME_FORMAT(0), PWSTR(buf.as_mut_ptr()), &mut n).is_ok();
        let _ = CloseHandle(h);
        if ok { Some(String::from_utf16_lossy(&buf[..n as usize])) } else { None }
    }
}
pub fn rect_of(h: HWND) -> RECT {
    let mut r = RECT::default();
    unsafe {
        let _ = GetWindowRect(h, &mut r);
    }
    r
}

/// An empty (no-movement) input event gives this process the right to hand the foreground to someone else.
pub fn allow_foreground() {
    unsafe {
        let inputs = [INPUT::default()];
        SendInput(&inputs, std::mem::size_of::<INPUT>() as i32);
        let _ = AllowSetForegroundWindow(u32::MAX);
    }
}
pub fn force_foreground(h: HWND) {
    unsafe {
        let inputs = [INPUT::default()];
        SendInput(&inputs, std::mem::size_of::<INPUT>() as i32);
        let _ = SetForegroundWindow(h);
        let fg = GetForegroundWindow();
        if fg != h && !fg.0.is_null() {
            let other = GetWindowThreadProcessId(fg, None);
            let me = GetCurrentThreadId();
            let _ = AttachThreadInput(me, other, true);
            let _ = SetForegroundWindow(h);
            let _ = BringWindowToTop(h);
            let _ = AttachThreadInput(me, other, false);
        }
    }
}

pub fn shell_open(file: &str, args: Option<&str>) {
    unsafe {
        let args = args.map(HSTRING::from);
        let a = args.as_ref().map(|s| windows::core::PCWSTR(s.as_ptr())).unwrap_or(windows::core::PCWSTR::null());
        ShellExecuteW(None, windows::core::w!("open"), &HSTRING::from(file), a, windows::core::PCWSTR::null(), SW_SHOWNORMAL);
    }
}
pub fn reveal_in_folder(path: &str) {
    shell_open("explorer.exe", Some(&format!("/select,\"{path}\"")));
}

// ---------------------------------------------------------------- pictures
pub fn encode_png(rgba: &[u8], w: u32, h: u32) -> Option<Vec<u8>> {
    use image::ImageEncoder;
    let mut out = Vec::new();
    image::codecs::png::PngEncoder::new(&mut out).write_image(rgba, w, h, image::ExtendedColorType::Rgba8).ok()?;
    Some(out)
}

/// Draws an icon into a 32-bit bitmap and returns it as straight-alpha RGBA.
pub fn hicon_rgba(icon: HICON, size: i32) -> Option<Vec<u8>> {
    unsafe {
        let dc = CreateCompatibleDC(None);
        let mut bi = BITMAPINFO::default();
        bi.bmiHeader = BITMAPINFOHEADER {
            biSize: std::mem::size_of::<BITMAPINFOHEADER>() as u32,
            biWidth: size,
            biHeight: -size,
            biPlanes: 1,
            biBitCount: 32,
            biCompression: BI_RGB.0,
            ..Default::default()
        };
        let mut bits: *mut c_void = std::ptr::null_mut();
        let Ok(bmp) = CreateDIBSection(Some(dc), &bi, DIB_RGB_COLORS, &mut bits, None, 0) else {
            let _ = DeleteDC(dc);
            return None;
        };
        let old = SelectObject(dc, HGDIOBJ(bmp.0));
        let ok = DrawIconEx(dc, 0, 0, icon, size, size, 0, None, DI_NORMAL).is_ok();
        let px = std::slice::from_raw_parts(bits as *const u8, (size * size * 4) as usize).to_vec();
        SelectObject(dc, old);
        let _ = DeleteObject(HGDIOBJ(bmp.0));
        let _ = DeleteDC(dc);
        if !ok {
            return None;
        }
        let any_alpha = px.chunks(4).any(|p| p[3] != 0);
        let mut out = Vec::with_capacity(px.len());
        for p in px.chunks(4) {
            let a = if any_alpha { p[3] } else if p[0] | p[1] | p[2] != 0 { 255 } else { 0 };
            let un = |c: u8| if a == 0 { 0 } else { ((c as u32 * 255) / a as u32).min(255) as u8 };
            out.extend_from_slice(&[un(p[2]), un(p[1]), un(p[0]), a]);
        }
        Some(out)
    }
}

/// The icon Explorer shows for a file (or for a program), as a base64 PNG.
pub fn file_icon_b64(path: &str) -> Option<String> {
    com_init();
    unsafe {
        let mut info = SHFILEINFOW::default();
        let r = SHGetFileInfoW(&HSTRING::from(path), FILE_FLAGS_AND_ATTRIBUTES(0), Some(&mut info), std::mem::size_of::<SHFILEINFOW>() as u32, SHGFI_ICON | SHGFI_LARGEICON);
        if r == 0 || info.hIcon.is_invalid() {
            return None;
        }
        let rgba = hicon_rgba(info.hIcon, 32);
        let _ = DestroyIcon(info.hIcon);
        rgba.and_then(|px| encode_png(&px, 32, 32)).map(|png| b64(&png))
    }
}

fn hbitmap_png_b64(bmp: HBITMAP) -> Option<String> {
    unsafe {
        let mut bm = BITMAP::default();
        if GetObjectW(HGDIOBJ(bmp.0), std::mem::size_of::<BITMAP>() as i32, Some(&mut bm as *mut _ as *mut c_void)) == 0 {
            return None;
        }
        let (w, h) = (bm.bmWidth, bm.bmHeight.abs());
        if w <= 0 || h <= 0 || w > 256 || h > 256 {
            return None;
        }
        let mut bi = BITMAPINFO::default();
        bi.bmiHeader = BITMAPINFOHEADER {
            biSize: std::mem::size_of::<BITMAPINFOHEADER>() as u32,
            biWidth: w,
            biHeight: -h,
            biPlanes: 1,
            biBitCount: 32,
            biCompression: BI_RGB.0,
            ..Default::default()
        };
        let mut buf = vec![0u8; (w * h * 4) as usize];
        let dc = CreateCompatibleDC(None);
        let lines = GetDIBits(dc, bmp, 0, h as u32, Some(buf.as_mut_ptr() as *mut c_void), &mut bi, DIB_RGB_COLORS);
        let _ = DeleteDC(dc);
        if lines == 0 {
            return None;
        }
        let mut any_alpha = false;
        for px in buf.chunks_exact_mut(4) {
            px.swap(0, 2); // BGRA -> RGBA
            if px[3] != 0 {
                any_alpha = true;
            }
        }
        if !any_alpha {
            return None;
        }
        encode_png(&buf, w as u32, h as u32).map(|png| b64(&png))
    }
}

/// Official Windows Shell lookup for any UWP/Store or registered Win32 app by AUMID (`shell:AppsFolder\<aumid>`).
fn apps_folder_icon(aumid: &str) -> Option<String> {
    if aumid.is_empty() {
        return None;
    }
    com_init();
    unsafe {
        let path = HSTRING::from(format!("shell:AppsFolder\\{aumid}"));
        let factory: IShellItemImageFactory = SHCreateItemFromParsingName(&path, None).ok()?;
        let bmp = factory.GetImage(SIZE { cx: 48, cy: 48 }, SIIGBF_ICONONLY | SIIGBF_BIGGERSIZEOK).ok()?;
        let out = hbitmap_png_b64(bmp);
        let _ = DeleteObject(HGDIOBJ(bmp.0));
        out
    }
}

fn icon_from_spec(raw: &str) -> Option<String> {
    let mut p = raw.trim().trim_matches('"').to_string();
    if let Some(rest) = p.strip_prefix("file:///") {
        p = rest.replace('/', "\\");
    }
    if let Some(comma) = p.rfind(',') {
        if p[comma + 1..].trim().trim_start_matches('-').chars().all(|c| c.is_ascii_digit()) {
            p.truncate(comma);
        }
    }
    let p = p.trim();
    if p.is_empty() || !std::path::Path::new(p).exists() {
        return None;
    }
    let ext = std::path::Path::new(p).extension().and_then(|e| e.to_str()).unwrap_or("").to_ascii_lowercase();
    if matches!(ext.as_str(), "png" | "jpg" | "jpeg" | "webp" | "bmp") {
        if let Ok(bytes) = std::fs::read(p) {
            if !bytes.is_empty() {
                return Some(b64(&bytes));
            }
        }
    }
    file_icon_b64(p)
}

fn collect_lnks(dir: &std::path::Path, depth: u8, out: &mut Vec<(String, String)>) {
    if depth > 4 {
        return;
    }
    let Ok(rd) = std::fs::read_dir(dir) else { return };
    for entry in rd.flatten() {
        let p = entry.path();
        if p.is_dir() {
            collect_lnks(&p, depth + 1, out);
        } else if p.extension().and_then(|e| e.to_str()).is_some_and(|e| e.eq_ignore_ascii_case("lnk")) {
            if let Some(stem) = p.file_stem().and_then(|s| s.to_str()) {
                out.push((stem.to_ascii_lowercase(), p.to_string_lossy().into_owned()));
            }
        }
    }
}

fn start_menu_lnks() -> &'static Vec<(String, String)> {
    static LNKS: OnceLock<Vec<(String, String)>> = OnceLock::new();
    LNKS.get_or_init(|| {
        let mut out = Vec::new();
        for var in ["APPDATA", "PROGRAMDATA"] {
            if let Ok(base) = std::env::var(var) {
                let p = PathBuf::from(base).join("Microsoft\\Windows\\Start Menu\\Programs");
                collect_lnks(&p, 0, &mut out);
            }
        }
        out
    })
}

fn reg_sz(root: windows::Win32::System::Registry::HKEY, key: &str, value: &str) -> Option<String> {
    use windows::Win32::System::Registry::*;
    unsafe {
        let mut buf = [0u16; 260];
        let mut n = (buf.len() * 2) as u32;
        let r = RegGetValueW(root, &HSTRING::from(key), &HSTRING::from(value), RRF_RT_REG_SZ, None, Some(buf.as_mut_ptr() as *mut c_void), Some(&mut n));
        if r == ERROR_SUCCESS { Some(from_wide(&buf)) } else { None }
    }
}

/// Resolves an app's icon (base64 PNG) from Shell AppsFolder, AppUserModelId registry, Start Menu shortcuts, or running processes.
pub fn resolve_app_icon(aumid: &str, app: &str) -> Option<String> {
    use windows::Win32::System::Diagnostics::ToolHelp::*;
    use windows::Win32::System::Registry::*;

    if let Some(ic) = apps_folder_icon(aumid) {
        return Some(ic);
    }
    if !aumid.is_empty() {
        let key = format!("Software\\Classes\\AppUserModelId\\{aumid}");
        for root in [HKEY_CURRENT_USER, HKEY_LOCAL_MACHINE] {
            for val in ["IconUri", "DisplayIcon"] {
                if let Some(spec) = reg_sz(root, &key, val) {
                    if let Some(ic) = icon_from_spec(&spec) {
                        return Some(ic);
                    }
                }
            }
        }
        if aumid.to_ascii_lowercase().ends_with(".exe") {
            if let Some(ic) = icon_from_spec(aumid) {
                return Some(ic);
            }
        }
    }
    let app_lc = app.to_ascii_lowercase();
    let aumid_lc = aumid.to_ascii_lowercase();
    let stem_hint = aumid_lc.strip_suffix(".exe").unwrap_or(&aumid_lc);
    if !app_lc.is_empty() || !stem_hint.is_empty() {
        for (name, lnk) in start_menu_lnks() {
            if (!app_lc.is_empty() && (name == &app_lc || (app_lc.len() >= 4 && name.contains(&app_lc)) || (name.len() >= 4 && app_lc.contains(name))))
                || (stem_hint.len() >= 4 && name.contains(stem_hint))
            {
                if let Some(ic) = file_icon_b64(lnk) {
                    return Some(ic);
                }
            }
        }
    }
    let alias = if app_lc.contains("chrome") || aumid_lc.contains("chrome") { "chrome" }
        else if app_lc.contains("edge") || aumid_lc.contains("msedge") { "msedge" }
        else if app_lc.contains("visual studio code") || app_lc == "vs code" { "code" }
        else if app_lc.contains("telegram") || aumid_lc.contains("telegram") { "telegram" }
        else if app_lc.contains("whatsapp") || aumid_lc.contains("whatsapp") { "whatsapp" }
        else if app_lc.contains("discord") || aumid_lc.contains("discord") { "discord" }
        else if app_lc.contains("spotify") || aumid_lc.contains("spotify") { "spotify" }
        else { "" };
    unsafe {
        let Ok(snap) = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0) else { return None };
        let mut pe = PROCESSENTRY32W { dwSize: std::mem::size_of::<PROCESSENTRY32W>() as u32, ..Default::default() };
        let mut ok = Process32FirstW(snap, &mut pe).is_ok();
        let mut found = None;
        while ok {
            let exe_name = from_wide(&pe.szExeFile).to_ascii_lowercase();
            let stem = exe_name.strip_suffix(".exe").unwrap_or(&exe_name);
            let matched = (!alias.is_empty() && stem == alias)
                || (stem.len() >= 4 && (app_lc.contains(stem) || aumid_lc.contains(stem)));
            if matched {
                if let Some(exe) = exe_of_pid(pe.th32ProcessID) {
                    if let Some(ic) = file_icon_b64(&exe) {
                        found = Some(ic);
                        break;
                    }
                }
            }
            ok = Process32NextW(snap, &mut pe).is_ok();
        }
        let _ = CloseHandle(snap);
        found
    }
}
