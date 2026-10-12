# Layout_Agent

> AI Agent chuyển đổi tài liệu SRS thành dự án giao diện Frontend có thể chạy thử bằng Mock Data, với Claude Design hỗ trợ quá trình thiết kế giao diện.

## 1. Giới thiệu dự án

**Layout_Agent** là AI Agent hỗ trợ tự động hóa giai đoạn phân tích yêu cầu và xây dựng giao diện người dùng trong quy trình phát triển phần mềm.

Đầu vào của Agent là tài liệu **SRS (Software Requirements Specification – Đặc tả yêu cầu phần mềm)**. Agent đọc và phân tích tài liệu, trích lọc thông tin quan trọng, chuyển yêu cầu nghiệp vụ thành danh sách trang, thành phần giao diện, luồng thao tác và dữ liệu cần hiển thị. Từ đó, Agent xây dựng một dự án Frontend mô phỏng hệ thống được mô tả trong SRS.

Dự án định hướng sử dụng **Claude Design** để hỗ trợ tạo, chỉnh sửa và hoàn thiện thiết kế giao diện dựa trên đặc tả đã phân tích. Thiết kế sau khi được người dùng xem xét và duyệt sẽ được sử dụng làm cơ sở triển khai Frontend.

Sản phẩm đầu ra tập trung vào **giao diện và trải nghiệm người dùng**. Các trang sử dụng dữ liệu giả lập để người dùng có thể chạy thử, xem bố cục, thao tác với các thành phần và đánh giá luồng sử dụng trước khi tích hợp Backend.

**Lưu ý về trạng thái tích hợp:** Claude Design là một phần trong quy trình mục tiêu của Layout_Agent. Khả năng tự động gửi dữ liệu, nhận thiết kế hoặc đồng bộ mã nguồn phụ thuộc vào cơ chế tích hợp được xác minh và triển khai thực tế. Khi chưa có tích hợp trực tiếp, quy trình có thể sử dụng chuyển giao tài liệu thủ công.

### Mục tiêu chính

- Giảm thời gian đọc, tổng hợp và phân tích tài liệu SRS.
- Chuyển yêu cầu viết bằng ngôn ngữ tự nhiên thành cấu trúc giao diện cụ thể.
- Tạo nhanh bản thiết kế và bản mẫu Frontend nhất quán với yêu cầu đã phân tích.
- Kết hợp Claude Design trong quy trình tạo và hoàn thiện thiết kế giao diện.
- Giúp khách hàng, BA, UI/UX Designer và Developer hình dung sản phẩm sớm.
- Hỗ trợ phát hiện yêu cầu thiếu rõ ràng hoặc luồng nghiệp vụ chưa được mô tả đầy đủ.
- Giữ mối liên hệ giữa yêu cầu nguồn, thiết kế được duyệt và mã nguồn được tạo.
- Tạo nền tảng để đội ngũ phát triển tiếp tục hoàn thiện và tích hợp Backend sau này.

## 2. Vấn đề dự án giải quyết

Trong quy trình phát triển phần mềm truyền thống, đội ngũ thường phải đọc tài liệu SRS, xác định vai trò người dùng, lập danh sách chức năng, phân chia trang, thiết kế luồng tương tác và sau đó mới bắt đầu xây dựng Frontend. Quá trình này tốn thời gian, đặc biệt khi tài liệu dài hoặc yêu cầu chưa được trình bày thống nhất.

Layout_Agent hướng đến rút ngắn quá trình đó bằng một chuỗi xử lý có cấu trúc:

1. Tiếp nhận tài liệu SRS.
2. Phân tích và trích xuất yêu cầu.
3. Chuẩn hóa yêu cầu thành đặc tả giao diện.
4. Xác định sitemap, trang, thành phần và luồng điều hướng.
5. Chuyển đặc tả giao diện sang quy trình thiết kế với Claude Design.
6. Xem xét và duyệt thiết kế.
7. Xây dựng dữ liệu giả lập phù hợp với từng chức năng.
8. Sinh mã nguồn Frontend từ thiết kế và đặc tả đã được duyệt.
9. Kiểm tra khả năng chạy và đối chiếu kết quả với yêu cầu đã trích xuất.

Agent hỗ trợ tăng tốc công việc, nhưng không thay thế hoàn toàn việc xác nhận yêu cầu, đánh giá thiết kế hoặc kiểm thử của con người.

## 3. Phạm vi và nguyên tắc hoạt động

### 3.1. Trong phạm vi

- Tiếp nhận SRS ở định dạng được hệ thống hỗ trợ.
- Đọc và trích xuất yêu cầu chức năng, vai trò người dùng, quy tắc nghiệp vụ và yêu cầu giao diện nếu có.
- Nhóm chức năng thành các module.
- Xác định danh sách trang, cấu trúc điều hướng và mối liên hệ giữa các trang.
- Tạo đặc tả giao diện có cấu trúc để phục vụ thiết kế và sinh mã.
- Sử dụng Claude Design trong quy trình tạo và chỉnh sửa thiết kế khi người dùng có quyền truy cập và phương thức làm việc phù hợp.
- Xác định bố cục trang, thành phần UI và trạng thái hiển thị.
- Tạo Mock Data để mô phỏng danh sách, chi tiết, thống kê và biểu mẫu.
- Xây dựng các tương tác Frontend như tìm kiếm, lọc, phân trang, mở chi tiết, điều hướng, nhập biểu mẫu và hiển thị thông báo.
- Tạo cấu trúc mã nguồn dễ đọc, dễ chỉnh sửa và có thể tiếp tục phát triển.
- Báo cáo những yêu cầu chưa rõ, giả định được sử dụng và chức năng chưa thể mô phỏng.
- Kiểm tra mức độ bao phủ giữa SRS, thiết kế được duyệt và giao diện được triển khai.

### 3.2. Ngoài phạm vi mặc định

- Không xây dựng Backend hoàn chỉnh.
- Không tạo hoặc kết nối cơ sở dữ liệu nghiệp vụ thực tế.
- Không tích hợp API thật nếu chưa được yêu cầu riêng.
- Không xử lý giao dịch, thanh toán hoặc gửi thông báo thật.
- Không triển khai xác thực và phân quyền bảo mật thực tế.
- Không cam kết rằng Mock Data phản ánh dữ liệu thật hoặc mọi quy tắc nghiệp vụ đã được xác minh.
- Không tự ý biến các giả định của Agent thành yêu cầu chính thức.
- Không mặc định Claude Design cung cấp API công khai cho mọi thao tác.
- Không tuyên bố tích hợp tự động với Claude Design nếu cơ chế đó chưa được triển khai và kiểm thử.

Những nội dung ngoài phạm vi có thể được phát triển ở giai đoạn sau, nhưng phải được xác định rõ là phần mở rộng.

