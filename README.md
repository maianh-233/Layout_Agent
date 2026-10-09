# Layout_Agent

> AI Agent chuyển đổi tài liệu SRS thành dự án giao diện Frontend có thể chạy thử, sử dụng dữ liệu giả lập (Mock Data), không cần Backend hoặc cơ sở dữ liệu thực tế.

## 1. Giới thiệu dự án

**Layout_Agent** là một AI Agent hỗ trợ tự động hóa giai đoạn phân tích yêu cầu và xây dựng giao diện người dùng trong quy trình phát triển phần mềm.

Đầu vào của Agent là tài liệu **SRS (Software Requirements Specification – Đặc tả yêu cầu phần mềm)**. Agent đọc và phân tích tài liệu, trích lọc thông tin quan trọng, chuyển yêu cầu nghiệp vụ thành danh sách trang, thành phần giao diện, luồng thao tác và dữ liệu cần hiển thị. Từ đó, Agent xây dựng một dự án Frontend mô phỏng hệ thống được mô tả trong SRS.

Sản phẩm đầu ra tập trung vào **giao diện và trải nghiệm người dùng**. Các trang sử dụng dữ liệu giả lập để người dùng có thể chạy thử, xem bố cục, thao tác với các thành phần và đánh giá luồng sử dụng trước khi tích hợp Backend.

### Mục tiêu chính

- Giảm thời gian đọc, tổng hợp và phân tích tài liệu SRS.
- Chuyển yêu cầu viết bằng ngôn ngữ tự nhiên thành cấu trúc giao diện cụ thể.
- Tạo nhanh bản mẫu Frontend nhất quán với yêu cầu đã phân tích.
- Giúp khách hàng, BA, UI/UX Designer và Developer hình dung sản phẩm sớm.
- Hỗ trợ phát hiện yêu cầu thiếu rõ ràng hoặc luồng nghiệp vụ chưa được mô tả đầy đủ.
- Tạo nền tảng để đội ngũ phát triển tiếp tục hoàn thiện và tích hợp Backend sau này.

## 2. Vấn đề dự án giải quyết

Trong quy trình phát triển phần mềm truyền thống, đội ngũ thường phải đọc tài liệu SRS, xác định vai trò người dùng, lập danh sách chức năng, phân chia trang, thiết kế luồng tương tác và sau đó mới bắt đầu xây dựng Frontend. Quá trình này tốn thời gian, đặc biệt khi tài liệu dài hoặc yêu cầu chưa được trình bày thống nhất.

Layout_Agent hướng đến rút ngắn quá trình đó bằng cách tạo một chuỗi xử lý có cấu trúc:

1. Tiếp nhận tài liệu SRS.
2. Phân tích và trích xuất yêu cầu.
3. Chuẩn hóa yêu cầu thành đặc tả giao diện.
4. Xác định sitemap, trang, thành phần và luồng điều hướng.
5. Xây dựng dữ liệu giả lập phù hợp với từng chức năng.
6. Sinh mã nguồn Frontend.
7. Kiểm tra khả năng chạy và đối chiếu kết quả với yêu cầu đã trích xuất.

Agent hỗ trợ tăng tốc công việc, nhưng không thay thế hoàn toàn việc xác nhận yêu cầu, đánh giá thiết kế hoặc kiểm thử của con người.

## 3. Phạm vi và nguyên tắc hoạt động

### 3.1. Trong phạm vi

- Tiếp nhận SRS ở định dạng được hệ thống hỗ trợ.
- Đọc và trích xuất yêu cầu chức năng, vai trò người dùng, quy tắc nghiệp vụ và yêu cầu giao diện nếu có.
- Nhóm chức năng thành các module.
- Xác định danh sách trang, cấu trúc điều hướng và mối liên hệ giữa các trang.
- Đề xuất bố cục trang, thành phần UI và trạng thái hiển thị.
- Tạo Mock Data để mô phỏng danh sách, chi tiết, thống kê và biểu mẫu.
- Xây dựng các tương tác Frontend như tìm kiếm, lọc, phân trang, mở chi tiết, điều hướng, nhập biểu mẫu và hiển thị thông báo.
- Tạo cấu trúc mã nguồn dễ đọc, dễ chỉnh sửa và có thể tiếp tục phát triển.
- Báo cáo những yêu cầu chưa rõ, giả định được sử dụng và chức năng chưa thể mô phỏng.

