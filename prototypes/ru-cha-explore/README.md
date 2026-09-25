# Rú Chá Explore — static prototypes

| File | Nội dung |
|---|---|
| `index.html` | v1: bản đồ fullscreen, nền ảnh vệ tinh grayscale (giữ lại để so sánh) |
| `dashboard.html` | **v2**: màn hình dashboard, card "Mô hình rừng 2.5D" + KPI + thành phần loài + nguồn dữ liệu |

Mở trực tiếp file trong Chrome (cần Internet để tải MapLibre). Không cần build. Dữ liệu được nạp qua các file `data/*.js`, nên trang chạy được cả khi mở bằng `file://`.

## v2: có gì
- Nền ngữ cảnh dạng **vector** (đầm phá, sông, đường, nhà, bãi cát), tô theo design tokens. Vùng nhìn bị khóa trong hộp khoảng 1.2 km, zoom 15.5–19.5. Nút **Ảnh thật** bật ảnh Esri grayscale.
- Khóm cây dựng khối theo chiều cao thật (×1). Có thanh phóng đại chiều cao, khi phóng đại thì hiện badge cảnh báo.
- Các trạng thái của khóm: xám → hover (màu loài) → click để ghim popover → khi lọc loài thì các khóm khác mờ đi. Viền liền nghĩa là đã xác minh (`confidence ≥ 0.7`), viền đứt nghĩa là chưa xác minh.
- **Thanh mực nước triều**: nước dâng trong vùng rừng, KPI "Khóm đang ngập" cập nhật theo.
- **Linked highlighting**: hover loài trong biểu đồ thì các khóm đó sáng trên map; hover khóm trên map thì dòng loài tương ứng sáng lên. Click dòng loài để giữ bộ lọc.
- Ctrl/⌘ + cuộn để zoom (không chiếm thao tác cuộn trang). Nút **Mở rộng** chuyển sang fullscreen. Có dark mode.

## Dữ liệu
| File | Nguồn | Trạng thái |
|---|---|---|
| `data/patches.demo.{geojson,js}` | `scripts/generate-demo-patches.mjs` | **Giả lập**, theo schema `vegetation_patches` (docs/feasibility.md §8.2) |
| `data/context.{geojson,js}` | `scripts/fetch-osm-context.mjs` | OSM thật. **Chưa có trong repo**: khi thiếu file này, trang dùng nền placeholder vẽ tay và ghi rõ trên badge |

Tải nền OSM thật (chạy trên máy có Internet):
```bash
cd prototypes/ru-cha-explore
npm install
node scripts/fetch-osm-context.mjs --center=<lng>,<lat>   # mặc định 107.5935,16.5485 (ước lượng, chưa kiểm chứng)
node scripts/generate-demo-patches.mjs --center=<lng>,<lat>
```

Thay bằng dữ liệu thật: khoanh các khóm trong QGIS trên orthomosaic, export GeoJSON (EPSG:4326) với các trường `fid, id, species_id, height_m, crown_diameter_m, area_m2, ground_m, source, confidence, ...`, rồi bọc thành `window.RUCHA_PATCHES = …` giống file demo.

## Tham số URL
- `?center=lng,lat`: dịch các khóm demo đến tọa độ đã hiệu chỉnh.