### 3.3. Nguyên tắc tích hợp Claude Design

1. **Đặc tả trước, thiết kế sau:** Claude Design nhận đầu vào đã được Layout_Agent phân tích và chuẩn hóa.
2. **Có bước duyệt:** người dùng có thể xem xét và yêu cầu sửa thiết kế trước khi sinh mã nguồn.
3. **Không mất truy vết:** trang và hành vi quan trọng cần liên kết với yêu cầu SRS tương ứng.
4. **Không giả định khả năng tích hợp:** chỉ tự động hóa những thao tác mà phương thức tích hợp thực tế hỗ trợ.
5. **Tách thiết kế khỏi triển khai:** một bản thiết kế không đồng nghĩa với mã nguồn đã được sinh hoặc kiểm thử.
6. **Minh bạch giới hạn:** nếu cần chuyển giao thủ công, hệ thống phải hướng dẫn rõ tài liệu nào cần xuất, chuyển và nhập lại.

## 4. Đối tượng sử dụng

- **Khách hàng / Chủ sản phẩm:** xem trước ý tưởng sản phẩm và phản hồi sớm.
- **Business Analyst (BA):** rà soát yêu cầu, chức năng và các trường hợp còn thiếu.
- **UI/UX Designer:** tham khảo cấu trúc trang, điều hướng và trạng thái tương tác; dùng Claude Design để tạo hoặc hoàn thiện thiết kế.
- **Frontend Developer:** sử dụng thiết kế và mã nguồn khởi tạo làm nền tảng phát triển.
- **Project Manager / Tech Lead:** ước lượng phạm vi giao diện và trao đổi về sản phẩm.
- **Sinh viên / Người nghiên cứu:** tìm hiểu cách chuyển đặc tả phần mềm thành giao diện có thể chạy thử.

## 5. Đầu vào và đầu ra

### 5.1. Đầu vào

Đầu vào cốt lõi là tài liệu SRS. Tùy mức độ hỗ trợ của hệ thống, tài liệu có thể được cung cấp dưới dạng PDF, DOCX, Markdown hoặc văn bản.

SRS nên mô tả càng rõ càng tốt:

- Mục tiêu và phạm vi hệ thống.
- Các nhóm người dùng và quyền hạn dự kiến.
- Danh sách chức năng.
- Luồng chính và luồng ngoại lệ.
- Quy tắc nghiệp vụ.
- Trường dữ liệu cần nhập hoặc hiển thị.
- Yêu cầu giao diện, thiết bị và khả năng sử dụng.
- Các trạng thái của đối tượng nghiệp vụ.
- Ràng buộc và tiêu chí chấp nhận.

Để hỗ trợ thiết kế, người dùng có thể cung cấp thêm:

- Tên thương hiệu và mô tả sản phẩm.
- Logo, màu sắc thương hiệu và kiểu chữ.
- Design system hoặc thư viện component hiện có.
- Hình ảnh tham khảo và ví dụ giao diện mong muốn.
- Quy định thiết kế nội bộ.
- Kích thước màn hình hoặc thiết bị mục tiêu.

Nếu tài liệu không nêu rõ một chi tiết cần thiết, Agent phải ghi nhận đó là **điểm chưa xác định** hoặc đưa ra **giả định có đánh dấu**, thay vì trình bày như thông tin chắc chắn.

### 5.2. Đầu ra

Một lần chạy thành công hướng đến tạo ra:

1. **Bản phân tích SRS:** yêu cầu đã trích xuất, phân loại và liên kết với nguồn trong tài liệu khi có thể.
2. **Danh sách module và trang:** sitemap, mục đích từng trang và vai trò sử dụng.
3. **Đặc tả giao diện:** bố cục, thành phần UI, trường dữ liệu, trạng thái và hành động.
4. **Tài liệu chuyển giao thiết kế:** nội dung đầu vào cho Claude Design, design constraints và tài liệu tham chiếu.
5. **Thiết kế được duyệt:** kết quả thiết kế có thể được chuyển giao theo định dạng thực tế được hỗ trợ.
6. **Mock Data:** dữ liệu minh họa phù hợp với ngữ cảnh nghiệp vụ.
7. **Dự án Frontend:** mã nguồn giao diện, thành phần dùng chung và cấu hình cần thiết.
8. **Báo cáo kết quả:** các chức năng đã tạo, yêu cầu chưa xử lý, giả định và lỗi kiểm tra nếu có.
9. **Hướng dẫn chạy:** lệnh cài đặt và khởi động dự án theo công nghệ thực tế được chọn.

Đây là mục tiêu đầu ra; định dạng và mức độ tự động hóa cụ thể phụ thuộc vào phiên bản triển khai và khả năng tích hợp thực tế.

## 6. Quy trình hoạt động của Agent

### Bước 1 — Tiếp nhận tài liệu

- Nhận file SRS từ người dùng.
- Kiểm tra định dạng, khả năng đọc và nội dung có trích xuất được hay không.
- Xác định tài liệu có bị thiếu trang, lỗi định dạng hoặc thiếu phần quan trọng không.
- Nếu không đọc được tài liệu, báo lỗi và yêu cầu cung cấp phiên bản phù hợp.

### Bước 2 — Phân tích và trích lọc yêu cầu

Agent phân loại nội dung thành các nhóm:

- Yêu cầu chức năng (Functional Requirements).
- Yêu cầu phi chức năng (Non-functional Requirements).
- Vai trò người dùng (Actors / Roles).
- Quy tắc nghiệp vụ (Business Rules).
- Dữ liệu đầu vào và đầu ra.
- Điều kiện, trạng thái và ngoại lệ.
- Yêu cầu giao diện hoặc trải nghiệm người dùng.
- Tiêu chí chấp nhận (Acceptance Criteria), nếu có.

Mỗi yêu cầu nên được chuẩn hóa thành một mục có mã định danh, mô tả ngắn, nguồn tham chiếu và trạng thái xử lý để thuận tiện kiểm tra.

### Bước 3 — Chuẩn hóa thành đặc tả có cấu trúc

Agent chuyển phần văn bản đã phân tích thành dữ liệu trung gian, chẳng hạn:

- Module và chức năng.
- Vai trò được phép thực hiện thao tác.
- Trang liên quan đến chức năng.
- Thành phần giao diện cần có.
- Dữ liệu cần hiển thị hoặc nhập.
- Hành động và kết quả mong đợi.
- Trạng thái bình thường, đang tải, rỗng, thành công và lỗi.
- Các phụ thuộc hoặc điểm chưa rõ.
- Quy tắc thiết kế được cung cấp trong SRS hoặc tài liệu thương hiệu.
- Tiêu chí nghiệm thu giao diện.

