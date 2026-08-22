const SOP_GROUPS = [
  { key: "PM1-KhoiTao", tkey: "sop.1" },
  { key: "PM2-LapKeHoach", tkey: "sop.2" },
  { key: "PM3-ThucThi", tkey: "sop.3" },
  { key: "PM4-GiamSat", tkey: "sop.4" },
  { key: "PM5-KetThuc", tkey: "sop.5" },
];
function sopName(key) {
  const g = SOP_GROUPS.find((g) => g.key === key);
  return g ? t(g.tkey) : key;
}
function phaseNumFromKey(key) {
  const idx = SOP_GROUPS.findIndex((g) => g.key === key);
  return idx === -1 ? null : idx + 1;
}

let api = null;
let currentUser = null;
let allIssues = [];
let allAssignees = [];

// ---------------- tabs ----------------
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});
function switchTab(tab) {
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  document.querySelectorAll(".tab-panel").forEach((p) => p.classList.toggle("active", p.id === "tab-" + tab));
  if (tab === "dashboard") renderDashboard();
  if (tab === "tasks") renderTasks();
  if (tab === "forms") renderFormsTab();
  if (tab === "masterdata") { renderMasterDataTab(); renderVocabTab(); }
  if (tab === "exportHistory") renderExportHistoryTab();
}

// called by i18n.js whenever the language toggle changes
function onLangChange() {
  populateFilterOptions();
  renderDashboard();
  if (document.getElementById("tab-tasks").classList.contains("active")) renderTasks();
  if (document.getElementById("tab-forms").classList.contains("active")) renderFormsTab();
  if (document.getElementById("tab-masterdata").classList.contains("active")) { renderMasterDataTab(); renderVocabTab(); }
  if (document.getElementById("tab-exportHistory").classList.contains("active")) renderExportHistoryTab();
}

// ---------------- init / connection ----------------
function initApi() {
  const cfg = GitHubStore.getConfig();
  if (cfg.owner && cfg.repo && cfg.token) {
    api = new GitHubAPI(cfg.owner, cfg.repo, cfg.token);
    return true;
  }
  api = null;
  return false;
}

async function tryConnect(showAlert) {
  const statusEl = document.getElementById("connStatus");
  if (!initApi()) {
    statusEl.textContent = t("conn.none_goto_settings");
    return false;
  }
  statusEl.textContent = t("conn.connecting");
  try {
    const repoInfo = await api.testConnection();
    currentUser = repoInfo.owner ? repoInfo.owner.login : null;
    statusEl.textContent = t("conn.connected", { repo: repoInfo.full_name });
    await loadAll();
    return true;
  } catch (e) {
    statusEl.textContent = t("conn.error");
    if (showAlert) alert(t("alert.connectFail", { msg: e.message }));
    return false;
  }
}

async function loadAll() {
  try {
    [allIssues, allAssignees] = await Promise.all([api.listIssues({ state: "all" }), api.listAssignees()]);
  } catch (e) {
    console.error(e);
  }
  try {
    await Promise.all([MasterData.load(api), VocabData.load(api), ExportLog.load(api)]);
  } catch (e) {
    console.error("Could not load master data / vocabulary / export log:", e);
  }
  populateFilterOptions();
  renderDashboard();
  if (document.getElementById("tab-tasks").classList.contains("active")) renderTasks();
  if (document.getElementById("tab-forms").classList.contains("active")) renderFormsTab();
  if (document.getElementById("tab-masterdata").classList.contains("active")) { renderMasterDataTab(); renderVocabTab(); }
  if (document.getElementById("tab-exportHistory").classList.contains("active")) renderExportHistoryTab();
}

function populateFilterOptions() {
  const sopSel = document.getElementById("filterSop");
  sopSel.innerHTML = `<option value="">${t("tasks.filterAllSop")}</option>` + SOP_GROUPS.map((g) => `<option value="${g.key}">${sopName(g.key)}</option>`).join("");
  const asSel = document.getElementById("filterAssignee");
  asSel.innerHTML = `<option value="">${t("tasks.filterAllAssignee")}</option>` + allAssignees.map((a) => `<option value="${a.login}">${a.login}</option>`).join("");
}

