# YSD-PM — Quản lý Dự án theo PMI/PMBOK

Ứng dụng web quản lý công việc dự án + xuất biểu mẫu Word/Excel theo phương pháp luận **PMI (PMBOK® Guide, 6th Edition)** — 5 Nhóm quy trình × 10 Lĩnh vực kiến thức. Chạy hoàn toàn phía client (không backend, không build step), lưu dữ liệu qua GitHub Issues + Contents API. Có thể host tĩnh trên GitHub Pages.

Ứng dụng song ngữ Việt/Anh cho **giao diện**; nội dung **biểu mẫu xuất ra luôn bằng tiếng Việt** theo đúng thể thức hành chính Việt Nam (quốc hiệu tiêu ngữ, chữ ký các bên).

## Kiến trúc

Không dùng framework, không build step, không thư viện ngoài — HTML/CSS/JS thuần, load trực tiếp qua thẻ `<script>`.

```
YSD-PM/
├── index.html       — shell 1 trang, 6 tab
├── style.css         — design system (biến CSS, layout)
├── i18n.js           — từ điển song ngữ VI/EN cho giao diện
├── github.js         — wrapper gọi GitHub Issues API + Contents API (đọc/ghi JSON)
├── masterdata.js     — danh mục dùng chung (Dự án, Nhà tài trợ, Bên liên quan, Nhà thầu, Thành viên)
├── exportlog.js       — lịch sử xuất biểu mẫu (data/export_log.json), tính số version _vN
├── templates.js       — 16 biểu mẫu PMI/PMBOK, xuất .doc/.xls qua kỹ thuật MSO-HTML
├── app.js             — controller: tabs, dashboard, tasks, forms, settings
└── data/
    ├── masterdata.json    — danh mục dùng chung (đọc/ghi qua GitHub Contents API)
    └── export_log.json    — lịch sử xuất biểu mẫu
```

### Dữ liệu công việc = GitHub Issues

Mỗi công việc (task) là một GitHub Issue thật trên repo. Không có database riêng. Gắn **nhãn (label)** theo 1 trong 5 giai đoạn PMI:

| Label | Nhóm quy trình PMBOK |
|---|---|
| `PM1-KhoiTao` | 1. Khởi tạo (Initiating) |
| `PM2-LapKeHoach` | 2. Lập kế hoạch (Planning) |
| `PM3-ThucThi` | 3. Thực thi (Executing) |
| `PM4-GiamSat` | 4. Giám sát & Kiểm soát (Monitoring & Controlling) |
| `PM5-KetThuc` | 5. Kết thúc (Closing) |

5 nhãn này cần được tạo trước trên repo (Settings → Labels), hoặc tạo qua `gh` CLI:

```bash
gh label create "PM1-KhoiTao" --color 2f8a5a --repo <owner>/<repo>
gh label create "PM2-LapKeHoach" --color 2f6fa5 --repo <owner>/<repo>
gh label create "PM3-ThucThi" --color c47f17 --repo <owner>/<repo>
gh label create "PM4-GiamSat" --color b5493f --repo <owner>/<repo>
gh label create "PM5-KetThuc" --color 5a6b78 --repo <owner>/<repo>
```

Nội dung Issue body theo quy ước có thể phân tích lại bằng regex:
```
**Dự án:** <tên dự án>
**Mô tả:** <mô tả>
**Hạn hoàn thành:** YYYY-MM-DD
**Người giao việc:** @<login>
```

### Danh mục dùng chung & Lịch sử xuất

Lưu tại `data/masterdata.json` và `data/export_log.json`, đọc/ghi qua GitHub Contents API với retry tự động khi gặp lỗi 409 (ghi đè đồng thời). Token cần thêm quyền **Contents: Read and write** ngoài quyền Issues.

### Xuất biểu mẫu Word/Excel — không cần thư viện

`templates.js` build file `.doc`/`.xls` bằng kỹ thuật **MSO-HTML**: HTML được gắn namespace Office (`xmlns:w="urn:schemas-microsoft-com:office:word"` / `xmlns:x="...office:excel"`), đóng gói thành `Blob` với MIME `application/msword` / `application/vnd.ms-excel`. Word/Excel mở được như file thật, không cần docxtemplater/exceljs hay bất kỳ dependency nào — chạy 100% trên trình duyệt tĩnh.

