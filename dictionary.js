/**
 * Từ điển thuật ngữ PMI/PMBOK song ngữ Anh–Việt, tổng hợp từ bộ tài liệu đào tạo
 * 5 phần đi kèm dự án này. Dùng để:
 *  1) Gieo sẵn (seed) các droplist thuật ngữ dùng chung (data/vocab.json).
 *  2) Tự động gợi ý dịch sang ngôn ngữ còn lại khi người dùng chỉ điền 1 ngôn ngữ
 *     lúc thêm mới một mục vào droplist ("+ Thêm mới...").
 * Đây là tra cứu OFFLINE theo từ điển có sẵn (không gọi dịch máy/API bên ngoài) —
 * giữ đúng triết lý zero-dependency, zero-backend của app. Thuật ngữ không có
 * trong từ điển sẽ không tự dịch được — người dùng cần tự điền cả 2 ngôn ngữ.
 */
const PMBOK_DICTIONARY = [
  // ---- Stakeholder roles / Vai trò các bên liên quan ----
  { en: "Owner / Client", vi: "Chủ đầu tư" },
  { en: "Sponsor", vi: "Nhà tài trợ" },
  { en: "Project Management Board", vi: "Ban Quản lý dự án" },
  { en: "Project Manager", vi: "Giám đốc dự án" },
  { en: "Construction Contractor", vi: "Nhà thầu thi công" },
  { en: "Subcontractor", vi: "Nhà thầu phụ" },
  { en: "Design Consultant", vi: "Tư vấn thiết kế" },
  { en: "Supervision Consultant", vi: "Tư vấn giám sát" },
  { en: "Government Authority", vi: "Cơ quan quản lý nhà nước" },
  { en: "Material Supplier", vi: "Nhà cung cấp vật tư" },
  { en: "Affected Community", vi: "Cộng đồng bị ảnh hưởng" },
  { en: "Operator", vi: "Đơn vị vận hành" },
  { en: "Funding Agency", vi: "Đơn vị tài trợ vốn" },
  { en: "Quality Assurance Team", vi: "Đội đảm bảo chất lượng" },
  { en: "Safety Officer", vi: "Cán bộ an toàn lao động" },

  // ---- Risk / Power / Interest levels — Mức độ rủi ro/quyền lực/quan tâm ----
  { en: "High", vi: "Cao" },
  { en: "Medium", vi: "Trung bình" },
  { en: "Low", vi: "Thấp" },

  // ---- Schedule & cost status — Trạng thái tiến độ & chi phí ----
  { en: "On Schedule", vi: "Đúng tiến độ" },
  { en: "Behind Schedule", vi: "Chậm tiến độ" },
  { en: "Ahead of Schedule", vi: "Vượt tiến độ" },
  { en: "Within Budget", vi: "Trong ngân sách" },
  { en: "Over Budget", vi: "Vượt ngân sách" },
  { en: "Under Budget", vi: "Dưới ngân sách" },

  // ---- Approval status — Trạng thái phê duyệt ----
  { en: "Pending Approval (CCB)", vi: "Chờ duyệt (CCB)" },
  { en: "Approved", vi: "Đã duyệt" },
  { en: "Rejected", vi: "Từ chối" },
  { en: "Conditionally Approved", vi: "Duyệt có điều kiện" },
  { en: "Deferred", vi: "Hoãn xem xét" },

  // ---- Contract types — Loại hợp đồng mua sắm ----
  { en: "Firm Fixed Price (FFP)", vi: "Giá cố định trọn gói (FFP)" },
  { en: "Cost Plus Fixed Fee (CPFF)", vi: "Hoàn phí cộng phí cố định (CPFF)" },
  { en: "Cost Plus Incentive Fee (CPIF)", vi: "Hoàn phí cộng phí thưởng (CPIF)" },
  { en: "Time & Material (T&M)", vi: "Theo thời gian & vật tư (T&M)" },

  // ---- Issue / variance status — Trạng thái vấn đề & sai lệch ----
  { en: "Open", vi: "Đang mở" },
  { en: "In Progress", vi: "Đang xử lý" },
  { en: "Resolved", vi: "Đã xử lý" },
  { en: "Closed", vi: "Đã đóng" },
  { en: "Escalated", vi: "Đã leo thang" },

  // ---- 7 Basic Quality Tools — 7 công cụ chất lượng cơ bản ----
  { en: "Cause-and-Effect (Fishbone) Diagram", vi: "Biểu đồ nhân quả (Xương cá)" },
  { en: "Flowchart", vi: "Lưu đồ" },
  { en: "Checksheet", vi: "Bảng kiểm" },
  { en: "Pareto Chart", vi: "Biểu đồ Pareto" },
  { en: "Histogram", vi: "Biểu đồ tần suất" },
  { en: "Control Chart", vi: "Biểu đồ kiểm soát" },
  { en: "Scatter Diagram", vi: "Biểu đồ phân tán" },

  // ---- Leadership styles — Phong cách lãnh đạo ----
  { en: "Directive", vi: "Chỉ đạo" },
  { en: "Servant Leadership", vi: "Lãnh đạo phục vụ" },
  { en: "Transactional", vi: "Giao dịch" },
  { en: "Transformational", vi: "Chuyển đổi" },
  { en: "Laissez-Faire", vi: "Buông lỏng" },

  // ---- Conflict resolution modes — Chế độ giải quyết xung đột ----
  { en: "Withdraw / Avoid", vi: "Né tránh" },
  { en: "Smooth / Accommodate", vi: "Xoa dịu" },
  { en: "Compromise", vi: "Thoả hiệp" },
  { en: "Force / Direct", vi: "Áp đặt" },
  { en: "Collaborate / Problem Solve", vi: "Hợp tác / Giải quyết vấn đề" },

  // ---- RACI roles — Vai trò RACI ----
  { en: "Responsible", vi: "Người thực hiện" },
  { en: "Accountable", vi: "Người chịu trách nhiệm" },
  { en: "Consulted", vi: "Người được hỏi ý kiến" },
  { en: "Informed", vi: "Người được thông báo" },

  // ---- Organizational structures — Cơ cấu tổ chức ----
  { en: "Functional", vi: "Chức năng" },
  { en: "Weak Matrix", vi: "Ma trận yếu" },
  { en: "Balanced Matrix", vi: "Ma trận cân bằng" },
  { en: "Strong Matrix", vi: "Ma trận mạnh" },
  { en: "Projectized", vi: "Dự án hoá" },

  // ---- PMO types — Loại PMO ----
  { en: "Supportive PMO", vi: "PMO Hỗ trợ" },
  { en: "Controlling PMO", vi: "PMO Kiểm soát" },
  { en: "Directive PMO", vi: "PMO Chỉ đạo" },

  // ---- PMI phases (also used as task labels) — Giai đoạn PMI ----
  { en: "Initiating", vi: "Khởi tạo" },
  { en: "Planning", vi: "Lập kế hoạch" },
  { en: "Executing", vi: "Thực thi" },
  { en: "Monitoring & Controlling", vi: "Giám sát & Kiểm soát" },
  { en: "Closing", vi: "Kết thúc" },

  // ---- PMI Code of Ethics values — Giá trị đạo đức PMI ----
  { en: "Responsibility", vi: "Trách nhiệm" },
  { en: "Respect", vi: "Tôn trọng" },
  { en: "Fairness", vi: "Công bằng" },
  { en: "Honesty", vi: "Trung thực" },
];

/** Chuẩn hoá chuỗi để so khớp không phân biệt hoa/thường, khoảng trắng dư. */
function _normalize(s) {
  return String(s || "").trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Tra từ điển offline để tự động điền ngôn ngữ còn lại.
 * @param {string} text - Giá trị người dùng đã nhập.
 * @param {"en"|"vi"} fromLang - Ngôn ngữ của `text`.
 * @returns {string} Bản dịch nếu tìm thấy trong từ điển, ngược lại trả về "".
 */
function translateTerm(text, fromLang) {
  const needle = _normalize(text);
  if (!needle) return "";
  const toLang = fromLang === "en" ? "vi" : "en";
  const hit = PMBOK_DICTIONARY.find((pair) => _normalize(pair[fromLang]) === needle);
  return hit ? hit[toLang] : "";
}
