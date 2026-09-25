# Rú Chá Explore — static prototype

Prototype 1 trang cho màn hình "Explore" (xem `docs/feasibility.md`, mục 7.1): bản đồ 2.5D, nền ảnh grayscale, các khóm cây dựng khối xám, hover/tap để hiện màu loài và popover thông tin.

## Chạy
Mở trực tiếp `index.html` trong trình duyệt (cần Internet để tải MapLibre từ unpkg và tile ảnh nền). Không cần build.

## Tham số URL
- `?center=lng,lat`: tâm khu demo. Mặc định `107.5935,16.5485` là **tọa độ ước lượng, chưa kiểm chứng**. Chuột phải lên ảnh nền để lấy tọa độ thật của khu rừng, rồi truyền vào đây.
- `?bearing=deg`: hướng phân tầng từ mép nước vào đất liền.

## Đâu là thật, đâu là demo
| Thành phần | Trạng thái |
|---|---|
| Ảnh nền Esri World Imagery / Sentinel-2 cloudless (EOX) | Dữ liệu thật, có attribution. S2 cloudless: CC BY-NC-SA 4.0, chỉ dùng phi thương mại |
| Vị trí, hình dạng, loài của từng khóm cây (`buildDemoZones`) | **Giả lập** (seeded random + quy luật phân tầng giả định) |
| Danh sách loài, chiều cao, mô tả (`SPECIES`) | **Cần giảng viên xác nhận** |

Khi có dữ liệu thật: thay `buildDemoZones()` bằng một file `zones.geojson` gồm các polygon có `species` và `height`. Các phần còn lại giữ nguyên.