// ---------------- dashboard ----------------
function renderDashboard() {
  const total = allIssues.length;
  const done = allIssues.filter((i) => i.state === "closed").length;
  const overdue = allIssues.filter((i) => taskStatus(i) === "overdue").length;
  const open = total - done;
  document.getElementById("statGrid").innerHTML = [
    [t("dash.stat.total"), total],
    [t("dash.stat.open"), open],
    [t("dash.stat.done"), done],
    [t("dash.stat.overdue"), overdue],
  ].map(([lbl, num]) => `<div class="stat-card"><div class="num">${num}</div><div class="lbl">${lbl}</div></div>`).join("");

  document.getElementById("sopGrid").innerHTML = SOP_GROUPS.map((g) => {
    const count = allIssues.filter((i) => i.labels.some((l) => (l.name || l) === g.key) && i.state === "open").length;
    return `<div class="phase-card"><div class="name">${sopName(g.key)}</div><div class="count">${count} ${t("dash.sopCount")}</div></div>`;
  }).join("");

  const dueSoon = allIssues
    .filter((i) => i.state === "open")
    .map((i) => ({ issue: i, ...parseIssueBody(i.body) }))
    .filter((x) => x.dueDate)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 10);
  document.querySelector("#dueTable tbody").innerHTML = dueSoon.map((x) => taskRow(x.issue)).join("") || `<tr><td colspan="6" class="muted">${t("dash.noDue")}</td></tr>`;
}

// ---------------- tasks ----------------
function sopLabelOf(issue) {
  const l = issue.labels.find((l) => SOP_GROUPS.some((g) => g.key === (l.name || l)));
  return l ? (l.name || l) : "";
}
function statusBadge(issue) {
  const st = taskStatus(issue);
  if (st === "done") return `<span class="badge badge-done">${t("status.done")}</span>`;
  if (st === "overdue") return `<span class="badge badge-overdue">${t("status.overdue")}</span>`;
  return `<span class="badge badge-open">${t("status.open")}</span>`;
}
function taskRow(issue, withActions) {
  const { dueDate, project } = parseIssueBody(issue.body);
  const assignee = issue.assignees && issue.assignees.length ? issue.assignees.map((a) => a.login).join(", ") : "—";
  const titleWithProject = project ? `[${escapeHtml(project)}] ${escapeHtml(issue.title)}` : escapeHtml(issue.title);
  return `<tr>
    <td>#${issue.number}</td>
    <td><a href="${issue.html_url}" target="_blank" rel="noopener">${titleWithProject}</a></td>
    <td>${escapeHtml(sopName(sopLabelOf(issue)))}</td>
    <td>${escapeHtml(assignee)}</td>
    <td>${dueDate || "—"}</td>
    <td>${statusBadge(issue)}</td>
    ${withActions ? `<td>${issue.state === "open" ? `<button class="btn" onclick="markDone(${issue.number})">${t("tasks.markDone")}</button>` : `<button class="btn" onclick="reopenTask(${issue.number})">${t("tasks.reopen")}</button>`}</td>` : ""}
  </tr>`;
}

function renderTasks() {
  if (!api) { document.querySelector("#taskTable tbody").innerHTML = `<tr><td colspan="7" class="muted">${t("tasks.notConnected")}</td></tr>`; return; }
  const sopFilter = document.getElementById("filterSop").value;
  const assigneeFilter = document.getElementById("filterAssignee").value;
  const stateFilter = document.getElementById("filterState").value;
  let list = allIssues.slice();
  if (sopFilter) list = list.filter((i) => sopLabelOf(i) === sopFilter);
  if (assigneeFilter) list = list.filter((i) => (i.assignees || []).some((a) => a.login === assigneeFilter));
  if (stateFilter === "open") list = list.filter((i) => i.state === "open" && taskStatus(i) !== "overdue");
  if (stateFilter === "closed") list = list.filter((i) => i.state === "closed");
  if (stateFilter === "overdue") list = list.filter((i) => taskStatus(i) === "overdue");
  list.sort((a, b) => b.number - a.number);
  document.querySelector("#taskTable tbody").innerHTML = list.map((i) => taskRow(i, true)).join("") || `<tr><td colspan="7" class="muted">${t("tasks.empty")}</td></tr>`;
}
document.getElementById("btnApplyFilter").addEventListener("click", renderTasks);

