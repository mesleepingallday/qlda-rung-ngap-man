# Đánh giá khả thi — Mangrove Management & Classification System (Huế)

## Context
Ngày: 2026-09-25. Giai đoạn hiện tại: **đánh giá khả thi**, chưa viết code.
Mục tiêu: xác định phần nào của ý tưởng làm được thật, phần nào là giả định sai, và thu hẹp scope thành một đề tài bảo vệ được.

## 1. Câu hỏi gốc: ta đang giải bài toán gì?
"Người không chuyên khó phân biệt các loài ngập mặn" → đây là bài toán **nhận dạng loài ở mức cây (tại hiện trường)**.
Ảnh vệ tinh giải bài toán khác: **bản đồ phân bố theo vùng (mức pixel 10–30 m)**. Hai bài toán cần tách riêng.

## 2. Ba mức "classification" — khả thi đến đâu
| Mức | Mô tả | Dữ liệu miễn phí (S2/Landsat) | Đánh giá |
|---|---|---|---|
| L1 | Mangrove vs non-mangrove (extent) | Sentinel-2 10 m, Landsat 30 m | **Khả thi**, nhiều tài liệu, có baseline Global Mangrove Watch |
| L2 | Vùng quần xã / loài ưu thế | S2 + dữ liệu thực địa có nhãn | **Khả thi một phần**, độ chính xác trung bình, cần ground truth |
| L3 | Từng loài / từng cây | Cần ảnh <1 m (UAV, WorldView) hoặc hyperspectral | **Không khả thi** với dữ liệu miễn phí |

Lý do L3 thất bại: 1 pixel S2 = 10×10 m = 100 m², chứa nhiều cây của nhiều loài (mixed pixel); quần xã hỗn giao chính là trường hợp khó nhất.

## 3. Rủi ro / giả định cần kiểm chứng
- **Diện tích rừng ngập mặn ở Huế rất nhỏ, phân mảnh** (vd. Rú Chá – Hương Phong chỉ vài ha; các khu trồng ở đầm phá Tam Giang–Cầu Hai). *Giả định, cần kiểm chứng số liệu.* Vài ha ≈ vài trăm pixel S2 → quá ít để huấn luyện/đánh giá phân loại loài.
- **Mây mùa mưa miền Trung (≈ T9–T12)** → ít ảnh quang học sạch; có thể cần composite nhiều tháng hoặc Sentinel-1 (SAR).
- **Thủy triều / mặt nước đầm phá** làm nhiễu phổ.
- **Không có ground truth** (điểm GPS + loài) → không thể báo cáo độ chính xác → yếu về mặt học thuật.
- **Google Earth Engine**: miễn phí cho mục đích phi thương mại nhưng cần đăng ký Cloud project; gọi GEE trực tiếp từ web app thêm phức tạp (service account, quota). Google Earth (ảnh nền) **không** phải dữ liệu phân tích được.
- **Chuyên môn sinh học**: danh mục loài, đặc điểm nhận dạng phải có nguồn khoa học / chuyên gia xác nhận.

## 4. Đề xuất scope (thực tế, bảo vệ được)
1. **Web GIS**: bản đồ vùng rừng ngập mặn Huế, lớp ảnh Sentinel-2 (true color, NDVI), lớp extent.
2. **Bản đồ extent + biến động (L1)**: xử lý **offline** trong GEE → export GeoTIFF/COG/GeoJSON → web chỉ hiển thị. Đánh giá bằng điểm kiểm chứng (ảnh độ phân giải cao + GMW).
3. **Nhận dạng loài cho người không chuyên**: **khóa định loại tương tác** (interactive identification key) dựa trên hình thái (lá, rễ, hoa, trụ mầm). Rule-based, minh bạch, không cần ML — trực tiếp giải bài toán gốc.
4. **Knowledge base loài** + quản lý khu vực/quan sát (SQLite).
5. *(Tùy chọn)* L2 nếu có dữ liệu thực địa; L3 nêu rõ là **limitation / future work** (UAV).

Stack: Nuxt + TypeScript + SQLite (geometry lưu GeoJSON; SpatiaLite nếu cần truy vấn không gian) + MapLibre/Leaflet; deploy VPS hoặc PaaS. Nặng xử lý ảnh nằm ngoài web app.

## 5. Bước tiếp theo (Phase 0, chưa code)
1. Tìm 3–5 bài báo: mangrove mapping Sentinel-2 ở Việt Nam; mangrove Thừa Thiên Huế (diện tích, loài).
2. Xác nhận danh mục loài & vị trí khu rừng tại Huế (nguồn khoa học / chuyên gia ĐH Khoa học Huế).
3. Mở GEE, xem thử ảnh S2 + GMW tại Rú Chá: đếm số pixel, số ảnh không mây/năm.
4. Viết 1 trang problem statement + research questions + scope in/out.

## 6. Cập nhật sau khi có câu trả lời (3 tháng, 1 người, cân bằng SE + research)
- **Google Earth trong MVP**: chỉ dùng làm **tham chiếu trực quan** và để **gán nhãn điểm kiểm chứng thủ công** (cách làm phổ biến trong các bài báo). Không dùng làm đầu vào phân loại: ảnh chỉ có RGB, không có NIR (không tính được NDVI), không hiệu chỉnh bức xạ, ngày chụp và nguồn ảnh không đồng nhất. Điều khoản sử dụng của Google cấm trích xuất dữ liệu hay tạo dataset phái sinh, cũng cấm tự host tile của Google. Trên web: dùng basemap có giấy phép rõ ràng (Esri World Imagery hoặc Sentinel-2 cloudless của EOX) kèm attribution.
- **Ảnh của giảng viên**: dùng cho knowledge base và khóa định loại (hình thái loài). Cần hỏi rõ: ảnh chụp cây/lá hay ảnh UAV/flycam? Nếu là UAV có tọa độ thì dùng làm ground truth rất giá trị. Cần xin phép sử dụng và ghi nguồn.
- **Scope chốt cho 3 tháng**:
  1. Web GIS (Nuxt + SQLite + MapLibre): khu vực, lớp Sentinel-2/NDVI, lớp extent.
  2. Khóa định loại tương tác + knowledge base loài (dùng ảnh của giảng viên).
  3. Thí nghiệm nhỏ (phần research): phân loại extent L1 bằng Random Forest trong GEE trên Sentinel-2. Đánh giá bằng khoảng 100–200 điểm kiểm chứng gán nhãn từ ảnh độ phân giải cao, so sánh với Global Mangrove Watch. Báo cáo confusion matrix, OA, F1.
  4. Không làm: L2/L3, upload ảnh để AI nhận dạng, gọi GEE realtime từ web.
- **Timeline gợi ý**: Tuần 1–2 Phase 0 (tài liệu, GEE thử nghiệm, problem statement) · Tuần 3–6 thí nghiệm L1 + export · Tuần 5–10 web app · Tuần 11–12 đánh giá, viết báo cáo, deploy.

## Verification (cho giai đoạn đánh giá)
Khả thi được xác nhận khi: (a) có số liệu diện tích/loài có trích dẫn, (b) GEE cho thấy đủ ảnh sạch và extent nhìn thấy được ở 10 m, (c) có nguồn nhãn để đánh giá độ chính xác L1.
