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
    await VocabData.saveAll(api);
    alert(t("md.saveOk"));
  } catch (e) {
    alert(t("alert.saveFail", { msg: e.message }));
  }
}

// =====================================================================
// Bilingual vocabulary droplists (Vai trò, Mức độ rủi ro, Trạng thái...)
// Mỗi mục lưu dạng {en, vi}. Biểu mẫu xuất ra LUÔN dùng giá trị tiếng Việt
// (đúng quy định thể thức hành chính), nhưng người nhập liệu có thể thấy
// và tìm theo cả tiếng Anh, và có thể thêm mục mới chỉ gõ 1 ngôn ngữ —
// ngôn ngữ còn lại sẽ được tự động gợi ý từ dictionary.js nếu nhận diện được.
// =====================================================================
const VOCAB_PATH = "data/vocab.json";
const VOCAB_FALLBACK = {
  stakeholderRoles: [], riskLevels: [], scheduleStatuses: [],
  costStatuses: [], approvalStatuses: [], issueStatuses: [], contractTypes: [],
};
const VOCAB_CATEGORIES = [
  { key: "stakeholderRoles", tkey: "vocab.cat.stakeholderRoles" },
  { key: "riskLevels", tkey: "vocab.cat.riskLevels" },
  { key: "scheduleStatuses", tkey: "vocab.cat.scheduleStatuses" },
  { key: "costStatuses", tkey: "vocab.cat.costStatuses" },
  { key: "approvalStatuses", tkey: "vocab.cat.approvalStatuses" },
  { key: "issueStatuses", tkey: "vocab.cat.issueStatuses" },
  { key: "contractTypes", tkey: "vocab.cat.contractTypes" },
];

const VocabData = {
  data: structuredCloneCompat(VOCAB_FALLBACK),
  _sha: null,
  _loaded: false,

  async load(api) {
    const { data, sha } = await api.loadJsonFile(VOCAB_PATH, VOCAB_FALLBACK);
    this.data = Object.assign(structuredCloneCompat(VOCAB_FALLBACK), data);
    this._sha = sha;
    this._loaded = true;
    return this.data;
  },

  /** Returns [{en, vi}] sorted by Vietnamese label. */
  get(category) {
    return (this.data[category] || []).slice().sort((a, b) => (a.vi || "").localeCompare(b.vi || "", "vi"));
  },

  async saveAll(api) {
    const res = await api.updateJsonFile(
      VOCAB_PATH, VOCAB_FALLBACK,
      () => structuredCloneCompat(this.data),
      "YSD-PM: update vocabulary droplists"
    );
    this._sha = res && res.content ? res.content.sha : this._sha;
    return res;
  },

  /** Best-effort background persist of a quick-added {en, vi} pair. */
  async quickAdd(api, category, pair) {
    if (!pair || !pair.vi) return;
    const exists = (this.data[category] || []).some((p) => p.vi === pair.vi);
    if (!exists) this.data[category] = [...(this.data[category] || []), pair];
    try {
      await api.updateJsonFile(
        VOCAB_PATH, VOCAB_FALLBACK,
        (remote) => {
          remote[category] = remote[category] || [];
          if (!remote[category].some((p) => p.vi === pair.vi)) remote[category] = [...remote[category], pair];
          return remote;
        },
        `YSD-PM: add "${pair.vi}" to ${category}`
      );
    } catch (e) {
      console.warn("Could not persist quick-added vocabulary term:", e.message);
    }
  },
};