async function markDone(number) {
  await api.updateIssue(number, { state: "closed" });
  await loadAll();
  renderTasks();
}
async function reopenTask(number) {
  await api.updateIssue(number, { state: "open" });
  await loadAll();
  renderTasks();
}

// ---- new task modal ----
document.getElementById("btnNewTask").addEventListener("click", openNewTaskModal);
function openNewTaskModal() {
  if (!api) { alert(t("alert.needConnect")); return; }
  const root = document.getElementById("modalRoot");
  const projectOptions = MasterData._loaded ? MasterData.get("projects") : [];
  root.innerHTML = `
  <div class="modal-backdrop" id="backdrop">
    <div class="modal">
      <h2>${t("modal.newTask.title")}</h2>
      <div class="form-fields">
        <label class="full">${t("modal.newTask.taskTitle")}
          <input id="ntTitle" type="text" required />
        </label>
        <label>${t("modal.newTask.project")}
          <select id="ntProject"><option value="">—</option>${projectOptions.map((p) => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join("")}</select>
        </label>
        <label>${t("modal.newTask.sop")}
          <select id="ntSop">${SOP_GROUPS.map((g) => `<option value="${g.key}">${sopName(g.key)}</option>`).join("")}</select>
        </label>
        <label>${t("modal.newTask.assignee")}
          <select id="ntAssignee">
            <option value="">${t("modal.newTask.noAssignee")}</option>
            ${allAssignees.map((a) => `<option value="${a.login}">${a.login}</option>`).join("")}
          </select>
        </label>
        <label>${t("modal.newTask.due")}
          <input id="ntDue" type="date" />
        </label>
        <label class="full">${t("modal.newTask.desc")}
          <textarea id="ntDesc" rows="3"></textarea>
        </label>
      </div>
      <div class="modal-actions">
        <button class="btn" id="ntCancel">${t("modal.cancel")}</button>
        <button class="btn btn-primary" id="ntSubmit">${t("modal.newTask.submit")}</button>
      </div>
    </div>
  </div>`;
  document.getElementById("ntCancel").onclick = () => (root.innerHTML = "");
  document.getElementById("backdrop").addEventListener("click", (e) => { if (e.target.id === "backdrop") root.innerHTML = ""; });
  document.getElementById("ntSubmit").onclick = async () => {
    const title = document.getElementById("ntTitle").value.trim();
    if (!title) { alert(t("alert.needTitle")); return; }
    const project = document.getElementById("ntProject").value;
    const sop = document.getElementById("ntSop").value;
    const assignee = document.getElementById("ntAssignee").value;
    const due = document.getElementById("ntDue").value;
    const desc = document.getElementById("ntDesc").value.trim();
    const body = buildIssueBody({ project, description: desc, dueDate: due, assignedBy: currentUser });
    try {
      await api.createIssue({ title, body, labels: [sop], assignees: assignee ? [assignee] : [] });
      root.innerHTML = "";
      await loadAll();
      renderTasks();
    } catch (e) {
      alert(t("alert.createFail", { msg: e.message }));
    }
  };
}

