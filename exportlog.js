/**
 * Lịch sử xuất biểu mẫu — lưu chung trên GitHub (data/export_log.json) để
 * mọi người thấy ai đã xuất file gì, khi nào; đồng thời dùng để tính số
 * version (_v1, _v2...) khi xuất trùng loại biểu mẫu trong cùng 1 ngày.
 */
const EXPORT_LOG_PATH = "data/export_log.json";
const EXPORT_LOG_FALLBACK = { entries: [] };
const EXPORT_LOG_MAX_ENTRIES = 500;

const ExportLog = {
  data: structuredCloneCompat(EXPORT_LOG_FALLBACK),
  _loaded: false,

  async load(api) {
    const { data } = await api.loadJsonFile(EXPORT_LOG_PATH, EXPORT_LOG_FALLBACK);
    this.data = Object.assign(structuredCloneCompat(EXPORT_LOG_FALLBACK), data);
    this._loaded = true;
    return this.data;
  },

  /** Next version number (1, 2, 3...) for a given form slug on today's date. */
  nextVersion(slug, dateStr) {
    const n = this.data.entries.filter((e) => e.slug === slug && e.date === dateStr).length;
    return n + 1;
  },

  async record(api, { slug, formLabel, fileName, user }) {
    const entry = {
      slug,
      formLabel,
      fileName,
      user: user || "?",
      date: dstamp(),
      timestamp: new Date().toISOString(),
    };
    this.data.entries.push(entry);
    if (this.data.entries.length > EXPORT_LOG_MAX_ENTRIES) {
      this.data.entries = this.data.entries.slice(-EXPORT_LOG_MAX_ENTRIES);
    }
    try {
      await api.updateJsonFile(
        EXPORT_LOG_PATH,
        EXPORT_LOG_FALLBACK,
        (remote) => {
          remote.entries = remote.entries || [];
          remote.entries.push(entry);
          if (remote.entries.length > EXPORT_LOG_MAX_ENTRIES) remote.entries = remote.entries.slice(-EXPORT_LOG_MAX_ENTRIES);
          return remote;
        },
        `YSD-PM: log export ${fileName}`
      );
    } catch (e) {
      console.warn("Could not persist export log entry:", e.message);
    }
  },
};

function renderExportHistoryTab() {
  const tbody = document.querySelector("#exportLogTable tbody");
  if (!tbody) return;
  if (!api) { tbody.innerHTML = `<tr><td colspan="4" class="muted">${t("tasks.notConnected")}</td></tr>`; return; }
  if (!ExportLog._loaded) { tbody.innerHTML = `<tr><td colspan="4" class="muted">${t("md.notLoaded")}</td></tr>`; return; }
  const list = ExportLog.data.entries.slice().reverse();
  tbody.innerHTML = list.map((e) => `<tr>
    <td>${new Date(e.timestamp).toLocaleString(getLang() === "en" ? "en-US" : "vi-VN")}</td>
    <td>${escapeHtml(e.formLabel)}</td>
    <td>${escapeHtml(e.fileName)}</td>
    <td>${escapeHtml(e.user)}</td>
  </tr>`).join("") || `<tr><td colspan="4" class="muted">${t("export.empty")}</td></tr>`;
}

function dstamp() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}
