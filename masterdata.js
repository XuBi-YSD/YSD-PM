/**
 * Danh mục dùng chung (Droplist): Dự án, Nhà tài trợ, Các bên liên quan, Nhà thầu/NCC, Thành viên đội dự án.
 * Lưu tại data/masterdata.json trên chính repo, đọc/ghi qua GitHub Contents API
 * để mọi người dùng chung 1 danh sách. Token cần thêm quyền "Contents: Read and write".
 */
const MASTERDATA_PATH = "data/masterdata.json";
const MASTERDATA_FALLBACK = { projects: [], sponsors: [], stakeholders: [], contractors: [], teamMembers: [] };
const OTHER_VALUE = "__other__";

const MD_CATEGORIES = [
  { key: "projects", tkey: "md.cat.projects" },
  { key: "sponsors", tkey: "md.cat.sponsors" },
  { key: "stakeholders", tkey: "md.cat.stakeholders" },
  { key: "contractors", tkey: "md.cat.contractors" },
  { key: "teamMembers", tkey: "md.cat.teamMembers" },
];

const MasterData = {
  data: structuredCloneCompat(MASTERDATA_FALLBACK),
  _sha: null,
  _loaded: false,

  async load(api) {
    const { data, sha } = await api.loadJsonFile(MASTERDATA_PATH, MASTERDATA_FALLBACK);
    this.data = Object.assign(structuredCloneCompat(MASTERDATA_FALLBACK), data);
    this._sha = sha;
    this._loaded = true;
    return this.data;
  },

  get(category) {
    return (this.data[category] || []).slice().sort((a, b) => a.localeCompare(b, "vi"));
  },

  /** Save the full in-memory data object (used by the Danh mục management tab). */
  async saveAll(api) {
    const res = await api.updateJsonFile(
      MASTERDATA_PATH,
      MASTERDATA_FALLBACK,
      () => structuredCloneCompat(this.data),
      "YSD-PM: update master data (droplists)"
    );
    this._sha = res && res.content ? res.content.sha : this._sha;
    return res;
  },

  /** Best-effort: add a value typed inline via "+ Add new" in a form, without blocking the export. */
  async quickAdd(api, category, value) {
    value = (value || "").trim();
    if (!value) return;
    if ((this.data[category] || []).includes(value)) return;
    this.data[category] = [...(this.data[category] || []), value];
    try {
      await api.updateJsonFile(
        MASTERDATA_PATH,
        MASTERDATA_FALLBACK,
        (remote) => {
          remote[category] = remote[category] || [];
          if (!remote[category].includes(value)) remote[category] = [...remote[category], value];
          return remote;
        },
        `YSD-PM: add "${value}" to ${category}`
      );
    } catch (e) {
      console.warn("Could not persist quick-added value to master data:", e.message);
    }
  },
};

// ---------------- droplist field rendering (used by app.js renderFormFields) ----------------
function renderDroplistField(f, fullCls, lbl) {
  const options = MasterData.get(f.source);
  return `<label class="${fullCls}">${lbl}
    <select id="ff_${f.key}" onchange="onDroplistChange('${f.key}')">
      <option value="">—</option>
      ${options.map((o) => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join("")}
      <option value="${OTHER_VALUE}">${t("md.addNewOption")}</option>
    </select>
    <input id="ff_${f.key}_other" type="text" style="display:none; margin-top:6px;" placeholder="${t("md.newValuePlaceholder")}" />
  </label>`;
}
function onDroplistChange(key) {
  const sel = document.getElementById("ff_" + key);
  const other = document.getElementById("ff_" + key + "_other");
  if (!sel || !other) return;
  other.style.display = sel.value === OTHER_VALUE ? "block" : "none";
  if (sel.value === OTHER_VALUE) other.focus();
}
function readDroplistValue(f) {
  const sel = document.getElementById("ff_" + f.key);
  if (!sel) return "";
  if (sel.value === OTHER_VALUE) {
    const other = document.getElementById("ff_" + f.key + "_other");
    return other ? other.value.trim() : "";
  }
  return sel.value;
}

// ---------------- Danh mục (master data) management tab ----------------
function renderMasterDataTab() {
  const root = document.getElementById("masterDataContainer");
  if (!MasterData._loaded) {
    root.innerHTML = `<p class="muted">${t("md.notLoaded")}</p>`;
    return;
  }
  root.innerHTML = MD_CATEGORIES.map((c) => {
    const items = MasterData.get(c.key);
    return `
    <div class="md-card">
      <h3>${t(c.tkey)} <span class="muted">(${items.length})</span></h3>
      <div class="md-list" id="mdList_${c.key}">
        ${items.map((it) => `<div class="md-item"><span>${escapeHtml(it)}</span><button class="md-remove" onclick="mdRemove('${c.key}', ${JSON.stringify(it)})">✕</button></div>`).join("") || `<div class="muted small">${t("md.empty")}</div>`}
      </div>
      <div class="md-add">
        <input type="text" id="mdInput_${c.key}" placeholder="${t("md.newValuePlaceholder")}" />
        <button class="btn" onclick="mdAdd('${c.key}')">${t("md.addBtn")}</button>
      </div>
    </div>`;
  }).join("");
}
function mdAdd(category) {
  const input = document.getElementById("mdInput_" + category);
  const value = input.value.trim();
  if (!value) return;
  if (!MasterData.data[category].includes(value)) {
    MasterData.data[category] = [...MasterData.data[category], value];
  }
  input.value = "";
  renderMasterDataTab();
}
function mdRemove(category, value) {
  MasterData.data[category] = MasterData.data[category].filter((v) => v !== value);
  renderMasterDataTab();
}
async function mdSaveAll() {
  if (!api) { alert(t("alert.needConnect")); return; }
  try {
    await MasterData.saveAll(api);
    alert(t("md.saveOk"));
  } catch (e) {
    alert(t("alert.saveFail", { msg: e.message }));
  }
}
