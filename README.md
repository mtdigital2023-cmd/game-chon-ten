# Cào tên ở quán trà

Đặt số tên muốn chọn, nhập họ tên mỗi người một dòng, rồi chọn nhanh **1**, **3**, **5** hoặc nhập số thẻ mỗi lượt. Game tự chạy qua cảnh quán trà, xé nhãn chai, đặt vé lên bàn, cào từng nhịp từ trái sang phải và công bố kết quả. Khi hết số vé của một lượt mà chưa đủ tên trúng, game chuyển sang lượt mới.

Trước mỗi tên trúng sẽ có ngẫu nhiên từ 0 đến 3 vé trượt mang tên ngoài danh sách. Khi đủ số tên, bảng xếp hạng hiện theo thứ tự trúng. Những người vừa trúng được loại khỏi lượt tiếp theo và có thể được khôi phục ngay trên bảng. Chọn lại số tên và số thẻ, rồi bấm **Cào tiếp**. Bấm Space để tạm dừng hoặc tiếp tục khi đang chiếu. Có nút toàn màn hình trên trình duyệt hỗ trợ và nút bật âm thanh. Mục **Quản lý ván** lưu các danh sách lớp đã đặt tên trên trình duyệt.

## Chạy trong môi trường phát triển

Dùng Node.js 24. Từ thư mục gốc chạy `npm ci`, sau đó `npm run dev` và mở cổng 3000. Tạo bản production bằng `npm run build`. Dockerfile đóng gói Next.js standalone và chạy trên cổng 8080.

## Triển khai trên Coolify

1. Tạo ứng dụng từ kho GitHub và chọn nhánh `main`. Với kho riêng tư, chọn GitHub App hoặc deploy key đã được cấp quyền đọc.
2. Chọn build pack **Dockerfile**. Dùng thư mục gốc `/`, Dockerfile `/Dockerfile` và đặt **Ports Exposes** thành `8080`.
3. Nếu bật health check trong Coolify, đặt đường dẫn `/healthz` và cổng `8080`.
4. Chọn tên miền và bấm **Deploy**. Mở trang qua tên miền vừa chọn, nhập vài tên và xem hết một lượt cào tự động.

Ứng dụng không cần biến môi trường, cơ sở dữ liệu hay volume.
