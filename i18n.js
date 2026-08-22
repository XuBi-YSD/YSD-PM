/**
 * i18n — giao diện song ngữ Việt / Anh (Vietnamese / English UI).
 * Biểu mẫu Word/Excel xuất ra KHÔNG bị ảnh hưởng — luôn giữ nguyên tiếng Việt
 * theo đúng thể thức hành chính Việt Nam.
 */
const I18N = {
  vi: {
    "brand.subtitle": "Quản lý Dự án theo PMI/PMBOK",
    "nav.dashboard": "Bảng điều khiển",
    "nav.tasks": "Công việc",
    "nav.forms": "Biểu mẫu",
    "nav.masterdata": "Danh mục",
    "nav.exportHistory": "Lịch sử xuất",
    "nav.settings": "Cài đặt",

    "md.cat.projects": "Dự án",
    "md.cat.sponsors": "Nhà tài trợ / Chủ đầu tư",
    "md.cat.stakeholders": "Các bên liên quan",
    "md.cat.contractors": "Nhà thầu / Nhà cung cấp",
    "md.cat.teamMembers": "Thành viên đội dự án",
    "md.title": "Danh mục dùng chung (Droplist)",
    "md.desc": "Các danh sách này dùng chung cho mọi người qua repo GitHub. Thêm/xoá rồi bấm \"Lưu danh mục\" để mọi người cùng thấy. Cũng có thể thêm nhanh ngay khi điền biểu mẫu (chọn \"+ Thêm mới...\").",
    "md.addNewOption": "+ Thêm mới...",
    "md.newValuePlaceholder": "Nhập giá trị mới...",
    "md.addBtn": "+ Thêm",
    "md.saveAllBtn": "💾 Lưu danh mục",
    "md.saveOk": "Đã lưu danh mục lên GitHub!",
    "md.empty": "(chưa có mục nào)",
    "md.notLoaded": "Đang tải danh mục... (cần kết nối GitHub ở tab Cài đặt)",

    "vocab.cat.stakeholderRoles": "Vai trò bên liên quan",
    "vocab.cat.riskLevels": "Mức độ (Cao/TB/Thấp)",
    "vocab.cat.scheduleStatuses": "Trạng thái tiến độ",
    "vocab.cat.costStatuses": "Trạng thái chi phí",
    "vocab.cat.approvalStatuses": "Trạng thái phê duyệt",
    "vocab.cat.issueStatuses": "Trạng thái vấn đề",
    "vocab.cat.contractTypes": "Loại hợp đồng",
    "vocab.title": "Danh mục thuật ngữ song ngữ (Vai trò, Trạng thái, Mức độ...)",
    "vocab.desc": "Dùng cho các trường chọn nhanh trong biểu mẫu (vai trò bên liên quan, mức độ rủi ro, trạng thái tiến độ/chi phí/phê duyệt, loại hợp đồng...). Chỉ cần gõ 1 ngôn ngữ (Anh hoặc Việt) — nếu là thuật ngữ PMBOK quen thuộc, ngôn ngữ còn lại sẽ được tự động gợi ý điền.",
    "vocab.viPlaceholder": "Tiếng Việt...",
    "vocab.enPlaceholder": "Tiếng Anh (English)...",
    "vocab.autoTranslateHint": "Gõ 1 ô — nếu là thuật ngữ quen thuộc, ô còn lại sẽ tự gợi ý điền.",
    "vocab.needVi": "Vui lòng nhập ít nhất tiếng Việt.",

    "rowtable.addRow": "Thêm dòng",

    "export.title": "Lịch sử xuất biểu mẫu",
    "export.desc": "Ghi lại mỗi lần xuất biểu mẫu: ai xuất, khi nào, tên file gì — lưu chung trên GitHub.",
    "export.empty": "Chưa có biểu mẫu nào được xuất.",
    "export.col.time": "Thời gian",
    "export.col.form": "Loại biểu mẫu",
    "export.col.file": "Tên file",
    "export.col.user": "Người xuất",

    "conn.none": "⚪ Chưa kết nối",
    "conn.none_goto_settings": "⚪ Chưa kết nối — vào Cài đặt",
    "conn.connecting": "🟡 Đang kết nối...",
    "conn.connected": "🟢 Đã kết nối: {repo}",
    "conn.error": "🔴 Lỗi kết nối",

    "dash.title": "Bảng điều khiển",
    "dash.refresh": "🔄 Làm mới",
    "dash.pmMap": "Quy trình PMI/PMBOK — 5 Nhóm quy trình",
    "pmmap.1": "1. Khởi tạo",
    "pmmap.2": "2. Lập kế hoạch",
    "pmmap.3": "3. Thực thi",
    "pmmap.4": "4. Giám sát & Kiểm soát (song song, xuyên suốt)",
    "pmmap.5": "5. Kết thúc",
    "dash.bySop": "Theo giai đoạn dự án (PMI)",
    "dash.dueSoon": "Sắp đến hạn / Quá hạn",
    "dash.noDue": "Không có công việc nào có hạn.",
    "dash.stat.total": "Tổng công việc",
    "dash.stat.open": "Đang xử lý",
    "dash.stat.done": "Hoàn thành",
    "dash.stat.overdue": "Quá hạn",
    "dash.sopCount": "việc đang xử lý",

    "col.no": "#",
    "col.title": "Tiêu đề",
    "col.group": "Giai đoạn",
    "col.assignee": "Người phụ trách",
    "col.due": "Hạn",
    "col.status": "Trạng thái",
    "col.action": "Thao tác",

    "tasks.title": "Công việc dự án (đồng bộ qua GitHub Issues)",
    "tasks.newBtn": "+ Giao việc mới",
    "tasks.filterAllSop": "Tất cả giai đoạn",
    "tasks.filterAllAssignee": "Tất cả người phụ trách",
    "tasks.filterAllState": "Tất cả trạng thái",
    "tasks.filterOpen": "Đang xử lý",
    "tasks.filterClosed": "Hoàn thành",
    "tasks.filterOverdue": "Quá hạn",
    "tasks.filterBtn": "Lọc",
    "tasks.notConnected": "Chưa kết nối GitHub — vào tab Cài đặt.",
    "tasks.empty": "Không có công việc phù hợp.",
    "tasks.markDone": "✅ Hoàn thành",
    "tasks.reopen": "↩️ Mở lại",

    "status.done": "Hoàn thành",
    "status.overdue": "Quá hạn",
    "status.open": "Đang xử lý",

    "modal.newTask.title": "Giao việc mới",
    "modal.newTask.taskTitle": "Tiêu đề công việc",
    "modal.newTask.project": "Dự án",
    "modal.newTask.sop": "Giai đoạn PMI",
    "modal.newTask.assignee": "Người phụ trách",
    "modal.newTask.noAssignee": "— Không gán —",
    "modal.newTask.due": "Hạn hoàn thành",
    "modal.newTask.desc": "Mô tả",
    "modal.cancel": "Huỷ",
    "modal.newTask.submit": "Tạo công việc",

    "forms.title": "Xuất biểu mẫu Word / Excel theo PMI/PMBOK",
    "forms.desc": "Biểu mẫu quản lý dự án tương ứng 5 nhóm quy trình PMBOK (Khởi tạo, Lập kế hoạch, Thực thi, Giám sát & Kiểm soát, Kết thúc), theo thể thức hành chính Việt Nam. Có thể nạp nhanh dữ liệu từ 1 công việc đã tạo. Nội dung biểu mẫu luôn bằng tiếng Việt.",
    "forms.typeLabel": "Loại biểu mẫu",
    "forms.prefillLabel": "Nạp dữ liệu từ công việc (tuỳ chọn)",
    "forms.noPrefill": "— Không nạp —",
    "forms.download": "⬇️ Tải xuống",
    "forms.phaseLabel": "Giai đoạn PMI",

    "settings.title": "Cài đặt kết nối GitHub",
    "settings.desc": "Dữ liệu công việc được lưu dưới dạng GitHub Issues trên repo dự án. Mỗi người dùng tự nhập Access Token của mình — token chỉ lưu trong trình duyệt của bạn (localStorage), không gửi đi đâu khác ngoài api.github.com.",
    "settings.company": "Tên công ty / dự án (hiển thị trên biểu mẫu)",
    "settings.owner": "Chủ repo (owner)",
    "settings.repo": "Tên repo",
    "settings.token": "Personal Access Token (fine-grained, quyền Issues + Contents: Read & Write)",
    "settings.save": "💾 Lưu & Kết nối",
    "settings.test": "🔌 Kiểm tra kết nối",
    "settings.clear": "🗑️ Xoá token khỏi trình duyệt",
    "settings.help.summary": "Hướng dẫn tạo Personal Access Token (1 lần)",
    "settings.help.1": "Vào GitHub → Settings → Developer settings → Fine-grained tokens → Generate new token.",
    "settings.help.2": "Repository access: chọn đúng repo này (không chọn \"All repositories\").",
    "settings.help.3": "Permissions → chọn \"Read and write\" cho cả Issues và Contents. (Không cần quyền nào khác.)",
    "settings.help.4": "Tạo token, copy và dán vào ô trên. Token chỉ hoạt động cho riêng repo này.",

    "alert.connectFail": "Không kết nối được GitHub:\n{msg}",
    "alert.connectOk": "Kết nối thành công!",
    "alert.confirmClearToken": "Xoá token khỏi trình duyệt này?",
    "alert.needConnect": "Vui lòng kết nối GitHub ở tab Cài đặt trước.",
    "alert.needTitle": "Vui lòng nhập tiêu đề.",
    "alert.createFail": "Không tạo được công việc:\n{msg}",
    "alert.missingFields": "Vui lòng nhập: {fields}",
    "alert.saveFail": "Không lưu được:\n{msg}",

    "sop.1": "1. Khởi tạo (Initiating)",
    "sop.2": "2. Lập kế hoạch (Planning)",
    "sop.3": "3. Thực thi (Executing)",
    "sop.4": "4. Giám sát & Kiểm soát (M&C)",
    "sop.5": "5. Kết thúc (Closing)",
  },
  en: {
    "brand.subtitle": "PMI/PMBOK Project Management",
    "nav.dashboard": "Dashboard",
    "nav.tasks": "Tasks",
    "nav.forms": "Forms",
    "nav.masterdata": "Master Data",
    "nav.exportHistory": "Export History",
    "nav.settings": "Settings",

    "md.cat.projects": "Projects",
    "md.cat.sponsors": "Sponsors / Owners",
    "md.cat.stakeholders": "Stakeholders",
    "md.cat.contractors": "Contractors / Vendors",
    "md.cat.teamMembers": "Project Team Members",
    "md.title": "Shared Master Data (Droplists)",
    "md.desc": "These lists are shared by everyone via the GitHub repo. Add/remove then click \"Save master data\" so everyone sees the update. You can also quick-add a value directly while filling out a form (choose \"+ Add new...\").",
    "md.addNewOption": "+ Add new...",
    "md.newValuePlaceholder": "Enter a new value...",
    "md.addBtn": "+ Add",
    "md.saveAllBtn": "💾 Save master data",
    "md.saveOk": "Saved to GitHub!",
    "md.empty": "(no entries yet)",
    "md.notLoaded": "Loading master data... (connect to GitHub in the Settings tab)",

    "vocab.cat.stakeholderRoles": "Stakeholder roles",
    "vocab.cat.riskLevels": "Levels (High/Med/Low)",
    "vocab.cat.scheduleStatuses": "Schedule status",
    "vocab.cat.costStatuses": "Cost status",
    "vocab.cat.approvalStatuses": "Approval status",
    "vocab.cat.issueStatuses": "Issue status",
    "vocab.cat.contractTypes": "Contract types",
    "vocab.title": "Bilingual term glossaries (Roles, Statuses, Levels...)",
    "vocab.desc": "Used for quick-select fields in forms (stakeholder roles, risk levels, schedule/cost/approval status, contract types...). Type just one language (English or Vietnamese) — for a familiar PMBOK term, the other language will be auto-suggested.",
    "vocab.viPlaceholder": "Vietnamese...",
    "vocab.enPlaceholder": "English...",
    "vocab.autoTranslateHint": "Type one field — for a familiar term, the other will be auto-suggested.",
    "vocab.needVi": "Please enter at least the Vietnamese term.",

    "rowtable.addRow": "Add row",

    "export.title": "Form Export History",
    "export.desc": "Records every form export: who, when, and the file name — shared via GitHub.",
    "export.empty": "No forms exported yet.",
    "export.col.time": "Time",
    "export.col.form": "Form type",
    "export.col.file": "File name",
    "export.col.user": "Exported by",

    "conn.none": "⚪ Not connected",
    "conn.none_goto_settings": "⚪ Not connected — go to Settings",
    "conn.connecting": "🟡 Connecting...",
    "conn.connected": "🟢 Connected: {repo}",
    "conn.error": "🔴 Connection error",

    "dash.title": "Dashboard",
    "dash.refresh": "🔄 Refresh",
    "dash.pmMap": "PMI/PMBOK Process — 5 Process Groups",
    "pmmap.1": "1. Initiating",
    "pmmap.2": "2. Planning",
    "pmmap.3": "3. Executing",
    "pmmap.4": "4. Monitoring & Controlling (continuous, parallel)",
    "pmmap.5": "5. Closing",
    "dash.bySop": "By Project Phase (PMI)",
    "dash.dueSoon": "Due Soon / Overdue",
    "dash.noDue": "No tasks with a due date.",
    "dash.stat.total": "Total Tasks",
    "dash.stat.open": "In Progress",
    "dash.stat.done": "Completed",
    "dash.stat.overdue": "Overdue",
    "dash.sopCount": "task(s) in progress",

    "col.no": "#",
    "col.title": "Title",
    "col.group": "Phase",
    "col.assignee": "Assignee",
    "col.due": "Due",
    "col.status": "Status",
    "col.action": "Action",

    "tasks.title": "Project Tasks (synced via GitHub Issues)",
    "tasks.newBtn": "+ New Task",
    "tasks.filterAllSop": "All phases",
    "tasks.filterAllAssignee": "All assignees",
    "tasks.filterAllState": "All statuses",
    "tasks.filterOpen": "In progress",
    "tasks.filterClosed": "Completed",
    "tasks.filterOverdue": "Overdue",
    "tasks.filterBtn": "Filter",
    "tasks.notConnected": "Not connected to GitHub — go to the Settings tab.",
    "tasks.empty": "No matching tasks.",
    "tasks.markDone": "✅ Complete",
    "tasks.reopen": "↩️ Reopen",

    "status.done": "Completed",
    "status.overdue": "Overdue",
    "status.open": "In progress",

    "modal.newTask.title": "New Task",
    "modal.newTask.taskTitle": "Task title",
    "modal.newTask.project": "Project",
    "modal.newTask.sop": "PMI Phase",
    "modal.newTask.assignee": "Assignee",
    "modal.newTask.noAssignee": "— Unassigned —",
    "modal.newTask.due": "Due date",
    "modal.newTask.desc": "Description",
    "modal.cancel": "Cancel",
    "modal.newTask.submit": "Create Task",

    "forms.title": "Export PMI/PMBOK Word / Excel Forms",
    "forms.desc": "Project management forms mapped to the 5 PMBOK process groups (Initiating, Planning, Executing, Monitoring & Controlling, Closing), in Vietnamese administrative format. You can quick-fill from an existing task. Form content always stays in Vietnamese as required.",
    "forms.typeLabel": "Form type",
    "forms.prefillLabel": "Prefill from a task (optional)",
    "forms.noPrefill": "— None —",
    "forms.download": "⬇️ Download",
    "forms.phaseLabel": "PMI Phase",

    "settings.title": "GitHub Connection Settings",
    "settings.desc": "Task data is stored as GitHub Issues on the project's repo. Each user enters their own Access Token — it is only stored in your own browser (localStorage) and never sent anywhere except api.github.com.",
    "settings.company": "Company / Project name (shown on forms)",
    "settings.owner": "Repo owner",
    "settings.repo": "Repo name",
    "settings.token": "Personal Access Token (fine-grained, Issues + Contents: Read & Write)",
    "settings.save": "💾 Save & Connect",
    "settings.test": "🔌 Test Connection",
    "settings.clear": "🗑️ Remove token from this browser",
    "settings.help.summary": "How to create a Personal Access Token (one-time)",
    "settings.help.1": "Go to GitHub → Settings → Developer settings → Fine-grained tokens → Generate new token.",
    "settings.help.2": "Repository access: select this exact repo (not \"All repositories\").",
    "settings.help.3": "Permissions → set both Issues and Contents to \"Read and write\". (No other permission needed.)",
    "settings.help.4": "Generate the token, copy it, and paste it above. It only works for this repo.",

    "alert.connectFail": "Could not connect to GitHub:\n{msg}",
    "alert.connectOk": "Connected successfully!",
    "alert.confirmClearToken": "Remove the token from this browser?",
    "alert.needConnect": "Please connect to GitHub in the Settings tab first.",
    "alert.needTitle": "Please enter a title.",
    "alert.createFail": "Could not create the task:\n{msg}",
    "alert.missingFields": "Please fill in: {fields}",
    "alert.saveFail": "Could not save:\n{msg}",

    "sop.1": "1. Initiating",
    "sop.2": "2. Planning",
    "sop.3": "3. Executing",
    "sop.4": "4. Monitoring & Controlling",
    "sop.5": "5. Closing",
  },
};

const LANG_KEY = "ysdpm_lang";

function getLang() {
  return localStorage.getItem(LANG_KEY) || "vi";
}
function setLang(lang) {
  localStorage.setItem(LANG_KEY, lang);
  applyStaticTranslations();
  document.querySelectorAll(".lang-btn").forEach((b) => b.classList.toggle("active", b.dataset.lang === lang));
  if (typeof onLangChange === "function") onLangChange();
}
function t(key, vars) {
  const dict = I18N[getLang()] || I18N.vi;
  let s = dict[key] ?? I18N.vi[key] ?? key;
  if (vars) Object.entries(vars).forEach(([k, v]) => { s = s.replace(`{${k}}`, v); });
  return s;
}
function applyStaticTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.title = getLang() === "en" ? "YSD-PM — PMI/PMBOK Project Management" : "YSD-PM — Quản lý Dự án theo PMI/PMBOK";
}
document.addEventListener("DOMContentLoaded", applyStaticTranslations);