// ---------------- forms tab ----------------
function renderFormsTab() {
  const phaseSel = document.getElementById("formPhase");
  const prevPhase = phaseSel.value;
  phaseSel.innerHTML = SOP_GROUPS.map((g, i) => `<option value="${i + 1}">${sopName(g.key)}</option>`).join("");
  if (prevPhase) phaseSel.value = prevPhase;
  phaseSel.onchange = () => { populateFormTypeOptions(); renderFormFields(); };

  populateFormTypeOptions();

  const sel = document.getElementById("formType");
  sel.onchange = renderFormFields;
  const prefillSel = document.getElementById("formPrefillTask");
  prefillSel.innerHTML = `<option value="">${t("forms.noPrefill")}</option>` + allIssues.filter((i) => i.state === "open").map((i) => `<option value="${i.number}">#${i.number} ${escapeHtml(i.title)}</option>`).join("");
  renderFormFields();
}
function populateFormTypeOptions() {
  const phase = Number(document.getElementById("formPhase").value) || 1;
  const sel = document.getElementById("formType");
  const prevVal = sel.value;
  const defsForPhase = FORM_DEFS.filter((f) => f.phase === phase);
  sel.innerHTML = defsForPhase.map((f) => `<option value="${f.id}">${formLabel(f)}</option>`).join("");
  if (defsForPhase.some((f) => f.id === prevVal)) sel.value = prevVal;
}
function formLabel(def) {
  return getLang() === "en" && def.labelEn ? def.labelEn : def.label;
}
function fieldLabel(f) {
  return getLang() === "en" && f.labelEn ? f.labelEn : f.label;
}

let _rowTableDefs = {}; // fieldKey -> field def (columns[], etc.) for the currently rendered form
let _rowTableCounters = {}; // fieldKey -> next row id

function renderFormFields() {
  const def = FORM_DEFS.find((f) => f.id === document.getElementById("formType").value) || FORM_DEFS[0];
  const container = document.getElementById("formFieldsContainer");
  _rowTableDefs = {};
  _rowTableCounters = {};
  container.innerHTML = def.fields.map((f) => {
    const fullCls = f.full ? "full" : "";
    const lbl = fieldLabel(f);
    if (f.type === "droplist") return renderDroplistField(f, fullCls, lbl);
    if (f.type === "bilingual-droplist") return renderBilingualDroplistField(f, fullCls, lbl);
    if (f.type === "rowtable") { _rowTableDefs[f.key] = f; _rowTableCounters[f.key] = 0; return renderRowTableField(f, lbl); }
    if (f.type === "textarea") return `<label class="${fullCls}">${lbl}<textarea id="ff_${f.key}" rows="4"></textarea></label>`;
    if (f.type === "select") return `<label class="${fullCls}">${lbl}<select id="ff_${f.key}">${f.options.map((o) => `<option>${o}</option>`).join("")}</select></label>`;
    return `<label class="${fullCls}">${lbl}<input id="ff_${f.key}" type="${f.type === "date" ? "date" : "text"}" placeholder="${f.placeholder || ""}" /></label>`;
  }).join("");
  // rowtable fields start with one blank row for convenience
  Object.keys(_rowTableDefs).forEach((key) => addRowTableRow(key));
}

