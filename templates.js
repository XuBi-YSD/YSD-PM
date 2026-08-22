/**
 * Xuất biểu mẫu Word (.doc) / Excel (.xls) quản lý dự án theo PMI/PMBOK,
 * trình bày theo thể thức hành chính Việt Nam.
 * Kỹ thuật: HTML được Word/Excel nhận diện qua namespace "mso" — không cần thư viện ngoài,
 * chạy được 100% trên trình duyệt / GitHub Pages tĩnh.
 *
 * Tên file xuất ra theo quy ước: YYYYMMDD-NoiDung_vN.ext (N tự tăng nếu xuất
 * trùng loại biểu mẫu trong cùng ngày — xem exportlog.js).
 *
 * Mỗi FORM_DEFS.phase (1-5) ứng với 1 trong 5 Nhóm quy trình PMBOK:
 * 1 Khởi tạo · 2 Lập kế hoạch · 3 Thực thi · 4 Giám sát & Kiểm soát · 5 Kết thúc
 */

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function nl2br(s) {
  return escapeHtml(s).replace(/\n/g, "<br/>");
}

function downloadBlob(filename, mime, content) {
  const blob = new Blob(["﻿" + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function downloadDoc(filename, bodyHtml) {
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>Document</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->
<style>
  @page { size: 21cm 29.7cm; margin: 2cm 2cm 2cm 2.5cm; }
  body { font-family: 'Times New Roman', Times, serif; font-size: 13pt; line-height: 1.35; }
  table { border-collapse: collapse; width: 100%; }
  td, th { padding: 4px 6px; vertical-align: top; }
  .center { text-align: center; }
  .right { text-align: right; }
  .bold { font-weight: bold; }
  .italic { font-style: italic; }
  .small { font-size: 11pt; }
  .qh { font-weight: bold; font-size: 13pt; text-align:center; }
  .title { font-weight: bold; font-size: 16pt; text-align: center; text-transform: uppercase; margin: 18px 0 6px; }
  .subtitle { text-align: center; font-size: 12pt; margin: 0 0 14px; }
  .sig-table td { text-align: center; width: 33%; }
  .reg-table td, .reg-table th { border: 1px solid #333; }
</style>
</head>
<body>${bodyHtml}</body></html>`;
  downloadBlob(filename, "application/msword", html);
}

function downloadXls(filename, sheetName, bodyHtml) {
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8">
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
<x:Name>${escapeHtml(sheetName)}</x:Name>
<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
<style>
  body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; }
  table { border-collapse: collapse; }
  td, th { border: 1px solid #999; padding: 4px 8px; }
  th { background: #2f6fa5; color: #fff; }
  .title { font-weight: bold; font-size: 14pt; }
  .center { text-align: center; }
</style>
</head>
<body>${bodyHtml}</body></html>`;
  downloadBlob(filename, "application/vnd.ms-excel", html);
}

function vnHeader(companyName, formCode) {
  return `
  <table style="border:none;">
    <tr>
      <td style="border:none; width:50%;">
        <div class="bold">${escapeHtml(companyName || "[TÊN CÔNG TY / DỰ ÁN]")}</div>
        <div class="small">Số: ${escapeHtml(formCode || "..........")}</div>
      </td>
      <td style="border:none; width:50%; text-align:center;">
        <div class="qh">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
        <div class="bold">Độc lập - Tự do - Hạnh phúc</div>
        <div class="small italic">-----------------</div>
      </td>
    </tr>
  </table>`;
}

function vnDateLine(city) {
  const d = new Date();
  return `<p class="right italic">${escapeHtml(city || "......")}, ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}</p>`;
}

function signatureBlock(roles) {
  const tds = roles.map((r) => `<td><div class="bold">${escapeHtml(r)}</div><div class="italic small">(Ký, ghi rõ họ tên)</div><br/><br/><br/></td>`).join("");
  return `<table class="sig-table" style="margin-top:24px;"><tr>${tds}</tr></table>`;
}

function fieldLine(label, value, unit) {
  if (!value) return "";
  return `<p><span class="bold">${escapeHtml(label)}:</span> ${escapeHtml(value)}${unit ? " " + escapeHtml(unit) : ""}</p>`;
}

/** Turn an array of row objects (from a dynamic rowtable field) into <tr> HTML for a register table. */
function objRowsToTr(rows, columns) {
  return (rows || []).map((row) => `<tr>${columns.map((c) => `<td>${escapeHtml(row[c.key] || "")}</td>`).join("")}</tr>`).join("");
}

// ---------------------------------------------------------------------------
// FORM DEFINITIONS — theo 5 Nhóm quy trình PMBOK
// Field types: text | textarea | select | date | droplist (source: projects|sponsors|stakeholders|contractors|teamMembers)
// ---------------------------------------------------------------------------
const FORM_DEFS = [

  // ===================== 1. KHỞI TẠO (INITIATING) =====================
  {
    id: "project_charter",
    slug: "DieuLeDuAn",
    phase: 1,
    label: "Điều lệ dự án (Project Charter)",
    labelEn: "Project Charter",
    kind: "doc",
    fields: [
      { key: "project", label: "Tên dự án", labelEn: "Project name", type: "droplist", source: "projects", required: true },
      { key: "sponsor", label: "Nhà tài trợ / Chủ đầu tư", labelEn: "Sponsor / Owner", type: "droplist", source: "sponsors", required: true },
      { key: "pm", label: "Giám đốc dự án (PM) được chỉ định", labelEn: "Assigned Project Manager", type: "droplist", source: "teamMembers", required: true },
      { key: "purpose", label: "Mục đích / Lý do dự án", labelEn: "Purpose / Justification", type: "textarea", full: true, required: true },
      { key: "objectives", label: "Mục tiêu đo lường được", labelEn: "Measurable objectives", type: "textarea", full: true },
      { key: "scope", label: "Mô tả phạm vi cấp cao", labelEn: "High-level scope description", type: "textarea", full: true },
      { key: "milestones", label: "Mốc thời gian tổng quát", labelEn: "Summary milestones", type: "textarea", full: true },
      { key: "budget", label: "Ngân sách tổng quát (VNĐ)", labelEn: "Summary budget (VND)", type: "text" },
      { key: "risks", label: "Rủi ro cấp cao", labelEn: "High-level risks", type: "textarea", full: true },
      { key: "successCriteria", label: "Tiêu chí thành công / phê duyệt", labelEn: "Success / approval criteria", type: "textarea", full: true },
    ],
    generate(d, ctx) {
      const body = `
        ${vnHeader(ctx.company, ctx.formCode)}
        <div class="title">Điều lệ dự án</div>
        <div class="subtitle italic">Project Charter</div>
        ${fieldLine("Tên dự án", d.project)}
        ${fieldLine("Nhà tài trợ / Chủ đầu tư", d.sponsor)}
        ${fieldLine("Giám đốc dự án (PM)", d.pm)}
        <p class="bold">Mục đích / Lý do dự án:</p><p>${nl2br(d.purpose)}</p>
        <p class="bold">Mục tiêu đo lường được:</p><p>${nl2br(d.objectives)}</p>
        <p class="bold">Mô tả phạm vi cấp cao:</p><p>${nl2br(d.scope)}</p>
        <p class="bold">Mốc thời gian tổng quát:</p><p>${nl2br(d.milestones)}</p>
        ${fieldLine("Ngân sách tổng quát", d.budget, "VNĐ")}
        <p class="bold">Rủi ro cấp cao:</p><p>${nl2br(d.risks)}</p>
        <p class="bold">Tiêu chí thành công / phê duyệt:</p><p>${nl2br(d.successCriteria)}</p>
        ${vnDateLine()}
        ${signatureBlock(["Người lập (PM)", "Nhà tài trợ phê duyệt (Sponsor)"])}
      `;
      downloadDoc(ctx.fileName, body);
    },
  },
  {
    id: "stakeholder_register",
    slug: "DangKyBenLienQuan",
    phase: 1,
    label: "Đăng ký các bên liên quan (Stakeholder Register)",
    labelEn: "Stakeholder Register",
    kind: "xls",
    fields: [
      { key: "project", label: "Dự án", labelEn: "Project", type: "droplist", source: "projects", required: true },
      { key: "compiledBy", label: "Người lập", labelEn: "Compiled by", type: "droplist", source: "teamMembers" },
      { key: "rows", label: "Danh sách các bên liên quan", labelEn: "Stakeholder list", type: "rowtable", full: true, required: true, columns: [
        { key: "name", label: "Tên", labelEn: "Name", type: "text" },
        { key: "role", label: "Vai trò", labelEn: "Role", type: "bilingual-droplist", source: "stakeholderRoles" },
        { key: "power", label: "Quyền lực", labelEn: "Power", type: "vocab-select", source: "riskLevels" },
        { key: "interest", label: "Quan tâm", labelEn: "Interest", type: "vocab-select", source: "riskLevels" },
        { key: "expectation", label: "Kỳ vọng chính", labelEn: "Key expectation", type: "text" },
      ] },
    ],
    generate(d, ctx) {
      const cols = [{ key: "name" }, { key: "role" }, { key: "power" }, { key: "interest" }, { key: "expectation" }];
      const rows = objRowsToTr(d.rows, cols);
      const body = `
        <p class="title">${escapeHtml(ctx.company)}</p>
        <p class="title">ĐĂNG KÝ CÁC BÊN LIÊN QUAN</p>
        <p>Dự án: <b>${escapeHtml(d.project)}</b> &nbsp;&nbsp; Người lập: <b>${escapeHtml(d.compiledBy)}</b></p>
        <table>
          <tr><th>Tên</th><th>Vai trò</th><th>Quyền lực (H/M/L)</th><th>Quan tâm (H/M/L)</th><th>Kỳ vọng chính</th></tr>
          ${rows}
        </table>
      `;
      downloadXls(ctx.fileName, "StakeholderRegister", body);
    },
  },

  // ===================== 2. LẬP KẾ HOẠCH (PLANNING) =====================
  {
    id: "pm_plan_summary",
    slug: "TomTatKeHoachQLDA",
    phase: 2,
    label: "Tóm tắt Kế hoạch quản lý dự án",
    labelEn: "PM Plan Summary",
    kind: "doc",
    fields: [
      { key: "project", label: "Dự án", labelEn: "Project", type: "droplist", source: "projects", required: true },
      { key: "pm", label: "Giám đốc dự án (PM)", labelEn: "Project Manager", type: "droplist", source: "teamMembers" },
      { key: "scopeSummary", label: "Tóm tắt Phạm vi (Scope Baseline)", labelEn: "Scope summary", type: "textarea", full: true },
      { key: "scheduleSummary", label: "Tóm tắt Tiến độ (Schedule Baseline)", labelEn: "Schedule summary", type: "textarea", full: true },
      { key: "costSummary", label: "Tóm tắt Chi phí (Cost Baseline)", labelEn: "Cost summary", type: "textarea", full: true },
      { key: "qualitySummary", label: "Tóm tắt Chất lượng", labelEn: "Quality summary", type: "textarea", full: true },
      { key: "resourceSummary", label: "Tóm tắt Nguồn lực", labelEn: "Resource summary", type: "textarea", full: true },
      { key: "riskSummary", label: "Tóm tắt Rủi ro", labelEn: "Risk summary", type: "textarea", full: true },
      { key: "approvedBy", label: "Người phê duyệt", labelEn: "Approved by", type: "droplist", source: "sponsors" },
    ],
    generate(d, ctx) {
      const body = `
        ${vnHeader(ctx.company, ctx.formCode)}
        <div class="title">Tóm tắt Kế hoạch quản lý dự án</div>
        <div class="subtitle italic">Project Management Plan — Summary</div>
        ${fieldLine("Dự án", d.project)}
        ${fieldLine("Giám đốc dự án (PM)", d.pm)}
        <p class="bold">Phạm vi (Scope Baseline):</p><p>${nl2br(d.scopeSummary)}</p>
        <p class="bold">Tiến độ (Schedule Baseline):</p><p>${nl2br(d.scheduleSummary)}</p>
        <p class="bold">Chi phí (Cost Baseline):</p><p>${nl2br(d.costSummary)}</p>
        <p class="bold">Chất lượng:</p><p>${nl2br(d.qualitySummary)}</p>
        <p class="bold">Nguồn lực:</p><p>${nl2br(d.resourceSummary)}</p>
        <p class="bold">Rủi ro:</p><p>${nl2br(d.riskSummary)}</p>
        ${fieldLine("Người phê duyệt", d.approvedBy)}
        ${vnDateLine()}
        ${signatureBlock(["Người lập (PM)", "Phê duyệt (Sponsor)"])}
      `;
      downloadDoc(ctx.fileName, body);
    },
  },
  {
    id: "wbs",
    slug: "CauTrucPhanRaCongViec",
    phase: 2,
    label: "Cấu trúc phân rã công việc (WBS)",
    labelEn: "Work Breakdown Structure (WBS)",
    kind: "xls",
    fields: [
      { key: "project", label: "Dự án", labelEn: "Project", type: "droplist", source: "projects", required: true },
      { key: "preparedBy", label: "Người lập", labelEn: "Prepared by", type: "droplist", source: "teamMembers" },
      { key: "rows", label: "Danh sách gói công việc (WBS)", labelEn: "Work package list", type: "rowtable", full: true, required: true, columns: [
        { key: "code", label: "Mã WBS", labelEn: "WBS code", type: "text", placeholder: "vd: 3.1.1" },
        { key: "name", label: "Tên công việc / Gói công việc", labelEn: "Work package name", type: "text" },
        { key: "owner", label: "Người phụ trách", labelEn: "Owner", type: "droplist", source: "teamMembers" },
        { key: "notes", label: "Ghi chú", labelEn: "Notes", type: "text" },
      ] },
    ],
    generate(d, ctx) {
      const cols = [{ key: "code" }, { key: "name" }, { key: "owner" }, { key: "notes" }];
      const rows = objRowsToTr(d.rows, cols);
      const body = `
        <p class="title">${escapeHtml(ctx.company)}</p>
        <p class="title">CẤU TRÚC PHÂN RÃ CÔNG VIỆC (WBS)</p>
        <p>Dự án: <b>${escapeHtml(d.project)}</b> &nbsp;&nbsp; Người lập: <b>${escapeHtml(d.preparedBy)}</b></p>
        <table>
          <tr><th>Mã WBS</th><th>Tên công việc / Gói công việc</th><th>Người phụ trách</th><th>Ghi chú</th></tr>
          ${rows}
        </table>
      `;
      downloadXls(ctx.fileName, "WBS", body);
    },
  },
  {
    id: "schedule_plan",
    slug: "KeHoachTienDo",
    phase: 2,
    label: "Kế hoạch tiến độ / Mốc dự án",
    labelEn: "Schedule / Milestone Plan",
    kind: "xls",
    fields: [
      { key: "project", label: "Dự án", labelEn: "Project", type: "droplist", source: "projects", required: true },
      { key: "preparedBy", label: "Người lập", labelEn: "Prepared by", type: "droplist", source: "teamMembers" },
      { key: "rows", label: "Danh sách mốc / hoạt động", labelEn: "Milestone / activity list", type: "rowtable", full: true, required: true, columns: [
        { key: "milestone", label: "Tên mốc / hoạt động", labelEn: "Milestone / activity", type: "text" },
        { key: "startDate", label: "Ngày bắt đầu", labelEn: "Start date", type: "date" },
        { key: "endDate", label: "Ngày kết thúc", labelEn: "End date", type: "date" },
        { key: "owner", label: "Người phụ trách", labelEn: "Owner", type: "droplist", source: "teamMembers" },
      ] },
    ],
    generate(d, ctx) {
      const cols = [{ key: "milestone" }, { key: "startDate" }, { key: "endDate" }, { key: "owner" }];
      const rows = objRowsToTr(d.rows, cols);
      const body = `
        <p class="title">${escapeHtml(ctx.company)}</p>
        <p class="title">KẾ HOẠCH TIẾN ĐỘ / MỐC DỰ ÁN</p>
        <p>Dự án: <b>${escapeHtml(d.project)}</b> &nbsp;&nbsp; Người lập: <b>${escapeHtml(d.preparedBy)}</b></p>
        <table>
          <tr><th>Tên mốc / hoạt động</th><th>Ngày bắt đầu</th><th>Ngày kết thúc</th><th>Người phụ trách</th></tr>
          ${rows}
        </table>
      `;
      downloadXls(ctx.fileName, "Schedule", body);
    },
  },
  {
    id: "cost_budget",
    slug: "UocTinhNganSach",
    phase: 2,
    label: "Ước tính & Ngân sách chi phí",
    labelEn: "Cost Estimate & Budget",
    kind: "xls",
    fields: [
      { key: "project", label: "Dự án", labelEn: "Project", type: "droplist", source: "projects", required: true },
      { key: "preparedBy", label: "Người lập", labelEn: "Prepared by", type: "droplist", source: "teamMembers" },
      { key: "rows", label: "Danh sách hạng mục chi phí", labelEn: "Cost item list", type: "rowtable", full: true, required: true, columns: [
        { key: "item", label: "Hạng mục", labelEn: "Item", type: "text" },
        { key: "unit", label: "Đơn vị", labelEn: "Unit", type: "text" },
        { key: "qty", label: "Số lượng", labelEn: "Qty", type: "text" },
        { key: "unitPrice", label: "Đơn giá (VNĐ)", labelEn: "Unit price (VND)", type: "text" },
        { key: "total", label: "Thành tiền (VNĐ)", labelEn: "Total (VND)", type: "text" },
      ] },
    ],
    generate(d, ctx) {
      const cols = [{ key: "item" }, { key: "unit" }, { key: "qty" }, { key: "unitPrice" }, { key: "total" }];
      const rows = objRowsToTr(d.rows, cols);
      const body = `
        <p class="title">${escapeHtml(ctx.company)}</p>
        <p class="title">ƯỚC TÍNH &amp; NGÂN SÁCH CHI PHÍ</p>
        <p>Dự án: <b>${escapeHtml(d.project)}</b> &nbsp;&nbsp; Người lập: <b>${escapeHtml(d.preparedBy)}</b></p>
        <table>
          <tr><th>Hạng mục</th><th>Đơn vị</th><th>Số lượng</th><th>Đơn giá (VNĐ)</th><th>Thành tiền (VNĐ)</th></tr>
          ${rows}
        </table>
      `;
      downloadXls(ctx.fileName, "Budget", body);
    },
  },
  {
    id: "risk_register",
    slug: "SoDangKyRuiRo",
    phase: 2,
    label: "Sổ đăng ký rủi ro (Risk Register)",
    labelEn: "Risk Register",
    kind: "xls",
    fields: [
      { key: "project", label: "Dự án", labelEn: "Project", type: "droplist", source: "projects", required: true },
      { key: "preparedBy", label: "Người lập", labelEn: "Prepared by", type: "droplist", source: "teamMembers" },
      { key: "rows", label: "Danh sách rủi ro", labelEn: "Risk list", type: "rowtable", full: true, required: true, columns: [
        { key: "description", label: "Mô tả rủi ro", labelEn: "Risk description", type: "text" },
        { key: "likelihood", label: "Khả năng", labelEn: "Likelihood", type: "vocab-select", source: "riskLevels" },
        { key: "impact", label: "Tác động", labelEn: "Impact", type: "vocab-select", source: "riskLevels" },
        { key: "response", label: "Biện pháp ứng phó", labelEn: "Response", type: "text" },
        { key: "owner", label: "Người phụ trách", labelEn: "Owner", type: "droplist", source: "teamMembers" },
      ] },
    ],
    generate(d, ctx) {
      const cols = [{ key: "description" }, { key: "likelihood" }, { key: "impact" }, { key: "response" }, { key: "owner" }];
      const rows = objRowsToTr(d.rows, cols);
      const body = `
        <p class="title">${escapeHtml(ctx.company)}</p>
        <p class="title">SỔ ĐĂNG KÝ RỦI RO</p>
        <p>Dự án: <b>${escapeHtml(d.project)}</b> &nbsp;&nbsp; Người lập: <b>${escapeHtml(d.preparedBy)}</b></p>
        <table>
          <tr><th>Mô tả rủi ro</th><th>Khả năng (H/M/L)</th><th>Tác động (H/M/L)</th><th>Biện pháp ứng phó</th><th>Người phụ trách</th></tr>
          ${rows}
        </table>
      `;
      downloadXls(ctx.fileName, "RiskRegister", body);
    },
  },
  {
    id: "communications_plan",
    slug: "KeHoachTruyenThong",
    phase: 2,
    label: "Kế hoạch truyền thông",
    labelEn: "Communications Plan",
    kind: "doc",
    fields: [
      { key: "project", label: "Dự án", labelEn: "Project", type: "droplist", source: "projects", required: true },
      { key: "preparedBy", label: "Người lập", labelEn: "Prepared by", type: "droplist", source: "teamMembers" },
      { key: "rows", label: "Bảng truyền thông", labelEn: "Communications table", type: "rowtable", full: true, required: true, columns: [
        { key: "audience", label: "Đối tượng", labelEn: "Audience", type: "text" },
        { key: "content", label: "Nội dung", labelEn: "Content", type: "text" },
        { key: "frequency", label: "Tần suất", labelEn: "Frequency", type: "text" },
        { key: "channel", label: "Kênh", labelEn: "Channel", type: "text" },
        { key: "owner", label: "Người phụ trách", labelEn: "Owner", type: "droplist", source: "teamMembers" },
      ] },
    ],
    generate(d, ctx) {
      const cols = [{ key: "audience" }, { key: "content" }, { key: "frequency" }, { key: "channel" }, { key: "owner" }];
      const rows = objRowsToTr(d.rows, cols).replace(/<td>/g, '<td style="border:1px solid #999;">');
      const body = `
        ${vnHeader(ctx.company, ctx.formCode)}
        <div class="title">Kế hoạch truyền thông</div>
        <div class="subtitle italic">Communications Management Plan</div>
        ${fieldLine("Dự án", d.project)}
        ${fieldLine("Người lập", d.preparedBy)}
        <table class="reg-table" style="margin-top:10px;">
          <tr><th style="border:1px solid #999;">Đối tượng</th><th style="border:1px solid #999;">Nội dung</th><th style="border:1px solid #999;">Tần suất</th><th style="border:1px solid #999;">Kênh</th><th style="border:1px solid #999;">Người phụ trách</th></tr>
          ${rows}
        </table>
        ${vnDateLine()}
        ${signatureBlock(["Người lập (PM)"])}
      `;
      downloadDoc(ctx.fileName, body);
    },
  },
  {
    id: "procurement_plan",
    slug: "KeHoachMuaSam",
    phase: 2,
    label: "Kế hoạch mua sắm",
    labelEn: "Procurement Plan",
    kind: "doc",
    fields: [
      { key: "project", label: "Dự án", labelEn: "Project", type: "droplist", source: "projects", required: true },
      { key: "preparedBy", label: "Người lập", labelEn: "Prepared by", type: "droplist", source: "teamMembers" },
      { key: "rows", label: "Danh sách hạng mục mua sắm", labelEn: "Procurement item list", type: "rowtable", full: true, required: true, columns: [
        { key: "item", label: "Hạng mục", labelEn: "Item", type: "text" },
        { key: "contractType", label: "Loại hợp đồng", labelEn: "Contract type", type: "bilingual-droplist", source: "contractTypes" },
        { key: "vendor", label: "Nhà cung cấp dự kiến", labelEn: "Prospective vendor", type: "droplist", source: "contractors" },
        { key: "neededBy", label: "Thời gian cần", labelEn: "Needed by", type: "date" },
      ] },
    ],
    generate(d, ctx) {
      const cols = [{ key: "item" }, { key: "contractType" }, { key: "vendor" }, { key: "neededBy" }];
      const rows = objRowsToTr(d.rows, cols).replace(/<td>/g, '<td style="border:1px solid #999;">');
      const body = `
        ${vnHeader(ctx.company, ctx.formCode)}
        <div class="title">Kế hoạch mua sắm</div>
        <div class="subtitle italic">Procurement Management Plan</div>
        ${fieldLine("Dự án", d.project)}
        ${fieldLine("Người lập", d.preparedBy)}
        <table class="reg-table" style="margin-top:10px;">
          <tr><th style="border:1px solid #999;">Hạng mục</th><th style="border:1px solid #999;">Loại hợp đồng</th><th style="border:1px solid #999;">Nhà cung cấp dự kiến</th><th style="border:1px solid #999;">Thời gian cần</th></tr>
          ${rows}
        </table>
        ${vnDateLine()}
        ${signatureBlock(["Người lập (PM)", "Phê duyệt (Sponsor)"])}
      `;
      downloadDoc(ctx.fileName, body);
    },
  },

  // ===================== 3. THỰC THI (EXECUTING) =====================
  {
    id: "status_report",
    slug: "BaoCaoTinhTrangDuAn",
    phase: 3,
    label: "Báo cáo tình trạng dự án",
    labelEn: "Project Status Report",
    kind: "doc",
    fields: [
      { key: "project", label: "Dự án", labelEn: "Project", type: "droplist", source: "projects", required: true },
      { key: "reportPeriod", label: "Kỳ báo cáo", labelEn: "Reporting period", type: "text", placeholder: "vd: Tuần 34 (18-24/08/2026)", required: true },
      { key: "reportedBy", label: "Người báo cáo", labelEn: "Reported by", type: "droplist", source: "teamMembers" },
      { key: "progressSummary", label: "Tóm tắt tiến độ thực hiện", labelEn: "Progress summary", type: "textarea", full: true, required: true },
      { key: "scheduleStatus", label: "Tình trạng tiến độ", labelEn: "Schedule status", type: "bilingual-droplist", source: "scheduleStatuses" },
      { key: "costStatus", label: "Tình trạng chi phí", labelEn: "Cost status", type: "bilingual-droplist", source: "costStatuses" },
      { key: "keyIssues", label: "Vấn đề / rủi ro nổi bật", labelEn: "Key issues / risks", type: "textarea", full: true },
      { key: "nextSteps", label: "Kế hoạch kỳ tới", labelEn: "Next steps", type: "textarea", full: true },
    ],
    generate(d, ctx) {
      const body = `
        ${vnHeader(ctx.company, ctx.formCode)}
        <div class="title">Báo cáo tình trạng dự án</div>
        <div class="subtitle italic">Project Status Report</div>
        ${fieldLine("Dự án", d.project)}
        ${fieldLine("Kỳ báo cáo", d.reportPeriod)}
        ${fieldLine("Người báo cáo", d.reportedBy)}
        ${fieldLine("Tình trạng tiến độ", d.scheduleStatus)}
        ${fieldLine("Tình trạng chi phí", d.costStatus)}
        <p class="bold">Tóm tắt tiến độ thực hiện:</p><p>${nl2br(d.progressSummary)}</p>
        <p class="bold">Vấn đề / rủi ro nổi bật:</p><p>${nl2br(d.keyIssues)}</p>
        <p class="bold">Kế hoạch kỳ tới:</p><p>${nl2br(d.nextSteps)}</p>
        ${vnDateLine()}
        ${signatureBlock(["Người báo cáo (PM)", "Người nhận báo cáo (Sponsor)"])}
      `;
      downloadDoc(ctx.fileName, body);
    },
  },
  {
    id: "meeting_minutes",
    slug: "BienBanHopDuAn",
    phase: 3,
    label: "Biên bản họp dự án",
    labelEn: "Project Meeting Minutes",
    kind: "doc",
    fields: [
      { key: "project", label: "Dự án", labelEn: "Project", type: "droplist", source: "projects", required: true },
      { key: "topic", label: "Nội dung cuộc họp", labelEn: "Meeting topic", type: "text", required: true },
      { key: "attendees", label: "Thành phần tham dự", labelEn: "Attendees", type: "textarea", full: true },
      { key: "content", label: "Nội dung / Kết luận", labelEn: "Content / Conclusion", type: "textarea", full: true, required: true },
      { key: "actionItems", label: "Việc cần làm tiếp theo (Action items)", labelEn: "Action items", type: "textarea", full: true },
    ],
    generate(d, ctx) {
      const body = `
        ${vnHeader(ctx.company, ctx.formCode)}
        <div class="title">Biên bản họp dự án</div>
        ${fieldLine("Dự án", d.project)}
        ${fieldLine("Nội dung cuộc họp", d.topic)}
        <p class="bold">Thành phần tham dự:</p><p>${nl2br(d.attendees)}</p>
        <p class="bold">Nội dung / Kết luận:</p><p>${nl2br(d.content)}</p>
        <p class="bold">Việc cần làm tiếp theo:</p><p>${nl2br(d.actionItems)}</p>
        ${vnDateLine()}
        ${signatureBlock(["Người ghi biên bản", "Chủ trì cuộc họp (PM)"])}
      `;
      downloadDoc(ctx.fileName, body);
    },
  },

  // ===================== 4. GIÁM SÁT & KIỂM SOÁT (M&C) =====================
  {
    id: "change_request",
    slug: "YeuCauThayDoi",
    phase: 4,
    label: "Yêu cầu thay đổi (Change Request)",
    labelEn: "Change Request",
    kind: "doc",
    fields: [
      { key: "project", label: "Dự án", labelEn: "Project", type: "droplist", source: "projects", required: true },
      { key: "requestedBy", label: "Người đề xuất", labelEn: "Requested by", type: "droplist", source: "teamMembers", required: true },
      { key: "changeDescription", label: "Mô tả thay đổi đề xuất", labelEn: "Description of proposed change", type: "textarea", full: true, required: true },
      { key: "reason", label: "Lý do thay đổi", labelEn: "Reason for change", type: "textarea", full: true, required: true },
      { key: "impactScope", label: "Tác động đến Phạm vi", labelEn: "Impact on Scope", type: "textarea", full: true },
      { key: "impactSchedule", label: "Tác động đến Tiến độ", labelEn: "Impact on Schedule", type: "text" },
      { key: "impactCost", label: "Tác động đến Chi phí (VNĐ)", labelEn: "Impact on Cost (VND)", type: "text" },
      { key: "approvalStatus", label: "Trạng thái phê duyệt", labelEn: "Approval status", type: "bilingual-droplist", source: "approvalStatuses" },
    ],
    generate(d, ctx) {
      const body = `
        ${vnHeader(ctx.company, ctx.formCode)}
        <div class="title">Yêu cầu thay đổi</div>
        <div class="subtitle italic">Change Request</div>
        ${fieldLine("Dự án", d.project)}
        ${fieldLine("Người đề xuất", d.requestedBy)}
        <p class="bold">Mô tả thay đổi đề xuất:</p><p>${nl2br(d.changeDescription)}</p>
        <p class="bold">Lý do thay đổi:</p><p>${nl2br(d.reason)}</p>
        ${fieldLine("Tác động đến Phạm vi", d.impactScope)}
        ${fieldLine("Tác động đến Tiến độ", d.impactSchedule)}
        ${fieldLine("Tác động đến Chi phí", d.impactCost, "VNĐ")}
        ${fieldLine("Trạng thái phê duyệt", d.approvalStatus)}
        ${vnDateLine()}
        ${signatureBlock(["Người đề xuất", "Giám đốc dự án (PM)", "Ban kiểm soát thay đổi (CCB)"])}
      `;
      downloadDoc(ctx.fileName, body);
    },
  },
  {
    id: "issue_variance_log",
    slug: "BaoCaoVanDeSaiLech",
    phase: 4,
    label: "Báo cáo vấn đề & sai lệch (Issue/Variance Log)",
    labelEn: "Issue & Variance Log",
    kind: "xls",
    fields: [
      { key: "project", label: "Dự án", labelEn: "Project", type: "droplist", source: "projects", required: true },
      { key: "preparedBy", label: "Người lập", labelEn: "Prepared by", type: "droplist", source: "teamMembers" },
      { key: "rows", label: "Danh sách vấn đề & sai lệch", labelEn: "Issue / variance list", type: "rowtable", full: true, required: true, columns: [
        { key: "description", label: "Mô tả vấn đề", labelEn: "Issue description", type: "text" },
        { key: "severity", label: "Mức độ", labelEn: "Severity", type: "vocab-select", source: "riskLevels" },
        { key: "dateFound", label: "Ngày phát hiện", labelEn: "Date found", type: "date" },
        { key: "owner", label: "Người phụ trách", labelEn: "Owner", type: "droplist", source: "teamMembers" },
        { key: "status", label: "Trạng thái", labelEn: "Status", type: "vocab-select", source: "issueStatuses" },
      ] },
    ],
    generate(d, ctx) {
      const cols = [{ key: "description" }, { key: "severity" }, { key: "dateFound" }, { key: "owner" }, { key: "status" }];
      const rows = objRowsToTr(d.rows, cols);
      const body = `
        <p class="title">${escapeHtml(ctx.company)}</p>
        <p class="title">BÁO CÁO VẤN ĐỀ &amp; SAI LỆCH</p>
        <p>Dự án: <b>${escapeHtml(d.project)}</b> &nbsp;&nbsp; Người lập: <b>${escapeHtml(d.preparedBy)}</b></p>
        <table>
          <tr><th>Mô tả vấn đề</th><th>Mức độ (H/M/L)</th><th>Ngày phát hiện</th><th>Người phụ trách</th><th>Trạng thái</th></tr>
          ${rows}
        </table>
      `;
      downloadXls(ctx.fileName, "IssueLog", body);
    },
  },

  // ===================== 5. KẾT THÚC (CLOSING) =====================
  {
    id: "acceptance_record",
    slug: "BienBanNghiemThu",
    phase: 5,
    label: "Biên bản nghiệm thu & bàn giao",
    labelEn: "Acceptance & Handover Record",
    kind: "doc",
    fields: [
      { key: "project", label: "Dự án", labelEn: "Project", type: "droplist", source: "projects", required: true },
      { key: "deliverables", label: "Deliverable / hạng mục nghiệm thu", labelEn: "Deliverables accepted", type: "textarea", full: true, required: true },
      { key: "acceptedBy", label: "Đại diện bên nhận (Chủ đầu tư/Khách hàng)", labelEn: "Accepted by (Owner/Customer)", type: "droplist", source: "stakeholders" },
      { key: "handoverDate", label: "Ngày bàn giao", labelEn: "Handover date", type: "date" },
      { key: "notes", label: "Ghi chú / Punch list còn lại", labelEn: "Notes / Remaining punch list", type: "textarea", full: true },
    ],
    generate(d, ctx) {
      const body = `
        ${vnHeader(ctx.company, ctx.formCode)}
        <div class="title">Biên bản nghiệm thu &amp; bàn giao</div>
        ${fieldLine("Dự án", d.project)}
        <p class="bold">Deliverable / hạng mục nghiệm thu:</p><p>${nl2br(d.deliverables)}</p>
        ${fieldLine("Đại diện bên nhận", d.acceptedBy)}
        ${fieldLine("Ngày bàn giao", d.handoverDate)}
        <p class="bold">Ghi chú / Punch list còn lại:</p><p>${nl2br(d.notes)}</p>
        <p>Hai bên xác nhận đã nghiệm thu và bàn giao đầy đủ nội dung nêu trên.</p>
        ${vnDateLine()}
        ${signatureBlock(["Đại diện bên thực hiện (PM)", "Đại diện bên nhận (Chủ đầu tư)"])}
      `;
      downloadDoc(ctx.fileName, body);
    },
  },
  {
    id: "closure_report",
    slug: "BaoCaoTongKetDuAn",
    phase: 5,
    label: "Báo cáo tổng kết dự án (Closure Report)",
    labelEn: "Project Closure Report",
    kind: "doc",
    fields: [
      { key: "project", label: "Dự án", labelEn: "Project", type: "droplist", source: "projects", required: true },
      { key: "pm", label: "Giám đốc dự án (PM)", labelEn: "Project Manager", type: "droplist", source: "teamMembers" },
      { key: "summary", label: "Tóm tắt kết quả dự án", labelEn: "Project outcome summary", type: "textarea", full: true, required: true },
      { key: "objectivesAchieved", label: "Mục tiêu đạt được so với Điều lệ dự án", labelEn: "Objectives achieved vs. Charter", type: "textarea", full: true },
      { key: "finalBudget", label: "Chi phí thực tế / Ngân sách (VNĐ)", labelEn: "Actual cost / Budget (VND)", type: "text" },
      { key: "finalSchedule", label: "Tiến độ thực tế / Kế hoạch", labelEn: "Actual schedule / Plan", type: "text" },
      { key: "lessonsLearned", label: "Bài học kinh nghiệm chính", labelEn: "Key lessons learned", type: "textarea", full: true },
    ],
    generate(d, ctx) {
      const body = `
        ${vnHeader(ctx.company, ctx.formCode)}
        <div class="title">Báo cáo tổng kết dự án</div>
        <div class="subtitle italic">Project Closure Report</div>
        ${fieldLine("Dự án", d.project)}
        ${fieldLine("Giám đốc dự án (PM)", d.pm)}
        <p class="bold">Tóm tắt kết quả dự án:</p><p>${nl2br(d.summary)}</p>
        <p class="bold">Mục tiêu đạt được so với Điều lệ dự án:</p><p>${nl2br(d.objectivesAchieved)}</p>
        ${fieldLine("Chi phí thực tế / Ngân sách", d.finalBudget, "VNĐ")}
        ${fieldLine("Tiến độ thực tế / Kế hoạch", d.finalSchedule)}
        <p class="bold">Bài học kinh nghiệm chính:</p><p>${nl2br(d.lessonsLearned)}</p>
        ${vnDateLine()}
        ${signatureBlock(["Giám đốc dự án (PM)", "Phê duyệt đóng dự án (Sponsor)"])}
      `;
      downloadDoc(ctx.fileName, body);
    },
  },
  {
    id: "lessons_learned",
    slug: "SoBaiHocKinhNghiem",
    phase: 5,
    label: "Sổ bài học kinh nghiệm (Lessons Learned Register)",
    labelEn: "Lessons Learned Register",
    kind: "xls",
    fields: [
      { key: "project", label: "Dự án", labelEn: "Project", type: "droplist", source: "projects", required: true },
      { key: "preparedBy", label: "Người lập", labelEn: "Prepared by", type: "droplist", source: "teamMembers" },
      { key: "rows", label: "Danh sách bài học kinh nghiệm", labelEn: "Lessons learned list", type: "rowtable", full: true, required: true, columns: [
        { key: "area", label: "Lĩnh vực / Hạng mục", labelEn: "Area", type: "text" },
        { key: "whatHappened", label: "Điều làm tốt / chưa tốt", labelEn: "What went well / poorly", type: "text" },
        { key: "suggestion", label: "Đề xuất cải tiến", labelEn: "Improvement suggestion", type: "text" },
      ] },
    ],
    generate(d, ctx) {
      const cols = [{ key: "area" }, { key: "whatHappened" }, { key: "suggestion" }];
      const rows = objRowsToTr(d.rows, cols);
      const body = `
        <p class="title">${escapeHtml(ctx.company)}</p>
        <p class="title">SỔ BÀI HỌC KINH NGHIỆM</p>
        <p>Dự án: <b>${escapeHtml(d.project)}</b> &nbsp;&nbsp; Người lập: <b>${escapeHtml(d.preparedBy)}</b></p>
        <table>
          <tr><th>Lĩnh vực / Hạng mục</th><th>Điều làm tốt / chưa tốt</th><th>Đề xuất cải tiến</th></tr>
          ${rows}
        </table>
      `;
      downloadXls(ctx.fileName, "LessonsLearned", body);
    },
  },
];