Dữ liệu trung gian giúp tách việc hiểu SRS khỏi việc thiết kế và sinh mã giao diện, đồng thời hỗ trợ kiểm tra tính nhất quán.

### Bước 4 — Xây dựng cấu trúc trang và điều hướng

Từ đặc tả, Agent xác định:

- Cây điều hướng hoặc sitemap.
- Trang tổng quan, danh sách, chi tiết, tạo mới và chỉnh sửa khi phù hợp.
- Các layout dùng chung như sidebar, header, breadcrumb và khu vực nội dung.
- Thành phần dùng lại như bảng, thẻ thống kê, bộ lọc, modal, biểu mẫu và thông báo.
- Quan hệ giữa các trang và đường đi để hoàn thành tác vụ.

Agent không nên tạo trang chỉ vì tên chức năng xuất hiện trong tài liệu; mỗi trang cần có mục đích và liên hệ rõ với yêu cầu nguồn.

### Bước 5 — Chuẩn bị đặc tả để thiết kế với Claude Design

Layout_Agent chuẩn bị một gói đầu vào thiết kế, có thể gồm:

- Tổng quan sản phẩm và nhóm người dùng.
- Sitemap và danh sách trang.
- Mục tiêu của từng trang.
- Nội dung và thành phần bắt buộc.
- Luồng tương tác chính.
- Trạng thái giao diện cần thiết.
- Màu sắc, kiểu chữ, logo và quy tắc thương hiệu nếu có.
- Yêu cầu responsive và khả năng tiếp cận.
- Hạn chế thiết kế và tiêu chí nghiệm thu.
- Các câu hỏi còn mở và giả định.

Đặc tả nên phân biệt rõ yêu cầu bắt buộc với đề xuất thiết kế. Không đưa thông tin bí mật hoặc dữ liệu cá nhân không cần thiết vào tài liệu chuyển giao.

### Bước 6 — Tạo và hoàn thiện thiết kế trong Claude Design

Ở giai đoạn MVP, người dùng có thể thực hiện chuyển giao thủ công:

1. Mở Claude Design bằng tài khoản và quyền truy cập phù hợp.
2. Cung cấp đặc tả giao diện cùng tài liệu tham chiếu cần thiết.
3. Yêu cầu tạo hoặc chỉnh sửa thiết kế theo từng nhóm trang hoặc luồng.
4. Kiểm tra bố cục, tính nhất quán, trạng thái và hành vi tương tác.
5. Điều chỉnh thiết kế theo phản hồi của người dùng.
6. Chuyển giao kết quả theo định dạng mà quy trình triển khai có thể sử dụng.

Nếu sau này có phương thức tích hợp tự động được xác minh, Layout_Agent có thể bổ sung lớp tích hợp để quản lý việc gửi đầu vào và tiếp nhận đầu ra. Không được giả định có API hoặc khả năng truy cập tự động nếu chưa xác minh.

### Bước 7 — Duyệt thiết kế

Trước khi sinh mã nguồn, người dùng hoặc người phụ trách sản phẩm cần xem xét:

- Thiết kế có bao phủ các yêu cầu quan trọng không?
- Cấu trúc trang và điều hướng có hợp lý không?
- Các trường dữ liệu và hành động có đúng đặc tả không?
- Thiết kế có tuân thủ quy tắc thương hiệu và design system không?
- Các trạng thái rỗng, lỗi, tải và thành công có được xem xét không?
- Có giả định nào cần xác nhận không?

Nếu phát hiện thay đổi ảnh hưởng đến yêu cầu, cần cập nhật đặc tả trung gian và lưu lại thay đổi trước khi tiếp tục.

### Bước 8 — Thiết kế Mock Data

Agent tạo dữ liệu giả lập phù hợp với từng module, ví dụ:

- Sản phẩm: mã, tên, giá, danh mục và trạng thái.
- Khách hàng: mã, tên, email và thông tin liên hệ giả.
- Đơn hàng: mã đơn, ngày tạo, tổng tiền và trạng thái.
- Nhân viên: mã nhân viên, tên hiển thị và vai trò minh họa.
- Báo cáo: các số liệu tổng hợp được tạo từ dữ liệu giả.

Mock Data cần nhất quán giữa các trang. Ví dụ, một đơn hàng trong bảng danh sách phải có thông tin chi tiết tương ứng; số liệu trên dashboard nên được tính từ cùng tập dữ liệu hoặc được đánh dấu rõ là số liệu minh họa.

**Nguyên tắc dữ liệu:** chỉ dùng dữ liệu tổng hợp hoặc dữ liệu giả. Không đưa dữ liệu cá nhân, bí mật hoặc dữ liệu sản xuất của khách hàng vào bản mẫu. Không trình bày dữ liệu giả như số liệu thực tế.

### Bước 9 — Sinh mã nguồn Frontend

Agent tạo giao diện theo công nghệ và quy ước được dự án lựa chọn. Nếu chưa có quy định, công nghệ mặc định cần được thống nhất trước khi triển khai.

Mã nguồn nên hướng đến:

- Cấu trúc thư mục rõ ràng.
- Thành phần có thể tái sử dụng.
- Tách dữ liệu giả khỏi thành phần hiển thị.
- Đặt tên nhất quán.
- Có trạng thái và phản hồi tương tác dễ hiểu.
- Có bố cục đáp ứng các kích thước màn hình phù hợp.
- Có hướng dẫn cài đặt và chạy dự án.
- Hạn chế phụ thuộc không cần thiết.
- Phù hợp với thiết kế đã được duyệt và đặc tả trung gian.
- Không đưa bí mật hoặc khóa API vào mã nguồn phía Client.

Claude Code có thể được cân nhắc như một công cụ triển khai bổ sung trong quy trình thiết kế–code nếu phù hợp với môi trường và quyền sử dụng. Đây là lựa chọn kiến trúc, không phải điều kiện bắt buộc để Layout_Agent hoạt động.

### Bước 10 — Kiểm tra và đối chiếu

Sau khi sinh mã, Agent nên kiểm tra:

- Cấu trúc mã nguồn và các dependency.
- Khả năng cài đặt, build hoặc khởi động dự án.
- Lỗi cú pháp và lỗi import nếu công cụ kiểm tra hỗ trợ.
- Liên kết điều hướng và tương tác chính.
- Tính nhất quán của Mock Data.
- Độ bao phủ giữa yêu cầu SRS và trang được tạo.
- Mức độ phù hợp giữa thiết kế đã duyệt và giao diện được triển khai.
- Các chức năng chỉ là mô phỏng và các yêu cầu còn thiếu.