// ---------------- dynamic row-table fields (Stakeholder Register, WBS, Risk Register...) ----------------
function rowColLabel(c) { return getLang() === "en" && c.labelEn ? c.labelEn : c.label; }
function renderRowTableField(f, lbl) {
  const cols = f.columns;
  const header = cols.map((c) => `<th>${escapeHtml(rowColLabel(c))}</th>`).join("") + `<th></th>`;
  return `<div class="full rowtable-field">
    <label>${lbl}</label>
    <div class="rowtable-wrap">
      <table class="rowtable" id="ff_${f.key}_table">
        <thead><tr>${header}</tr></thead>
        <tbody id="ff_${f.key}_tbody"></tbody>
      </table>
    </div>
    <button type="button" class="btn" onclick="addRowTableRow('${f.key}')">+ ${t("rowtable.addRow")}</button>
  </div>`;
}
function rowTableCellHtml(fieldKey, rowId, col) {
  const id = `ff_${fieldKey}_r${rowId}_${col.key}`;
  if (col.type === "vocab-select") {
    const options = VocabData.get(col.source);
    return `<select id="${id}">
      <option value="">—</option>
      ${options.map((o) => `<option value="${escapeHtml(o.vi)}">${escapeHtml(o.vi)}${o.en ? " (" + escapeHtml(o.en) + ")" : ""}</option>`).join("")}
    </select>`;
  }
  if (col.type === "droplist") {
    const options = MasterData.get(col.source);
    return `<select id="${id}"><option value="">—</option>${options.map((o) => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join("")}</select>`;
  }
  if (col.type === "bilingual-droplist") {
    const options = VocabData.get(col.source);
    return `<select id="${id}" onchange="onRowVocabChange('${id}')">
      <option value="">—</option>
      ${options.map((o) => `<option value="${escapeHtml(o.vi)}">${escapeHtml(o.vi)}</option>`).join("")}
      <option value="${OTHER_VALUE}">${t("md.addNewOption")}</option>
    </select><input id="${id}_other" type="text" class="row-other" style="display:none;" placeholder="${t("vocab.viPlaceholder")}" />`;
  }
  if (col.type === "date") return `<input type="date" id="${id}" />`;
  return `<input type="text" id="${id}" placeholder="${col.placeholder || ""}" />`;
}
function onRowVocabChange(id) {
  const sel = document.getElementById(id);
  const other = document.getElementById(id + "_other");
  if (!sel || !other) return;
  other.style.display = sel.value === OTHER_VALUE ? "block" : "none";
  if (sel.value === OTHER_VALUE) other.focus();
}
function addRowTableRow(fieldKey) {
  const f = _rowTableDefs[fieldKey];
  const tbody = document.getElementById(`ff_${fieldKey}_tbody`);
  if (!f || !tbody) return;
  const rowId = _rowTableCounters[fieldKey]++;
  const tr = document.createElement("tr");
  tr.id = `ff_${fieldKey}_row${rowId}`;
  tr.innerHTML = f.columns.map((c) => `<td>${rowTableCellHtml(fieldKey, rowId, c)}</td>`).join("") +
    `<td><button type="button" class="row-remove" onclick="removeRowTableRow('${fieldKey}','${tr.id}')">✕</button></td>`;
  tbody.appendChild(tr);
}
function removeRowTableRow(fieldKey, rowElId) {
  const row = document.getElementById(rowElId);
  if (row) row.remove();
}
function collectRowTableData(f) {
  const tbody = document.getElementById(`ff_${f.key}_tbody`);
  if (!tbody) return [];
  const rows = [];
  Array.from(tbody.children).forEach((tr) => {
    const m = /_row(\d+)$/.exec(tr.id);
    if (!m) return;
    const rowId = m[1];
    const obj = {};
    let hasValue = false;
    f.columns.forEach((c) => {
      const cellId = `ff_${f.key}_r${rowId}_${c.key}`;
      const el = document.getElementById(cellId);
      let val = el ? el.value.trim() : "";
      if (c.type === "bilingual-droplist" && val === OTHER_VALUE) {
        const other = document.getElementById(cellId + "_other");
        val = other ? other.value.trim() : "";
      }
      obj[c.key] = val;
      if (val) hasValue = true;
    });
    if (hasValue) rows.push(obj);
  });
  return rows;
}

document.getElementById("formPrefillTask").addEventListener("change", (e) => {
  const num = e.target.value;
  if (!num) return;
  const issue = allIssues.find((i) => String(i.number) === num);
  if (!issue) return;
  const { description, dueDate, project } = parseIssueBody(issue.body);
  const guesses = { reason: description, purpose: description, changeDescription: description, content: description, progressSummary: description, topic: issue.title, project, fromDate: dueDate, toDate: dueDate, reportPeriod: dueDate };
  Object.entries(guesses).forEach(([k, v]) => {
    const el = document.getElementById("ff_" + k);
    if (el && v) el.value = v;
  });
});