/** Bilingual droplist: shown as "Tiếng Việt (English)", value stored/exported is always the Vietnamese term. */
function renderBilingualDroplistField(f, fullCls, lbl) {
  const options = VocabData.get(f.source);
  return `<label class="${fullCls}">${lbl}
    <select id="ff_${f.key}" onchange="onBilingualDroplistChange('${f.key}')">
      <option value="">—</option>
      ${options.map((o) => `<option value="${escapeHtml(o.vi)}">${escapeHtml(o.vi)}${o.en ? " (" + escapeHtml(o.en) + ")" : ""}</option>`).join("")}
      <option value="${OTHER_VALUE}">${t("md.addNewOption")}</option>
    </select>
    <div id="ff_${f.key}_other" class="bilingual-add" style="display:none;">
      <input id="ff_${f.key}_other_vi" type="text" placeholder="${t("vocab.viPlaceholder")}" oninput="onBilingualTermInput('${f.key}','vi')" />
      <input id="ff_${f.key}_other_en" type="text" placeholder="${t("vocab.enPlaceholder")}" oninput="onBilingualTermInput('${f.key}','en')" />
      <div class="hint">${t("vocab.autoTranslateHint")}</div>
    </div>
  </label>`;
}
function onBilingualDroplistChange(key) {
  const sel = document.getElementById("ff_" + key);
  const other = document.getElementById("ff_" + key + "_other");
  if (!sel || !other) return;
  other.style.display = sel.value === OTHER_VALUE ? "flex" : "none";
  if (sel.value === OTHER_VALUE) document.getElementById("ff_" + key + "_other_vi").focus();
}
/** Auto-fill the other language from the offline PMBOK dictionary as the user types. */
function onBilingualTermInput(key, lang) {
  const srcEl = document.getElementById(`ff_${key}_other_${lang}`);
  const dstLang = lang === "en" ? "vi" : "en";
  const dstEl = document.getElementById(`ff_${key}_other_${dstLang}`);
  if (!srcEl || !dstEl || dstEl.value.trim()) return; // don't overwrite what the user already typed
  const guess = translateTerm(srcEl.value, lang);
  if (guess) dstEl.value = guess;
}
function readBilingualDroplistValue(f) {
  const sel = document.getElementById("ff_" + f.key);
  if (!sel) return { vi: "", en: "" };
  if (sel.value === OTHER_VALUE) {
    const vi = (document.getElementById("ff_" + f.key + "_other_vi") || {}).value || "";
    const en = (document.getElementById("ff_" + f.key + "_other_en") || {}).value || "";
    return { vi: vi.trim(), en: en.trim() };
  }
  const match = VocabData.get(f.source).find((o) => o.vi === sel.value);
  return { vi: sel.value, en: match ? match.en : "" };
}

// ---------------- Vocabulary (bilingual droplist) management tab ----------------
function renderVocabTab() {
  const root = document.getElementById("vocabContainer");
  if (!root) return;
  if (!VocabData._loaded) { root.innerHTML = `<p class="muted">${t("md.notLoaded")}</p>`; return; }
  root.innerHTML = VOCAB_CATEGORIES.map((c) => {
    const items = VocabData.get(c.key);
    return `
    <div class="md-card">
      <h3>${t(c.tkey)} <span class="muted">(${items.length})</span></h3>
      <div class="md-list" id="vocabList_${c.key}">
        ${items.map((it) => `<div class="md-item"><span>${escapeHtml(it.vi)}${it.en ? ` <span class="muted small">(${escapeHtml(it.en)})</span>` : ""}</span><button class="md-remove" onclick="vocabRemove('${c.key}', ${JSON.stringify(it.vi)})">✕</button></div>`).join("") || `<div class="muted small">${t("md.empty")}</div>`}
      </div>
      <div class="md-add bilingual-add">
        <input type="text" id="vocabInputVi_${c.key}" placeholder="${t("vocab.viPlaceholder")}" oninput="onVocabTabInput('${c.key}','vi')" />
        <input type="text" id="vocabInputEn_${c.key}" placeholder="${t("vocab.enPlaceholder")}" oninput="onVocabTabInput('${c.key}','en')" />
        <button class="btn" onclick="vocabAdd('${c.key}')">${t("md.addBtn")}</button>
      </div>
    </div>`;
  }).join("");
}
function onVocabTabInput(category, lang) {
  const dstLang = lang === "en" ? "vi" : "en";
  const srcEl = document.getElementById(`vocabInput${lang === "en" ? "En" : "Vi"}_${category}`);
  const dstEl = document.getElementById(`vocabInput${dstLang === "en" ? "En" : "Vi"}_${category}`);
  if (!srcEl || !dstEl || dstEl.value.trim()) return;
  const guess = translateTerm(srcEl.value, lang);
  if (guess) dstEl.value = guess;
}
function vocabAdd(category) {
  const viInput = document.getElementById("vocabInputVi_" + category);
  const enInput = document.getElementById("vocabInputEn_" + category);
  const vi = viInput.value.trim();
  const en = enInput.value.trim();
  if (!vi) { alert(t("vocab.needVi")); return; }
  if (!VocabData.data[category].some((p) => p.vi === vi)) {
    VocabData.data[category] = [...VocabData.data[category], { vi, en }];
  }
  viInput.value = ""; enInput.value = "";
  renderVocabTab();
}
function vocabRemove(category, vi) {
  VocabData.data[category] = VocabData.data[category].filter((p) => p.vi !== vi);
  renderVocabTab();
}