### 3.2. Ngoài phạm vi mặc định

- Không xây dựng Backend hoàn chỉnh.
- Không tạo hoặc kết nối cơ sở dữ liệu nghiệp vụ thực tế.
- Không tích hợp API thật nếu chưa được yêu cầu riêng.
- Không xử lý giao dịch, thanh toán hoặc gửi thông báo thật.
- Không triển khai xác thực và phân quyền bảo mật thực tế.
- Không cam kết rằng Mock Data phản ánh dữ liệu thật hoặc mọi quy tắc nghiệp vụ đã được xác minh.
- Không tự ý biến các giả định của Agent thành yêu cầu chính thức.

Những nội dung ngoài phạm vi có thể được phát triển ở giai đoạn sau, nhưng phải được xác định rõ là phần mở rộng.

## 4. Đối tượng sử dụng

- **Khách hàng / Chủ sản phẩm:** xem trước ý tưởng sản phẩm và phản hồi sớm.
- **Business Analyst (BA):** rà soát yêu cầu, chức năng và các trường hợp còn thiếu.
- **UI/UX Designer:** tham khảo cấu trúc trang, điều hướng và trạng thái tương tác.
- **Frontend Developer:** sử dụng mã nguồn khởi tạo làm nền tảng phát triển.
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

Nếu tài liệu không nêu rõ một chi tiết cần thiết, Agent phải ghi nhận đó là **điểm chưa xác định** hoặc đưa ra **giả định có đánh dấu**, thay vì trình bày như thông tin chắc chắn.

### 5.2. Đầu ra

Một lần chạy thành công hướng đến tạo ra:

1. **Bản phân tích SRS:** yêu cầu đã trích xuất, phân loại và liên kết với nguồn trong tài liệu khi có thể.
2. **Danh sách module và trang:** sitemap, mục đích từng trang và vai trò sử dụng.
3. **Đặc tả giao diện:** bố cục, thành phần UI, trường dữ liệu, trạng thái và hành động.
4. **Luồng điều hướng:** cách người dùng di chuyển giữa các trang và hoàn thành tác vụ.
5. **Mock Data:** dữ liệu minh họa phù hợp với ngữ cảnh nghiệp vụ.
6. **Dự án Frontend:** mã nguồn giao diện, thành phần dùng chung và cấu hình cần thiết.
7. **Báo cáo kết quả:** các chức năng đã tạo, yêu cầu chưa xử lý, giả định và lỗi kiểm tra nếu có.
8. **Hướng dẫn chạy:** lệnh cài đặt và khởi động dự án theo công nghệ thực tế được chọn.

Đây là mục tiêu đầu ra; định dạng và mức độ tự động hóa cụ thể phụ thuộc vào phiên bản triển khai.

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

Dữ liệu trung gian giúp tách việc hiểu SRS khỏi việc sinh mã giao diện, đồng thời hỗ trợ kiểm tra tính nhất quán.

### Bước 4 — Xây dựng cấu trúc trang và điều hướng

Từ đặc tả, Agent xác định:

- Cây điều hướng hoặc sitemap.
- Trang tổng quan, danh sách, chi tiết, tạo mới và chỉnh sửa khi phù hợp.
- Các layout dùng chung như sidebar, header, breadcrumb và khu vực nội dung.
- Thành phần dùng lại như bảng, thẻ thống kê, bộ lọc, modal, biểu mẫu và thông báo.
- Quan hệ giữa các trang và đường đi để hoàn thành tác vụ.

Agent không nên tạo trang chỉ vì tên chức năng xuất hiện trong tài liệu; mỗi trang cần có mục đích và liên hệ rõ với yêu cầu nguồn.