Không được tuyên bố đã kiểm thử thành công nếu thực tế chưa chạy kiểm tra tương ứng. Nếu chưa có công cụ so sánh trực quan tự động, phải ghi rõ phần đánh giá thiết kế được thực hiện thủ công hoặc chưa được kiểm tra.

### Bước 11 — Bàn giao

Agent cung cấp:

- Dự án Frontend.
- Hướng dẫn chạy.
- Bản tổng hợp trang và chức năng đã tạo.
- Tài liệu phân tích SRS và đặc tả giao diện.
- Tài liệu hoặc tham chiếu đến thiết kế đã duyệt.
- Danh sách giả định và câu hỏi chưa giải quyết.
- Kết quả kiểm tra và lỗi còn tồn tại.

Người dùng rà soát và phản hồi để tiếp tục chỉnh sửa.

## 7. Kiến trúc logic đề xuất

Có thể tổ chức Layout_Agent thành các thành phần logic sau. Đây là kiến trúc mục tiêu, không khẳng định rằng tất cả đã được hiện thực hóa trong phiên bản hiện tại.

```text
                 ┌────────────────────┐
                 │     SRS Input      │
                 │ PDF / DOCX / Text  │
                 └─────────┬──────────┘
                           │
                           ▼
                 ┌────────────────────┐
                 │  Document Reader   │
                 │ Đọc và trích văn bản│
                 └─────────┬──────────┘
                           │
                           ▼
                 ┌────────────────────┐
                 │    SRS Analyzer    │
                 │ Phân loại yêu cầu  │
                 └─────────┬──────────┘
                           │
                           ▼
                 ┌────────────────────┐
                 │  Requirement Model │
                 │  Đặc tả trung gian │
                 └─────────┬──────────┘
                           │
                           ▼
                 ┌────────────────────┐
                 │ Page / Flow Planner│
                 │ Trang và điều hướng│
                 └─────────┬──────────┘
                           │
                           ▼
                 ┌────────────────────┐
                 │  UI Specification  │
                 │ Đặc tả giao diện   │
                 └─────────┬──────────┘
                           │
                           ▼
                 ┌────────────────────┐
                 │ Claude Design Handoff│
                 │ Chuyển giao thiết kế│
                 └─────────┬──────────┘
                           │
                           ▼
                 ┌────────────────────┐
                 │ Design Review      │
                 │ Người dùng duyệt   │
                 └─────────┬──────────┘
                           │
                ┌──────────┴───────────┐
                ▼                      ▼
       ┌─────────────────┐    ┌─────────────────┐
       │ Mock Data       │    │ Frontend        │
       │ Generator       │───▶│ Generator       │
       └─────────────────┘    └────────┬────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │ Validator /     │
                              │ Checker         │
                              └────────┬────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │ Frontend Project│
                              │ + Report + README│
                              └─────────────────┘
```

### 7.1. Vai trò các thành phần

| Thành phần | Trách nhiệm |
|---|---|
| Document Reader | Đọc file và chuyển nội dung thành văn bản có thể phân tích. |
| SRS Analyzer | Trích xuất yêu cầu, vai trò, quy tắc và dữ liệu. |
| Requirement Model | Lưu đặc tả trung gian có cấu trúc và liên kết nguồn. |
| Page / Flow Planner | Xác định module, trang và điều hướng. |
| UI Specification | Mô tả bố cục, thành phần, trường dữ liệu, trạng thái và tiêu chí nghiệm thu. |
| Claude Design Handoff | Chuẩn bị và quản lý gói tài liệu chuyển giao cho quy trình Claude Design. |
| Design Review | Hỗ trợ người dùng duyệt và phản hồi thiết kế. |
| Mock Data Generator | Tạo dữ liệu giả nhất quán cho các trang. |
| Frontend Generator | Tạo mã nguồn giao diện từ đặc tả và thiết kế đã duyệt. |
| Validator / Checker | Kiểm tra kỹ thuật và đối chiếu yêu cầu với đầu ra. |
| Report Generator | Tổng hợp kết quả, giả định, cảnh báo và hướng dẫn chạy. |

Trong triển khai thực tế, các thành phần này có thể là module trong cùng một ứng dụng, không bắt buộc phải là các dịch vụ độc lập hoặc nhiều AI Agent riêng biệt.

### 7.2. Phương thức tích hợp Claude Design

**Phương án A — Chuyển giao thủ công (khuyến nghị cho MVP)**

- Layout_Agent xuất UI Specification và tài liệu tham chiếu.
- Người dùng đưa các tài liệu này vào Claude Design.
- Người dùng chỉnh sửa và duyệt thiết kế.
- Kết quả thiết kế được chuyển lại cho quy trình Frontend theo định dạng phù hợp.

Ưu điểm: dễ thử nghiệm, ít phụ thuộc vào khả năng tích hợp tự động và giúp kiểm chứng chất lượng đặc tả trước.

**Phương án B — Kết hợp Claude Design và Claude Code**

Có thể cân nhắc dùng Claude Code để làm việc với codebase và triển khai giao diện từ thiết kế. Tùy sản phẩm, tài khoản và quy trình được hỗ trợ, các khả năng như chuyển giao thiết kế hoặc đồng bộ design system có thể được sử dụng. Cần xác minh các chức năng và yêu cầu thực tế trước khi đưa vào quy trình chính thức.

**Phương án C — Tự động hóa trực tiếp**

Chỉ triển khai sau khi xác minh được giao diện tích hợp, cơ chế xác thực, quyền truy cập, định dạng đầu vào/đầu ra, giới hạn sử dụng và điều kiện cấp phép. Không mặc định Claude Design cung cấp API công khai cho mọi thao tác.

## 8. Thiết kế dữ liệu trung gian

Để tăng tính nhất quán và khả năng kiểm tra, Agent nên chuyển SRS thành một mô hình dữ liệu trung gian trước khi sinh mã. Ví dụ minh họa:

```json
{
  "project": {
    "name": "Bakery Store",
    "description": "Website giới thiệu và mô phỏng bán bánh"
  },
  "roles": [
    {
      "id": "customer",
      "name": "Khách hàng"
    }
  ],
  "modules": [
    {
      "id": "products",
      "name": "Sản phẩm",
      "requirements": ["FR-001"],
      "pages": [
        {
          "id": "product-list",
          "name": "Danh sách bánh",
          "route": "/products",
          "components": [
            "ProductCard",
            "SearchBar",
            "CategoryFilter"
          ],
          "mockDataSource": "products",
          "designStatus": "pending"
        }
      ]
    }
  ],
  "designSystem": {
    "brandName": null,
    "colors": [],
    "typography": [],
    "references": []
  },
  "openQuestions": [],
  "assumptions": [],
  "validation": {
    "requirementsReviewed": false,
    "designApproved": false,
    "frontendChecked": false
  }
}
```