Tên file: `YYYYMMDD-TenBieuMau_vN.ext` (N tự tăng nếu xuất trùng loại trong ngày, tính từ `data/export_log.json`).

## 16 biểu mẫu theo 5 Nhóm quy trình PMBOK

| # | Giai đoạn | Biểu mẫu | Định dạng |
|---|---|---|---|
| 1 | 1. Khởi tạo | Điều lệ dự án (Project Charter) | .doc |
| 2 | 1. Khởi tạo | Đăng ký các bên liên quan (Stakeholder Register) | .xls |
| 3 | 2. Lập kế hoạch | Tóm tắt Kế hoạch quản lý dự án | .doc |
| 4 | 2. Lập kế hoạch | Cấu trúc phân rã công việc (WBS) | .xls |
| 5 | 2. Lập kế hoạch | Kế hoạch tiến độ / Mốc dự án | .xls |
| 6 | 2. Lập kế hoạch | Ước tính & Ngân sách chi phí | .xls |
| 7 | 2. Lập kế hoạch | Sổ đăng ký rủi ro (Risk Register) | .xls |
| 8 | 2. Lập kế hoạch | Kế hoạch truyền thông | .doc |
| 9 | 2. Lập kế hoạch | Kế hoạch mua sắm | .doc |
| 10 | 3. Thực thi | Báo cáo tình trạng dự án | .doc |
| 11 | 3. Thực thi | Biên bản họp dự án | .doc |
| 12 | 4. Giám sát & Kiểm soát | Yêu cầu thay đổi (Change Request) | .doc |
| 13 | 4. Giám sát & Kiểm soát | Báo cáo vấn đề & sai lệch (Issue/Variance Log) | .xls |
| 14 | 5. Kết thúc | Biên bản nghiệm thu & bàn giao | .doc |
| 15 | 5. Kết thúc | Báo cáo tổng kết dự án (Closure Report) | .doc |
| 16 | 5. Kết thúc | Sổ bài học kinh nghiệm (Lessons Learned Register) | .xls |

Để thêm biểu mẫu mới: thêm 1 phần tử vào mảng `FORM_DEFS` trong `templates.js` (gồm `id`, `slug`, `phase` 1-5, `label`/`labelEn`, `kind` "doc"|"xls", `fields[]`, hàm `generate(data, ctx)`).

## Cài đặt & sử dụng

1. Mở `index.html` trực tiếp trong trình duyệt (hoặc host qua GitHub Pages).
2. Vào tab **Cài đặt** → nhập:
   - Tên công ty/dự án (hiển thị trên biểu mẫu)
   - Chủ repo (owner) và Tên repo
   - Personal Access Token (fine-grained) — quyền **Issues: Read & write** và **Contents: Read & write**, giới hạn đúng repo này
3. Bấm **Lưu & Kết nối**.
4. Tab **Công việc**: giao việc mới, gắn giai đoạn PMI + dự án + người phụ trách + hạn.
5. Tab **Biểu mẫu**: chọn giai đoạn PMI → chọn loại biểu mẫu → điền (có thể nạp nhanh từ 1 công việc) → Tải xuống.
6. Tab **Danh mục**: quản lý droplist Dự án / Nhà tài trợ / Bên liên quan / Nhà thầu / Thành viên đội dự án, dùng chung cho mọi người qua GitHub.

Token chỉ lưu trong `localStorage` trình duyệt của từng người dùng, không commit vào repo, không gửi đi đâu ngoài `api.github.com`.

## Giới hạn

- Đây là công cụ nội bộ hỗ trợ vận hành, không thay thế phần mềm PMIS/ERP chuyên nghiệp.
- File `.doc`/`.xls` xuất ra là HTML được Word/Excel nhận diện (kỹ thuật MSO-HTML), không phải OOXML nhị phân thật — mở tốt trong Microsoft Word/Excel, có thể hiển thị cảnh báo "định dạng khác" ở một số phần mềm đọc file khác (LibreOffice vẫn mở được).
- Khung PMBOK sử dụng là 6th Edition (5 nhóm quy trình × 10 lĩnh vực kiến thức); các bản 7th/8th Edition dùng mô hình nguyên tắc/hiệu suất khác, không áp dụng ở đây.