### Bước 5 — Thiết kế Mock Data

Agent tạo dữ liệu giả lập phù hợp với từng module, ví dụ:

- Sản phẩm: mã, tên, giá, danh mục và trạng thái.
- Khách hàng: mã, tên, email và thông tin liên hệ giả.
- Đơn hàng: mã đơn, ngày tạo, tổng tiền và trạng thái.
- Nhân viên: mã nhân viên, tên hiển thị và vai trò minh họa.
- Báo cáo: các số liệu tổng hợp được tạo từ dữ liệu giả.

Mock Data cần nhất quán giữa các trang. Ví dụ, một đơn hàng trong bảng danh sách phải có thông tin chi tiết tương ứng; số liệu trên dashboard nên được tính từ cùng tập dữ liệu hoặc được đánh dấu rõ là số liệu minh họa.

**Nguyên tắc dữ liệu:** chỉ dùng dữ liệu tổng hợp hoặc dữ liệu giả. Không đưa dữ liệu cá nhân, bí mật hoặc dữ liệu sản xuất của khách hàng vào bản mẫu. Không trình bày dữ liệu giả như số liệu thực tế.

### Bước 6 — Sinh mã nguồn Frontend

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

### Bước 7 — Kiểm tra và đối chiếu

Sau khi sinh mã, Agent nên kiểm tra:

- Cấu trúc mã nguồn và các dependency.
- Khả năng cài đặt, build hoặc khởi động dự án.
- Lỗi cú pháp và lỗi import nếu công cụ kiểm tra hỗ trợ.
- Liên kết điều hướng và tương tác chính.
- Tính nhất quán của Mock Data.
- Độ bao phủ giữa yêu cầu SRS và trang được tạo.
- Các chức năng chỉ là mô phỏng và các yêu cầu còn thiếu.

Không được tuyên bố đã kiểm thử thành công nếu thực tế chưa chạy kiểm tra tương ứng.

### Bước 8 — Bàn giao

Agent cung cấp dự án Frontend, hướng dẫn chạy, bản tổng hợp trang và chức năng đã tạo, danh sách giả định, các điểm chưa rõ và kết quả kiểm tra. Người dùng rà soát và phản hồi để tiếp tục chỉnh sửa.

## 7. Kiến trúc logic đề xuất

Có thể tổ chức Layout_Agent thành các thành phần logic sau. Đây là kiến trúc tham khảo, không khẳng định rằng tất cả đã được hiện thực hóa trong phiên bản hiện tại.

```text
                  ┌────────────────────┐
                  │   SRS Input        │
                  │ PDF / DOCX / Text  │
                  └─────────┬──────────┘
                            │
                            ▼
                  ┌────────────────────┐
                  │ Document Reader    │
                  │ Đọc và trích văn bản│
                  └─────────┬──────────┘
                            │
                            ▼
                  ┌────────────────────┐
                  │ SRS Analyzer       │
                  │ Phân loại yêu cầu  │
                  └─────────┬──────────┘
                            │
                            ▼
                  ┌────────────────────┐
                  │ Requirement Model  │
                  │ Đặc tả trung gian  │
                  └─────────┬──────────┘
                            │
             ┌──────────────┼──────────────┐
             ▼              ▼              ▼
      ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
      │ Page / Flow │ │ UI Spec     │ │ Mock Data  │
      │ Planner     │ │ Generator   │ │ Generator  │
      └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
             └───────────────┼───────────────┘
                             ▼
                  ┌────────────────────┐
                  │ Frontend Generator │
                  │ Sinh mã giao diện  │
                  └─────────┬──────────┘
                            ▼
                  ┌────────────────────┐
                  │ Validator / Checker│
                  │ Kiểm tra và đối chiếu│
                  └─────────┬──────────┘
                            ▼
                  ┌────────────────────┐
                  │ Frontend Project   │
                  │ + Report + README  │
                  └────────────────────┘
```

### Vai trò các thành phần