Đây chỉ là ví dụ cấu trúc. Schema thực tế cần được định nghĩa, kiểm tra và phiên bản hóa. Các trường trạng thái cần phản ánh đúng quy trình thực tế; không được tự động đặt thành đã duyệt hoặc đã kiểm thử khi chưa có bằng chứng.

## 9. Nguyên tắc xây dựng giao diện

### 9.1. Bám sát tài liệu

Mỗi trang hoặc thành phần quan trọng cần truy ngược được về yêu cầu nguồn. Nếu SRS không mô tả thiết kế cụ thể, Agent có thể chọn một bố cục hợp lý nhưng phải ghi nhận đó là quyết định thiết kế hoặc giả định.

### 9.2. Tính nhất quán

- Dùng chung hệ thống màu sắc, kiểu chữ, khoảng cách và quy tắc hiển thị.
- Dùng lại thành phần có hành vi tương tự.
- Giữ tên trường và trạng thái nhất quán giữa các trang.
- Đảm bảo điều hướng không dẫn đến trang không tồn tại.
- Nếu có design system, ưu tiên tuân thủ design system đó.
- Nếu sử dụng Claude Design, cần kiểm tra tính nhất quán giữa các trang thay vì chỉ đánh giá từng màn hình riêng lẻ.

### 9.3. Khả năng tương tác

Giao diện không nên chỉ là ảnh tĩnh. Trong phạm vi có thể, các nút và biểu mẫu cần phản hồi hợp lý, chẳng hạn:

- Tìm kiếm và lọc trên Mock Data.
- Chuyển trang và phân trang.
- Mở trang chi tiết.
- Thêm, sửa hoặc xóa dữ liệu giả trong bộ nhớ.
- Xác thực biểu mẫu ở phía giao diện.
- Hiển thị trạng thái rỗng, thành công hoặc lỗi mô phỏng.

Các thao tác thay đổi dữ liệu giả không đồng nghĩa với dữ liệu đã được lưu trên máy chủ. Nếu tải lại trang làm mất thay đổi, điều đó cần được nêu rõ; nếu sử dụng lưu trữ cục bộ, cũng phải mô tả chính xác hành vi đó.

### 9.4. Khả năng đáp ứng

Giao diện nên hoạt động hợp lý trên màn hình desktop, tablet và mobile khi phù hợp với loại sản phẩm. Những thành phần như bảng dữ liệu lớn có thể cần cách hiển thị riêng trên màn hình nhỏ.

### 9.5. Khả năng tiếp cận và sử dụng

- Dùng cấu trúc tiêu đề, nhãn trường và thông báo dễ hiểu.
- Đảm bảo trạng thái không chỉ được biểu thị bằng màu sắc.
- Cung cấp trạng thái focus dễ nhận biết khi sử dụng bàn phím.
- Kiểm tra độ tương phản và kích thước vùng tương tác phù hợp.
- Không hy sinh khả năng sử dụng chỉ để giống hình ảnh tham khảo.

### 9.6. Khả năng bảo trì

- Tách layout, page, component, dữ liệu và tiện ích.
- Tránh tạo một tệp quá lớn chứa toàn bộ giao diện.
- Không lặp lại cùng một logic ở nhiều nơi nếu có thể dùng thành phần chung.
- Ưu tiên code rõ ràng và dễ chỉnh sửa hơn là sinh code quá phức tạp.
- Không để mã nguồn phụ thuộc không cần thiết vào định dạng đầu ra riêng của một công cụ thiết kế.

### 9.7. Đối chiếu thiết kế và triển khai

- Thiết kế đã duyệt là căn cứ tham chiếu, nhưng SRS vẫn là nguồn yêu cầu nghiệp vụ chính.
- Nếu thiết kế và SRS mâu thuẫn, ghi nhận xung đột và yêu cầu xác nhận.
- Không tự ý bỏ yêu cầu chỉ vì thiết kế hiện tại chưa thể hiện yêu cầu đó.
- Kiểm tra các trạng thái và luồng tương tác, không chỉ so sánh ảnh chụp màn hình.
- Ghi nhận những khác biệt chưa xử lý giữa thiết kế và mã nguồn.

## 10. Công nghệ đề xuất

Công nghệ chính thức cần được lựa chọn theo yêu cầu triển khai. Một cấu hình tham khảo cho sản phẩm Frontend có thể gồm:

| Hạng mục | Lựa chọn tham khảo | Vai trò |
|---|---|---|
| Ngôn ngữ | TypeScript hoặc JavaScript | Xây dựng logic giao diện. |
| UI Framework | React | Xây dựng trang và thành phần tái sử dụng. |
| Công cụ phát triển | Vite | Khởi động môi trường và build Frontend. |
| Styling | CSS, CSS Modules hoặc utility CSS | Thiết kế bố cục và giao diện. |
| Routing | React Router hoặc giải pháp tương đương | Điều hướng giữa các trang. |
| Mock Data | JSON / TypeScript modules | Cung cấp dữ liệu minh họa. |
| Kiểm tra | ESLint, TypeScript, build scripts và test phù hợp | Phát hiện lỗi mã nguồn. |
| Phân tích SRS | Bộ đọc tài liệu và mô hình AI được lựa chọn | Trích xuất, phân loại và chuẩn hóa yêu cầu. |
| Thiết kế UI | Claude Design, khi có quyền truy cập phù hợp | Hỗ trợ tạo và chỉnh sửa thiết kế. |
| Triển khai code | Frontend Generator; có thể cân nhắc Claude Code | Sinh hoặc hoàn thiện mã nguồn. |

Đây là gợi ý công nghệ, không phải danh sách dependency đã được xác nhận. Không nên chọn thư viện hoặc dịch vụ bên thứ ba trước khi cân nhắc yêu cầu bảo mật, chi phí, quyền riêng tư và khả năng vận hành.

### 10.1. Tích hợp Claude Design

#### Mục đích

Claude Design được sử dụng để hỗ trợ tạo và hoàn thiện thiết kế giao diện từ đặc tả mà Layout_Agent đã phân tích. Công cụ này không thay thế Requirement Model, Mock Data Generator hoặc bộ kiểm tra mã nguồn của Layout_Agent.

#### Phương thức tích hợp

**Phương án A — Chuyển giao thủ công (MVP)**

1. Layout_Agent xuất đặc tả giao diện thành Markdown hoặc định dạng trung gian.
2. Người dùng đưa đặc tả và các tài liệu thiết kế liên quan vào Claude Design.
3. Claude Design hỗ trợ tạo hoặc chỉnh sửa thiết kế.
4. Người dùng duyệt thiết kế và chuyển giao kết quả theo định dạng được quy trình hỗ trợ.
5. Layout_Agent sử dụng kết quả được cung cấp để triển khai và kiểm tra Frontend.

