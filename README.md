# Cào tên ở quán trà

Đặt số tên muốn chọn, nhập họ tên mỗi người một dòng, rồi chọn từ 1 đến 3 thẻ mỗi lượt. Ván kết thúc khi mở hết phiếu của lượt đã chọn đủ tên. Dùng chuột hoặc ngón tay cào lớp bạc trên phiếu. Nút **Mở phiếu** hỗ trợ chơi bằng bàn phím.

Khi chưa đủ số tên cần chọn, mỗi phiếu có 65% cơ hội hiện tên một người trong danh sách. Các phiếu còn lại hiện tên ngoài danh sách. Mỗi tên đúng chỉ được gọi một lần trong ván. Nếu có người trùng họ tên, hãy thêm biệt danh để phân biệt. Danh sách được lưu trong trình duyệt.

## Chạy trong môi trường phát triển

Từ thư mục gốc, chạy `python3 -m http.server 8080 --bind 0.0.0.0`, rồi mở trang trên cổng 8080. Dự án dùng HTML, CSS và JavaScript thuần.

## Triển khai trên Coolify

1. Tạo ứng dụng từ kho GitHub và chọn nhánh `main`. Với kho riêng tư, chọn GitHub App hoặc deploy key đã được cấp quyền đọc.
2. Chọn build pack **Dockerfile**. Dùng thư mục gốc `/`, Dockerfile `/Dockerfile` và đặt **Ports Exposes** thành `8080`.
3. Nếu bật health check trong Coolify, đặt đường dẫn `/healthz` và cổng `8080`.
4. Chọn tên miền và bấm **Deploy**. Mở trang qua tên miền vừa chọn, nhập vài tên và thử lật hết thẻ.

Ứng dụng không cần biến môi trường, cơ sở dữ liệu hay volume.
