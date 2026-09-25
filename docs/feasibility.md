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

## 7. Ý tưởng mới: màn hình "Explore" với bản đồ xám, hover để hiện màu loài
Mô tả: bản đồ/ảnh dải ven biển hiển thị grayscale. Khi hover vào một vùng nhỏ, vùng đó hiện màu của loài và một popover thông tin xuất hiện gần con trỏ.

**Câu hỏi then chốt: màu loài của từng vùng lấy từ đâu?** Mục 2 đã kết luận vệ tinh không cho ra được loài (L3). Vì vậy vùng màu phải đến từ một trong hai nguồn:
- (A) **Dữ liệu thật**: polygon khoanh vẽ thủ công từ ảnh flycam hoặc điểm thực địa của giảng viên. Chỉ làm được nếu ảnh có tọa độ.
- (B) **Mô phỏng mang tính giáo dục**: sơ đồ phân tầng sinh thái (zonation) theo tài liệu, ví dụ loài tiên phong phía biển, rồi vùng giữa, rồi vùng phía đất liền. Không gắn tọa độ thật.
- Rủi ro học thuật: nếu trình bày (B) như bản đồ thật thì là **sai lệch dữ liệu**. Bắt buộc gắn nhãn "Minh họa" và trích nguồn.

**Đề xuất ban đầu** (đã được thay bằng mục 7.1): MVP làm (B) dưới dạng SVG tương tác.

**Ghi chú UX/kỹ thuật**
- Dùng **popover/tooltip**, không dùng modal (modal chặn thao tác). Đặt lệch khỏi con trỏ, tự đổi phía khi gần mép màn hình.
- Mobile không có hover: tap để mở, tap ra ngoài để đóng.
- Cần thêm **legend + nút "hiện tất cả màu"**. Nếu chỉ hover thì người dùng không thấy được bức tranh phân bố tổng thể.
- Accessibility: điều hướng được bằng bàn phím (focus = hover), palette an toàn với người mù màu, không chỉ dựa vào màu.
- (A): basemap raster áp CSS `grayscale`, polygon `fill-opacity: 0`, đổi thành màu khi hover qua `feature-state`, popup từ properties `species_id`.
- Dữ liệu: bảng `species` (SQLite) + file `zones.geojson`/SVG gồm các vùng có `species_id`. Popover lấy thông tin qua API `/api/species/:id`.

### 7.1 Cập nhật: người dùng cần độ chân thực, nhìn từ trên cao, dạng "2D nổi" (2.5D)
Độ chân thực gồm 2 lớp, mỗi lớp cần nguồn dữ liệu riêng:
1. **Địa hình (đường bờ, đầm phá, sông, cồn cát)**: lấy từ dữ liệu thật. Dùng OpenStreetMap (ODbL, cần attribution) và ảnh Sentinel-2. **Không vẽ lại (trace) từ Google Earth** vì vi phạm điều khoản sử dụng.
2. **Vùng loài**: chỉ "thật" khi có dữ liệu có tọa độ (ảnh flycam hoặc GPS của giảng viên). Trong lúc chờ thì dùng *demo data*, gắn nhãn rõ ràng. Tuyệt đối không trình bày vùng giả định như dữ liệu thật.

**Lựa chọn công nghệ (đề xuất)**: **MapLibre GL JS**, không dùng Three.js ở MVP.
- Có sẵn tọa độ thật, zoom/pan, hover/popup, tile raster (Sentinel-2 grayscale), hillshade từ DEM (Copernicus GLO-30) và `fill-extrusion` cho hiệu ứng "nổi". Sau này thay demo zones bằng dữ liệu thật mà không phải viết lại.
- Three.js: đẹp và "wow" hơn, nhưng phải tự làm projection, raycasting để hover, và tối ưu hiệu năng. Tốn ước tính 3–4 tuần trong quỹ 12 tuần. Để lại làm stretch goal.
- SVG: nhẹ nhưng khó giữ độ chân thực theo tọa độ thật.
- Lưu ý: vùng ven biển Huế gần như **phẳng**, nên hiệu ứng nổi từ DEM rất yếu. Cảm giác "nổi" chủ yếu đến từ extrusion tán cây (chiều cao ước lượng theo loài). Nếu phóng đại chiều cao thì phải ghi chú là đã phóng đại.

**Cấu trúc layer**: basemap Sentinel-2 grayscale → hillshade → `mangrove_extent` (kết quả L1, dữ liệu thật) → `species_zones` (fill-extrusion, màu xám, hover bật màu loài qua `feature-state`) → popover (component Vue, bám theo con trỏ).

**Việc cần làm trước khi code màn hình này**: hỏi giảng viên về tọa độ và orthomosaic; chọn 1 khu thử nghiệm nhỏ (vd. Rú Chá); dựng prototype tĩnh 1 trang để thử cảm giác UX.

## Verification (cho giai đoạn đánh giá)
Khả thi được xác nhận khi: (a) có số liệu diện tích/loài có trích dẫn, (b) GEE cho thấy đủ ảnh sạch và extent nhìn thấy được ở 10 m, (c) có nguồn nhãn để đánh giá độ chính xác L1.