Đây là phương án khởi đầu, không yêu cầu Layout_Agent phải có kết nối lập trình trực tiếp với Claude Design.

**Phương án B — Quy trình Claude Design kết hợp Claude Code**

- Sử dụng Claude Design để tạo và chỉnh sửa thiết kế.
- Sử dụng Claude Code để tiếp nhận thiết kế, làm việc với codebase và triển khai giao diện khi phù hợp.
- Kiểm tra các khả năng chuyển giao thiết kế và đồng bộ design system được hỗ trợ trong môi trường sử dụng.
- Dùng bộ kiểm tra của Layout_Agent để đối chiếu mã nguồn với SRS và thiết kế đã duyệt.

Phương án này có thể giảm thao tác chuyển giao thủ công nhưng cần xác định rõ vai trò của Claude Code trong kiến trúc triển khai. Không coi Claude Code là thành phần bắt buộc.

**Phương án C — Tích hợp tự động**

Chỉ triển khai sau khi xác minh được giao diện tích hợp, cơ chế xác thực, quyền truy cập, định dạng đầu vào và đầu ra, giới hạn sử dụng và điều kiện cấp phép phù hợp.

Không giả định rằng Claude Design cung cấp API công khai cho mọi thao tác. Nếu chưa có cơ chế tích hợp được xác nhận, hệ thống phải sử dụng phương án chuyển giao thủ công hoặc một luồng làm việc được hỗ trợ chính thức.

#### Nguyên tắc kiểm soát

- Thiết kế do AI tạo ra phải được đối chiếu với đặc tả SRS.
- Người dùng có quyền duyệt hoặc yêu cầu sửa thiết kế.
- Mọi thay đổi làm ảnh hưởng đến yêu cầu phải được ghi nhận.
- Không coi ảnh chụp màn hình đơn thuần là nguồn duy nhất để khôi phục toàn bộ cấu trúc và hành vi của giao diện.
- Không coi thiết kế đã tạo là bằng chứng rằng mã nguồn Frontend đã được triển khai hoặc kiểm thử thành công.
- Kiểm soát quyền truy cập, dữ liệu đầu vào và chi phí sử dụng dịch vụ AI.
- Tài liệu và dữ liệu chuyển giao phải tránh chứa bí mật hoặc dữ liệu cá nhân không cần thiết.

## 11. Cấu trúc thư mục Frontend tham khảo