| Thành phần | Trách nhiệm |
|---|---|
| Document Reader | Đọc file và chuyển nội dung thành văn bản có thể phân tích. |
| SRS Analyzer | Trích xuất yêu cầu, vai trò, quy tắc và dữ liệu. |
| Requirement Model | Lưu đặc tả trung gian có cấu trúc và liên kết nguồn. |
| Page / Flow Planner | Xác định module, trang và điều hướng. |
| UI Spec Generator | Mô tả bố cục, thành phần, trường dữ liệu và trạng thái. |
| Mock Data Generator | Tạo dữ liệu giả nhất quán cho các trang. |
| Frontend Generator | Tạo mã nguồn giao diện từ đặc tả đã chuẩn hóa. |
| Validator / Checker | Kiểm tra kỹ thuật và đối chiếu yêu cầu với đầu ra. |
| Report Generator | Tổng hợp kết quả, giả định, cảnh báo và hướng dẫn chạy. |

Trong triển khai thực tế, các thành phần này có thể là module trong cùng một ứng dụng, không bắt buộc phải là các dịch vụ độc lập hoặc nhiều AI Agent riêng biệt.

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
          "components": ["ProductCard", "SearchBar", "CategoryFilter"],
          "mockDataSource": "products"
        }
      ]
    }
  ],
  "openQuestions": [],
  "assumptions": []
}
```

Đây chỉ là ví dụ cấu trúc. Schema thực tế cần được định nghĩa, kiểm tra và phiên bản hóa. Các yêu cầu trong ví dụ không phải yêu cầu thật của một dự án SRS cụ thể.

## 9. Nguyên tắc xây dựng giao diện

### 9.1. Bám sát tài liệu

Mỗi trang hoặc thành phần quan trọng cần truy ngược được về yêu cầu nguồn. Nếu SRS không mô tả thiết kế cụ thể, Agent có thể chọn một bố cục hợp lý nhưng phải ghi nhận đó là quyết định thiết kế hoặc giả định.

### 9.2. Tính nhất quán

- Dùng chung hệ thống màu sắc, kiểu chữ, khoảng cách và quy tắc hiển thị.
- Dùng lại thành phần có hành vi tương tự.
- Giữ tên trường và trạng thái nhất quán giữa các trang.
- Đảm bảo điều hướng không dẫn đến trang không tồn tại.

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

### 9.5. Khả năng bảo trì

- Tách layout, page, component, dữ liệu và tiện ích.
- Tránh tạo một tệp quá lớn chứa toàn bộ giao diện.
- Không lặp lại cùng một logic ở nhiều nơi nếu có thể dùng thành phần chung.
- Ưu tiên code rõ ràng và dễ chỉnh sửa hơn là sinh code quá phức tạp.

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

Đây là gợi ý công nghệ, không phải danh sách dependency đã được xác nhận. Không nên chọn thư viện hoặc dịch vụ bên thứ ba trước khi cân nhắc yêu cầu bảo mật, chi phí, quyền riêng tư và khả năng vận hành.

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
│   ├── styles/
│   └── main.tsx
├── docs/
│   ├── requirements-analysis.md
│   ├── page-map.md
│   └── generation-report.md
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

Cấu trúc này là ví dụ cho dự án React + TypeScript. Agent cần điều chỉnh theo quy mô và công nghệ thực tế, không bắt buộc tạo các thư mục không cần thiết.

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

### Bước 3: Tạo dữ liệu giả

Agent tạo một danh sách bánh minh họa, chẳng hạn bánh kem dâu, croissant và tiramisu, với giá, mô tả, hình ảnh mẫu và trạng thái còn hàng giả lập.

### Bước 4: Sinh giao diện

Agent tạo các trang có thể điều hướng, lọc sản phẩm, mở chi tiết và thao tác giỏ hàng bằng dữ liệu giả. Không có đơn hàng thật được gửi đến cửa hàng và không có thanh toán thật diễn ra.

### Bước 5: Bàn giao

Người dùng nhận mã nguồn Frontend, hướng dẫn chạy và báo cáo những chức năng đã được mô phỏng. Đội ngũ có thể dùng bản mẫu để lấy ý kiến, điều chỉnh SRS và tiếp tục triển khai Backend sau đó.

## 13. Xử lý yêu cầu thiếu hoặc mâu thuẫn

Tài liệu SRS không phải lúc nào cũng đầy đủ. Agent cần xử lý các trường hợp sau một cách minh bạch:

- **Thiếu thông tin:** ghi vào danh sách câu hỏi cần xác nhận.
- **Mâu thuẫn giữa các phần:** dẫn ra các yêu cầu xung đột và không tự ý chọn một yêu cầu làm chuẩn nếu chưa có quy tắc ưu tiên.
- **Thiếu quy tắc giao diện:** đề xuất cách trình bày hợp lý, gắn nhãn là giả định.
- **Thiếu trạng thái hoặc luồng ngoại lệ:** liệt kê trạng thái chưa được mô tả.
- **Không xác định được yêu cầu nguồn:** đánh dấu chưa phân loại thay vì bỏ qua âm thầm.
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

### 14.3. Chất lượng giao diện

- Bố cục có nhất quán không?
- Các thành phần có dễ sử dụng không?
- Điều hướng và biểu mẫu có phản hồi đúng dự kiến không?
- Giao diện có hoạt động trên kích thước màn hình mục tiêu không?

### 14.4. Chất lượng mã nguồn

- Dự án có khởi động hoặc build được không?
- Có lỗi cú pháp, import hoặc route không?
- Component và dữ liệu có được tổ chức rõ ràng không?
- Mock Data có nhất quán giữa các trang không?

### 14.5. Tính minh bạch

- Giả định có được ghi nhận không?
- Chức năng mô phỏng có được phân biệt với chức năng thật không?
- Báo cáo có nêu rõ phần chưa hoàn thành và kết quả kiểm tra không?

Nên xây dựng bộ SRS mẫu đại diện cho các quy mô và lĩnh vực khác nhau, sau đó đánh giá thủ công hoặc bán tự động. Không nên chỉ đánh giá Agent dựa trên việc giao diện trông đẹp hay số lượng tệp được sinh ra.

## 15. Bảo mật và quyền riêng tư

- Chỉ tải lên tài liệu mà người dùng có quyền sử dụng.
- Không đưa khóa API, mật khẩu, token, dữ liệu cá nhân hoặc bí mật kinh doanh vào Mock Data hay mã nguồn sinh ra.
- Nếu sử dụng mô hình AI hoặc dịch vụ xử lý tài liệu bên ngoài, cần xem xét chính sách lưu trữ và xử lý dữ liệu trước khi gửi SRS.
- Không đặt thông tin bí mật trong biến môi trường phía Client; biến môi trường được đóng gói vào Frontend có thể bị người dùng cuối quan sát.
- Không xem giao diện mô phỏng là một hệ thống an toàn để triển khai sản xuất.
- Kiểm tra và rà soát mã nguồn sinh ra trước khi sử dụng trong môi trường thật.
- Làm sạch tên tệp, nội dung đầu vào và đầu ra phù hợp với cách hệ thống xử lý tệp để giảm nguy cơ xử lý nội dung không an toàn.

## 16. Giới hạn

- Chất lượng kết quả phụ thuộc vào độ đầy đủ, rõ ràng và khả năng đọc của SRS.
- AI có thể bỏ sót hoặc diễn giải sai yêu cầu; cần cơ chế rà soát.
- Thiết kế UI được sinh ra có thể cần chỉnh sửa bởi Designer hoặc Developer.
- Mock Data chỉ phục vụ trình diễn, không chứng minh tính đúng đắn của nghiệp vụ thật.
- Kiểm thử giao diện không thay thế kiểm thử tích hợp, bảo mật, hiệu năng hoặc nghiệm thu nghiệp vụ.
- Những tính năng phụ thuộc API, thiết bị hoặc dịch vụ ngoài chỉ có thể mô phỏng nếu chưa có tích hợp tương ứng.
- Định dạng SRS, công nghệ Frontend và mô hình AI được hỗ trợ phụ thuộc vào cấu hình thực tế của dự án.

## 17. Lộ trình phát triển đề xuất

### Giai đoạn 1 — MVP

- Nhận một tài liệu SRS.
- Trích xuất yêu cầu chức năng và vai trò.
- Sinh danh sách module và trang.
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

### Giai đoạn 3 — Tăng khả năng tùy biến

- Hỗ trợ nhiều mẫu giao diện hoặc design system.
- Cho phép chọn công nghệ và cấu trúc thư mục.
- Hỗ trợ cập nhật giao diện khi SRS thay đổi.
- So sánh phiên bản đầu ra và phát hiện thay đổi yêu cầu.
- Tạo báo cáo độ bao phủ yêu cầu chi tiết hơn.

### Giai đoạn 4 — Hỗ trợ quy trình phát triển đầy đủ

- Xuất đặc tả giao diện và hợp đồng API dự kiến để đội Backend tham khảo.
- Hỗ trợ bàn giao cho các công cụ thiết kế hoặc kiểm thử phù hợp.
- Tích hợp pipeline kiểm tra chất lượng.
- Xem xét hỗ trợ sinh bộ kiểm thử giao diện và tài liệu bàn giao.

Các giai đoạn trên là định hướng đề xuất, không phải cam kết về tính năng đã có.

## 18. Hướng dẫn sử dụng dự kiến

Quy trình sử dụng tổng quát:

1. Chuẩn bị tài liệu SRS và loại bỏ thông tin bí mật không cần thiết.
2. Tải tài liệu lên Layout_Agent.
3. Chờ Agent phân tích và xem lại danh sách yêu cầu đã trích xuất.
4. Xác nhận hoặc điều chỉnh các giả định, điểm chưa rõ và cấu trúc trang.
5. Yêu cầu Agent sinh dự án Frontend.
6. Chạy các lệnh cài đặt và khởi động được ghi trong README của dự án đầu ra.
7. Duyệt giao diện, thử các luồng và ghi nhận phản hồi.
8. Cập nhật yêu cầu hoặc giao diện cho đến khi bản mẫu đáp ứng mục tiêu.

**Lưu ý:** Lệnh chạy cụ thể phải lấy từ `package.json` và cấu hình thật của dự án được sinh ra. Không nên mặc định mọi đầu ra đều dùng cùng một lệnh nếu công nghệ hoặc công cụ build khác nhau.

## 19. Định hướng và giá trị cốt lõi

Layout_Agent hướng đến việc biến tài liệu yêu cầu vốn chủ yếu là văn bản thành một bản mẫu giao diện có thể quan sát và tương tác. Giá trị cốt lõi không chỉ nằm ở việc sinh mã nhanh, mà còn ở khả năng giữ mối liên hệ giữa yêu cầu nguồn, cấu trúc trang, dữ liệu giả và kết quả được bàn giao.

Một quy trình tốt cần đảm bảo ba yếu tố:

1. **Traceability — Truy vết:** hiểu mỗi trang hoặc hành vi xuất phát từ yêu cầu nào.
2. **Consistency — Nhất quán:** cấu trúc trang, dữ liệu và tương tác phù hợp với nhau.
3. **Transparency — Minh bạch:** phân biệt rõ thông tin trong SRS, quyết định thiết kế, giả định và chức năng chỉ được mô phỏng.

Mục tiêu cuối cùng là giúp nhóm phát triển và khách hàng thống nhất về hình dung sản phẩm sớm hơn, giảm khoảng cách giữa tài liệu đặc tả và giao diện thực tế, đồng thời tạo nền tảng rõ ràng cho các giai đoạn phát triển tiếp theo.

---

## Trạng thái tài liệu

README này mô tả ý tưởng, phạm vi, quy trình và kiến trúc đề xuất của **Layout_Agent**. Các công nghệ, cấu trúc thư mục và lộ trình trong tài liệu là gợi ý thiết kế; cần cập nhật theo cách triển khai thực tế khi mã nguồn của Agent được hoàn thiện.
