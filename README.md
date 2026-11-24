# Đến lượt ai?

Trò chơi gọi tên ngẫu nhiên bằng cách lật thẻ. Nhập mỗi người chơi trên một dòng. Trong một vòng, mỗi dòng được gọi đúng một lần. Nếu hai người trùng tên, hãy thêm họ hoặc biệt danh để dễ phân biệt. Trình duyệt lưu danh sách trên thiết bị đang dùng.

## Chạy trong môi trường phát triển

Từ thư mục gốc, chạy `python3 -m http.server 8080 --bind 0.0.0.0`, rồi mở trang trên cổng 8080. Dự án dùng HTML, CSS và JavaScript thuần.

## Triển khai trên Coolify

1. Tạo ứng dụng từ kho GitHub và chọn nhánh `main`. Với kho riêng tư, chọn GitHub App hoặc deploy key đã được cấp quyền đọc.
2. Chọn build pack **Dockerfile**. Dùng thư mục gốc `/`, Dockerfile `/Dockerfile` và đặt **Ports Exposes** thành `8080`.
3. Nếu bật health check trong Coolify, đặt đường dẫn `/healthz` và cổng `8080`.
4. Chọn tên miền và bấm **Deploy**. Mở trang qua tên miền vừa chọn, nhập vài tên và thử lật hết thẻ.

Ứng dụng không cần biến môi trường, cơ sở dữ liệu hay volume.