let _generatingForm = false;
document.getElementById("btnGenerateForm").addEventListener("click", async () => {
  if (_generatingForm) return; // guard against double-click / double-fire creating duplicate export-log entries
  _generatingForm = true;
  const btn = document.getElementById("btnGenerateForm");
  btn.disabled = true;
  try {
    await doGenerateForm();
  } finally {
    _generatingForm = false;
    btn.disabled = false;
  }
});
async function doGenerateForm() {
  const def = FORM_DEFS.find((f) => f.id === document.getElementById("formType").value);
  const data = {};
  let missing = [];
  const newDroplistValues = []; // { category, value } typed inline via "+ Add new" (single-language master data)
  const newVocabValues = []; // { category, pair: {en, vi} } typed inline via "+ Add new" (bilingual vocabulary)
  def.fields.forEach((f) => {
    if (f.type === "droplist") {
      data[f.key] = readDroplistValue(f);
      const sel = document.getElementById("ff_" + f.key);
      if (sel && sel.value === "__other__" && data[f.key]) newDroplistValues.push({ category: f.source, value: data[f.key] });
    } else if (f.type === "bilingual-droplist") {
      const pair = readBilingualDroplistValue(f);
      data[f.key] = pair.vi; // exported administrative forms always use the Vietnamese term
      const sel = document.getElementById("ff_" + f.key);
      if (sel && sel.value === "__other__" && pair.vi) newVocabValues.push({ category: f.source, pair });
    } else if (f.type === "rowtable") {
      data[f.key] = collectRowTableData(f);
    } else {
      const el = document.getElementById("ff_" + f.key);
      data[f.key] = el ? el.value : "";
    }
    const isEmpty = f.type === "rowtable" ? !(data[f.key] && data[f.key].length) : !data[f.key];
    if (f.required && isEmpty) missing.push(fieldLabel(f));
  });
  if (missing.length) { alert(t("alert.missingFields", { fields: missing.join(", ") })); return; }

  const cfg = GitHubStore.getConfig();
  const today = dstamp();
  let fileName;
  if (api && ExportLog._loaded) {
    const version = ExportLog.nextVersion(def.slug, today);
    fileName = `${today}-${def.slug}_v${version}.${def.kind}`;
  } else {
    fileName = `${today}-${def.slug}_v1.${def.kind}`;
  }

  def.generate(data, { company: cfg.company || "", formCode: "", fileName });

  if (api) {
    await ExportLog.record(api, { slug: def.slug, formLabel: def.label, fileName, user: currentUser });
    for (const nv of newDroplistValues) await MasterData.quickAdd(api, nv.category, nv.value);
    for (const nv of newVocabValues) await VocabData.quickAdd(api, nv.category, nv.pair);
    if (document.getElementById("tab-exportHistory").classList.contains("active")) renderExportHistoryTab();
  }
}

// ---------------- settings ----------------
function loadSettingsForm() {
  const cfg = GitHubStore.getConfig();
  document.getElementById("cfgCompany").value = cfg.company || "";
  document.getElementById("cfgOwner").value = cfg.owner || "";
  document.getElementById("cfgRepo").value = cfg.repo || "";
  document.getElementById("cfgToken").value = cfg.token || "";
}
document.getElementById("settingsForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const cfg = {
    company: document.getElementById("cfgCompany").value.trim(),
    owner: document.getElementById("cfgOwner").value.trim(),
    repo: document.getElementById("cfgRepo").value.trim(),
    token: document.getElementById("cfgToken").value.replace(/\s+/g, ""),
  };
  GitHubStore.saveConfig(cfg);
  await tryConnect(true);
});
document.getElementById("btnTestConn").addEventListener("click", async () => {
  const cfg = {
    company: document.getElementById("cfgCompany").value.trim(),
    owner: document.getElementById("cfgOwner").value.trim(),
    repo: document.getElementById("cfgRepo").value.trim(),
    token: document.getElementById("cfgToken").value.replace(/\s+/g, ""),
  };
  GitHubStore.saveConfig(cfg);
  const ok = await tryConnect(true);
  if (ok) alert(t("alert.connectOk"));
});
document.getElementById("btnClearToken").addEventListener("click", () => {
  if (!confirm(t("alert.confirmClearToken"))) return;
  GitHubStore.clearToken();
  document.getElementById("cfgToken").value = "";
  api = null;
  document.getElementById("connStatus").textContent = t("conn.none");
});
document.getElementById("btnRefreshDash").addEventListener("click", loadAll);
document.getElementById("btnSaveMasterData").addEventListener("click", mdSaveAll);

// ---------------- boot ----------------
(function boot() {
  applyStaticTranslations();
  document.querySelectorAll(".lang-btn").forEach((b) => b.classList.toggle("active", b.dataset.lang === getLang()));
  loadSettingsForm();
  renderDashboard();
  tryConnect(false);
})();