```text
frontend-project/
├── public/
│   └── assets/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   └── router.tsx
│   ├── layouts/
│   │   ├── MainLayout.tsx
│   │   └── AuthLayout.tsx
│   ├── pages/
│   │   ├── Dashboard/
│   │   ├── Products/
│   │   └── Customers/
│   ├── components/
│   │   ├── common/
│   │   ├── forms/
│   │   └── data-display/
│   ├── mock-data/
│   │   ├── products.ts
│   │   ├── customers.ts
│   │   └── orders.ts
│   ├── services/
│   │   └── mockService.ts
│   ├── types/
│   ├── hooks/
│   └── styles/
├── docs/
│   ├── requirements-analysis.md
│   ├── page-map.md
│   ├── ui-specification.md
│   ├── design-handoff.md
│   └── generation-report.md
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

Cấu trúc này là ví dụ cho dự án React + TypeScript. Agent cần điều chỉnh theo quy mô và công nghệ thực tế, không bắt buộc tạo các thư mục không cần thiết. Tài liệu chuyển giao Claude Design có thể nằm trong dự án điều phối hoặc thư mục tài liệu riêng; không bắt buộc xuất hiện trong mọi dự án Frontend đầu ra.

## 12. Ví dụ minh họa: Website cửa hàng bánh

Giả sử người dùng cung cấp SRS mô tả website cửa hàng bánh.

### Bước 1: Trích xuất yêu cầu

Agent nhận diện các chức năng được nêu trong tài liệu, ví dụ:

- Xem danh sách bánh.
- Xem thông tin chi tiết của bánh.
- Tìm kiếm và lọc theo danh mục.
- Thêm sản phẩm vào giỏ hàng.
- Xem thông tin liên hệ cửa hàng.

Đây chỉ là ví dụ giả định; chức năng thực tế phải lấy từ SRS đầu vào.

### Bước 2: Lập danh sách trang

| Trang | Nội dung chính |
|---|---|
| Trang chủ | Banner, danh mục nổi bật và sản phẩm gợi ý. |
| Danh sách sản phẩm | Danh sách bánh, tìm kiếm, lọc và sắp xếp. |
| Chi tiết sản phẩm | Hình ảnh, mô tả, giá và thao tác liên quan. |
| Giỏ hàng | Danh sách mặt hàng, số lượng và tổng tiền mô phỏng. |
| Liên hệ | Địa chỉ, giờ hoạt động và thông tin liên hệ giả lập. |

### Bước 3: Chuẩn bị thiết kế

Layout_Agent xuất UI Specification cho từng trang, gồm mục đích, thành phần bắt buộc, dữ liệu, hành vi và trạng thái. Nếu người dùng có quy định về thương hiệu, tài liệu sẽ kèm màu sắc, kiểu chữ, logo và ví dụ tham khảo.

Người dùng chuyển gói tài liệu sang Claude Design để tạo và hoàn thiện thiết kế. Thiết kế được xem xét trước khi chuyển sang triển khai.

### Bước 4: Tạo dữ liệu giả

Agent tạo danh sách bánh minh họa, chẳng hạn bánh kem dâu, croissant và tiramisu, với giá, mô tả, hình ảnh mẫu và trạng thái còn hàng giả lập.

### Bước 5: Sinh giao diện

Agent tạo các trang có thể điều hướng, lọc sản phẩm, mở chi tiết và thao tác giỏ hàng bằng dữ liệu giả. Không có đơn hàng thật được gửi đến cửa hàng và không có thanh toán thật diễn ra.

### Bước 6: Kiểm tra và bàn giao

Người dùng nhận mã nguồn Frontend, hướng dẫn chạy và báo cáo những chức năng đã được mô phỏng. Đội ngũ có thể dùng bản mẫu để lấy ý kiến, điều chỉnh SRS và tiếp tục triển khai Backend sau đó.

## 13. Xử lý yêu cầu thiếu hoặc mâu thuẫn

Tài liệu SRS không phải lúc nào cũng đầy đủ. Agent cần xử lý các trường hợp sau một cách minh bạch:

- **Thiếu thông tin:** ghi vào danh sách câu hỏi cần xác nhận.
- **Mâu thuẫn giữa các phần:** dẫn ra các yêu cầu xung đột và không tự ý chọn một yêu cầu làm chuẩn nếu chưa có quy tắc ưu tiên.
- **Thiếu quy tắc giao diện:** đề xuất cách trình bày hợp lý, gắn nhãn là giả định.
- **Thiếu trạng thái hoặc luồng ngoại lệ:** liệt kê trạng thái chưa được mô tả.
- **Không xác định được yêu cầu nguồn:** đánh dấu chưa phân loại thay vì bỏ qua âm thầm.
- **Thiết kế mâu thuẫn với SRS:** giữ nguyên thông tin xung đột và yêu cầu xác nhận, không để thiết kế tự động ghi đè yêu cầu.
- **Thiết kế chưa thể hiện một yêu cầu:** bổ sung vào danh sách kiểm tra trước khi sinh mã.
- **Không thể tạo một chức năng trong phạm vi Frontend:** tạo mô phỏng phù hợp nếu có thể và ghi rõ giới hạn.

Khi có nhiều điểm ảnh hưởng đáng kể đến cấu trúc sản phẩm, Agent nên yêu cầu người dùng xác nhận trước khi sinh mã hoặc cho phép người dùng duyệt danh sách giả định.

## 14. Kiểm thử và tiêu chí đánh giá

Có thể đánh giá chất lượng của Layout_Agent theo các nhóm tiêu chí:

### 14.1. Độ chính xác phân tích

- Yêu cầu quan trọng có được trích xuất đầy đủ không?
- Có giữ được mã yêu cầu hoặc tham chiếu nguồn không?
- Vai trò, điều kiện và ngoại lệ có bị diễn giải sai không?

### 14.2. Độ bao phủ giao diện

- Mỗi yêu cầu chức năng có trang hoặc hành vi tương ứng không?
- Có yêu cầu nào bị bỏ sót không?
- Có trang nào được tạo nhưng không có căn cứ từ SRS hoặc giả định rõ ràng không?

### 14.3. Chất lượng thiết kế

- Thiết kế có đáp ứng yêu cầu và mục đích từng trang không?
- Bố cục, kiểu chữ, màu sắc và component có nhất quán không?
- Trạng thái rỗng, tải, lỗi và thành công có được xem xét không?
- Luồng thao tác có rõ ràng và phù hợp với vai trò sử dụng không?
- Thiết kế có tuân thủ design system và quy tắc thương hiệu được cung cấp không?
- Có đáp ứng các kích thước màn hình mục tiêu không?

### 14.4. Chất lượng giao diện triển khai

- Giao diện thực tế có phù hợp với thiết kế đã duyệt không?
- Các nút, biểu mẫu và liên kết có phản hồi đúng dự kiến không?
- Điều hướng và biểu mẫu có hoạt động không?
- Mock Data có nhất quán giữa các trang không?
- Giao diện có hoạt động trên kích thước màn hình mục tiêu không?

### 14.5. Chất lượng mã nguồn

- Dự án có khởi động hoặc build được không?
- Có lỗi cú pháp, import hoặc route không?
- Component và dữ liệu có được tổ chức rõ ràng không?
- Có dependency hoặc bí mật không cần thiết trong mã nguồn không?

### 14.6. Tính minh bạch

- Giả định có được ghi nhận không?
- Chức năng mô phỏng có được phân biệt với chức năng thật không?
- Báo cáo có nêu rõ phần chưa hoàn thành và kết quả kiểm tra không?
- Có phân biệt rõ thiết kế đã tạo, thiết kế đã duyệt, mã nguồn đã sinh và kiểm thử đã chạy không?

Nên xây dựng bộ SRS mẫu đại diện cho các quy mô và lĩnh vực khác nhau, sau đó đánh giá thủ công hoặc bán tự động. Không nên chỉ đánh giá Agent dựa trên việc giao diện trông đẹp hay số lượng tệp được sinh ra.

## 15. Bảo mật và quyền riêng tư

- Chỉ tải lên tài liệu mà người dùng có quyền sử dụng.
- Không đưa khóa API, mật khẩu, token, dữ liệu cá nhân hoặc bí mật kinh doanh vào Mock Data hay mã nguồn sinh ra.
- Nếu sử dụng mô hình AI hoặc dịch vụ xử lý tài liệu bên ngoài, cần xem xét chính sách lưu trữ và xử lý dữ liệu trước khi gửi SRS.
- Không đặt thông tin bí mật trong biến môi trường phía Client; biến môi trường được đóng gói vào Frontend có thể bị người dùng cuối quan sát.
- Không xem giao diện mô phỏng là một hệ thống an toàn để triển khai sản xuất.
- Kiểm tra và rà soát mã nguồn sinh ra trước khi sử dụng trong môi trường thật.
- Làm sạch tên tệp, nội dung đầu vào và đầu ra phù hợp với cách hệ thống xử lý tệp để giảm nguy cơ xử lý nội dung không an toàn.
- Chỉ đưa vào Claude Design những tài liệu và dữ liệu mà người dùng được phép chia sẻ với dịch vụ đó.
- Xem xét quyền truy cập, điều kiện sử dụng và chính sách dữ liệu của các công cụ AI trước khi áp dụng trong dự án doanh nghiệp.
- Không đưa khóa bí mật hoặc thông tin xác thực vào prompt, tài liệu thiết kế, ảnh chụp màn hình hay tệp Frontend.
- Rà soát nội dung được nhập lại từ công cụ bên ngoài trước khi thực thi hoặc đưa vào codebase.

## 16. Giới hạn

- Chất lượng kết quả phụ thuộc vào độ đầy đủ, rõ ràng và khả năng đọc của SRS.
- AI có thể bỏ sót hoặc diễn giải sai yêu cầu; cần cơ chế rà soát.
- Thiết kế được tạo bằng Claude Design có thể cần chỉnh sửa bởi Designer hoặc Developer.
- Mock Data chỉ phục vụ trình diễn, không chứng minh tính đúng đắn của nghiệp vụ thật.
- Kiểm thử giao diện không thay thế kiểm thử tích hợp, bảo mật, hiệu năng hoặc nghiệm thu nghiệp vụ.
- Những tính năng phụ thuộc API, thiết bị hoặc dịch vụ ngoài chỉ có thể mô phỏng nếu chưa có tích hợp tương ứng.
- Định dạng SRS, công nghệ Frontend và mô hình AI được hỗ trợ phụ thuộc vào cấu hình thực tế của dự án.
- Khả năng chuyển giao và tự động hóa với Claude Design phụ thuộc vào tính năng, quyền truy cập và phương thức tích hợp thực tế.
- Không thể mặc định một bản thiết kế có thể chuyển đổi hoàn toàn thành mã nguồn chất lượng cao mà không cần kiểm tra.
- Nếu quy trình chuyển giao thủ công được sử dụng, có thể phát sinh thao tác lặp lại và sai lệch khi đồng bộ phiên bản.

## 17. Lộ trình phát triển đề xuất

### Giai đoạn 1 — MVP

- Nhận một tài liệu SRS theo định dạng được hỗ trợ.
- Trích xuất yêu cầu chức năng và vai trò.
- Sinh danh sách module và trang.
- Xuất UI Specification và gói tài liệu để chuyển sang Claude Design thủ công.
- Cho phép người dùng duyệt thiết kế và cung cấp kết quả lại cho quy trình.
- Tạo một dự án Frontend với Mock Data.
- Hỗ trợ các tương tác giao diện cơ bản.
- Xuất báo cáo và hướng dẫn chạy.
- Cho phép người dùng xem và chỉnh sửa kết quả.

### Giai đoạn 2 — Tăng độ chính xác

- Liên kết yêu cầu với trang và thành phần tương ứng.
- Phát hiện yêu cầu trùng lặp hoặc mâu thuẫn.
- Đưa ra câu hỏi làm rõ và quản lý giả định.
- Chuẩn hóa design system và component dùng chung.
- Tự động kiểm tra build, route và các tương tác quan trọng.
- Kiểm tra độ bao phủ giữa SRS, thiết kế và mã nguồn.

### Giai đoạn 3 — Tăng khả năng tùy biến và chuyển giao

- Hỗ trợ nhiều mẫu giao diện hoặc design system.
- Cho phép chọn công nghệ và cấu trúc thư mục.
- Hỗ trợ cập nhật giao diện khi SRS thay đổi.
- So sánh phiên bản đầu ra và phát hiện thay đổi yêu cầu.
- Nghiên cứu quy trình Claude Design kết hợp Claude Code phù hợp với quyền truy cập và tính năng được hỗ trợ.
- Tự động hóa chuyển giao chỉ khi có cơ chế tích hợp được xác minh.

### Giai đoạn 4 — Hỗ trợ quy trình phát triển đầy đủ

- Xuất đặc tả giao diện và hợp đồng API dự kiến để đội Backend tham khảo.
- Hỗ trợ bàn giao cho các công cụ thiết kế hoặc kiểm thử phù hợp.
- Tích hợp pipeline kiểm tra chất lượng.
- Xem xét hỗ trợ sinh bộ kiểm thử giao diện và tài liệu bàn giao.
- Theo dõi độ bao phủ yêu cầu và khác biệt giữa thiết kế được duyệt với giao diện triển khai.

Các giai đoạn trên là định hướng đề xuất, không phải cam kết về tính năng đã có.

## 18. Hướng dẫn sử dụng dự kiến

Quy trình sử dụng tổng quát:

1. Chuẩn bị tài liệu SRS và loại bỏ thông tin bí mật không cần thiết.
2. Tải tài liệu lên Layout_Agent.
3. Chờ Agent phân tích và xem lại danh sách yêu cầu đã trích xuất.
4. Xác nhận hoặc điều chỉnh các giả định, điểm chưa rõ và cấu trúc trang.
5. Xuất UI Specification cùng các quy tắc thiết kế và tài liệu tham chiếu cần thiết.
6. Chuyển tài liệu sang Claude Design theo phương thức làm việc được hỗ trợ.
7. Điều chỉnh và duyệt thiết kế.
8. Chuyển kết quả thiết kế về quy trình triển khai theo định dạng phù hợp.
9. Yêu cầu Agent sinh dự án Frontend với Mock Data.
10. Chạy các lệnh cài đặt và khởi động được ghi trong README của dự án đầu ra.
11. Duyệt giao diện, thử các luồng và ghi nhận phản hồi.
12. Cập nhật yêu cầu hoặc giao diện cho đến khi bản mẫu đáp ứng mục tiêu.

**Lưu ý:** Lệnh chạy cụ thể phải lấy từ `package.json` và cấu hình thật của dự án được sinh ra. Không nên mặc định mọi đầu ra đều dùng cùng một lệnh nếu công nghệ hoặc công cụ build khác nhau.

### Tài liệu tham khảo về Claude Design

- [Claude Design — hướng dẫn bắt đầu](https://support.claude.com/en/articles/14604416-get-started-with-claude-design)
- [Claude Design — trang sản phẩm](https://claude.com/product/design)

Các tính năng, điều kiện truy cập và khả năng chuyển giao có thể thay đổi theo sản phẩm và tài khoản. Cần kiểm tra tài liệu chính thức hiện hành trước khi triển khai tích hợp.

## 19. Định hướng và giá trị cốt lõi

Layout_Agent hướng đến việc biến tài liệu yêu cầu vốn chủ yếu là văn bản thành một bản mẫu giao diện có thể quan sát và tương tác. Việc đưa Claude Design vào quy trình nhằm hỗ trợ giai đoạn thiết kế, trong khi Layout_Agent tập trung vào việc chuẩn hóa yêu cầu, quản lý tính nhất quán, sinh Frontend và kiểm tra đầu ra.

Giá trị cốt lõi không chỉ nằm ở việc sinh mã nhanh, mà còn ở khả năng giữ mối liên hệ giữa yêu cầu nguồn, thiết kế được duyệt, dữ liệu giả và kết quả được bàn giao.

Một quy trình tốt cần đảm bảo bốn yếu tố:

1. **Traceability — Truy vết:** hiểu mỗi trang hoặc hành vi xuất phát từ yêu cầu nào.
2. **Consistency — Nhất quán:** cấu trúc trang, dữ liệu, thiết kế và tương tác phù hợp với nhau.
3. **Transparency — Minh bạch:** phân biệt rõ thông tin trong SRS, quyết định thiết kế, giả định và chức năng chỉ được mô phỏng.
4. **Human Review — Con người rà soát:** người dùng có thể xem xét và duyệt các quyết định quan trọng trước khi sinh mã hoặc bàn giao.

Mục tiêu cuối cùng là giúp nhóm phát triển và khách hàng thống nhất về hình dung sản phẩm sớm hơn, giảm khoảng cách giữa tài liệu đặc tả và giao diện thực tế, đồng thời tạo nền tảng rõ ràng cho các giai đoạn phát triển tiếp theo.

---

## Trạng thái tài liệu

README này mô tả ý tưởng, phạm vi, quy trình và kiến trúc mục tiêu của **Layout_Agent**. Các công nghệ, cấu trúc thư mục và lộ trình trong tài liệu là gợi ý thiết kế; cần cập nhật theo cách triển khai thực tế khi mã nguồn của Agent được hoàn thiện.

Claude Design được mô tả như một phần của quy trình thiết kế mục tiêu. Phương thức chuyển giao thủ công là phương án MVP được đề xuất; không khẳng định rằng Layout_Agent đã có kết nối API hoặc tự động hóa trực tiếp với Claude Design.
