# Cấu trúc tài liệu SRS hoàn chỉnh

> Nguyên văn do BA cung cấp. Mọi file SRS phải bám đúng số mục bên dưới.
> Phần "Ánh xạ sang file" ở cuối cho biết mục nào nằm ở file nào.

CẤU TRÚC TÀI LIỆU SRS HOÀN CHỈNH

PHẦN 0. DOCUMENT CONTROL — QUẢN LÝ TÀI LIỆU
- 0.1. Document Title — Tên tài liệu
- 0.2. Document ID — Mã tài liệu
- 0.3. Version — Phiên bản
- 0.4. Author and Stakeholders — Người soạn và các bên liên quan
- 0.5. Revision History — Lịch sử chỉnh sửa
- 0.6. Approval and Sign-off — Phê duyệt tài liệu
- 0.7. Document Status — Trạng thái tài liệu

PHẦN 1. INTRODUCTION — GIỚI THIỆU
- 1.1. Purpose — Mục đích tài liệu
- 1.2. Project Background — Bối cảnh dự án
- 1.3. Project Objectives — Mục tiêu dự án
- 1.4. Scope of the System — Phạm vi hệ thống
- 1.5. In-Scope — Các chức năng thuộc phạm vi
- 1.6. Out-of-Scope — Các chức năng ngoài phạm vi
- 1.7. Definitions and Terminology — Định nghĩa và thuật ngữ
- 1.8. Acronyms and Abbreviations — Từ viết tắt
- 1.9. References — Tài liệu tham khảo
- 1.10. Document Organization — Cấu trúc tài liệu

PHẦN 2. OVERALL DESCRIPTION — MÔ TẢ TỔNG QUAN
- 2.1. Product Perspective — Bối cảnh sản phẩm
- 2.2. Product Functions — Tổng quan chức năng
- 2.3. System Architecture Overview — Tổng quan kiến trúc ở mức khái quát
- 2.4. System Context Diagram — Sơ đồ ngữ cảnh hệ thống
- 2.5. Stakeholders — Các bên liên quan
- 2.6. User Classes and Roles — Nhóm người dùng và vai trò
- 2.7. Actor Definitions — Định nghĩa tác nhân
- 2.8. Use Case Diagram — Sơ đồ ca sử dụng
- 2.9. Use Case List — Danh sách ca sử dụng
- 2.10. Operating Environment — Môi trường vận hành
- 2.11. Design and Implementation Constraints — Các ràng buộc
- 2.12. Assumptions and Dependencies — Giả định và phụ thuộc

PHẦN 3. BUSINESS REQUIREMENTS — YÊU CẦU NGHIỆP VỤ
- 3.1. Business Overview — Tổng quan nghiệp vụ
- 3.2. Business Objectives — Mục tiêu nghiệp vụ
- 3.3. Business Process Description — Mô tả quy trình nghiệp vụ
- 3.4. Business Process Diagram — Sơ đồ quy trình nghiệp vụ
- 3.5. Business Rules — Các quy tắc nghiệp vụ
- 3.6. Business Constraints — Các giới hạn nghiệp vụ
- 3.7. Business Glossary — Thuật ngữ nghiệp vụ
- 3.8. Business Scenarios — Các kịch bản nghiệp vụ

PHẦN 4. USER REQUIREMENTS — YÊU CẦU NGƯỜI DÙNG
- 4.1. User Personas — Chân dung người dùng, nếu cần
- 4.2. User Roles and Permissions — Vai trò và quyền hạn
- 4.3. User Needs — Nhu cầu người dùng
- 4.4. User Stories — Câu chuyện người dùng
- 4.5. User Story Mapping — Bản đồ User Story
- 4.6. User Journey Map — Hành trình người dùng, nếu cần
- 4.7. Acceptance Criteria — Tiêu chí chấp nhận User Story
- 4.8. Prioritization — Mức độ ưu tiên, ví dụ MoSCoW

PHẦN 5. FUNCTIONAL REQUIREMENTS — YÊU CẦU CHỨC NĂNG
Đây là phần trọng tâm của SRS. Mỗi module nên được đặc tả theo cùng một mẫu.

5.1. Module Overview — Tổng quan module
- Mục tiêu module
- Phạm vi chức năng
- Tác nhân liên quan
- Điều kiện tiên quyết
- Phụ thuộc vào module khác

5.2. Use Case Specification — Đặc tả ca sử dụng
Mỗi Use Case gồm:
- Use Case ID
- Use Case Name
- Description
- Primary Actor và Secondary Actors
- Preconditions
- Trigger
- Main Success Flow
- Alternative Flows
- Exception Flows
- Business Rules
- Postconditions
- Related Requirements

5.3. Activity Diagram — Sơ đồ hoạt động
- Luồng xử lý chính
- Luồng thay thế
- Điều kiện rẽ nhánh
- Luồng ngoại lệ
- Swimlane phân chia trách nhiệm giữa các tác nhân hoặc hệ thống

5.4. Detailed Functional Requirements — Yêu cầu chức năng chi tiết
- Mã yêu cầu, ví dụ FR-001
- Tên và mô tả yêu cầu
- Tác nhân thực hiện
- Điều kiện đầu vào
- Hành vi hệ thống phải thực hiện
- Kết quả đầu ra
- Quy tắc nghiệp vụ liên quan
- Validation Rules
- Error Handling
- Acceptance Criteria
- Priority
- Traceability

5.5. Sequence Diagram — Sơ đồ tuần tự
- Các đối tượng tham gia
- Thứ tự thông điệp
- Request và Response
- Luồng xử lý thành công
- Luồng lỗi và ngoại lệ
- Các tương tác với API, Service và Database khi cần

5.6. State Machine Diagram — Sơ đồ trạng thái
Sử dụng cho các đối tượng có vòng đời trạng thái phức tạp, chẳng hạn đơn hàng, khuyến mãi, thanh toán.
- Danh sách trạng thái
- Điều kiện chuyển trạng thái
- Sự kiện kích hoạt
- Trạng thái hợp lệ và không hợp lệ
- Quy tắc chuyển trạng thái

5.7. Validation and Error Handling — Kiểm tra và xử lý lỗi
- Trường bắt buộc
- Định dạng dữ liệu
- Giới hạn giá trị
- Quy tắc kiểm tra nghiệp vụ
- Mã lỗi và thông báo lỗi
- Cách phục hồi sau lỗi

5.8. Acceptance Criteria and Test Scenarios
- Tiêu chí nghiệm thu
- Kịch bản thành công
- Kịch bản thất bại
- Trường hợp biên
- Điều kiện phân quyền
- Điều kiện dữ liệu không hợp lệ

PHẦN 6. NON-FUNCTIONAL REQUIREMENTS — YÊU CẦU PHI CHỨC NĂNG
- 6.1. Performance Requirements — Hiệu năng
- 6.2. Security Requirements — Bảo mật
- 6.3. Authentication Requirements — Xác thực
- 6.4. Authorization Requirements — Phân quyền
- 6.5. Reliability Requirements — Độ tin cậy
- 6.6. Availability Requirements — Tính sẵn sàng
- 6.7. Scalability Requirements — Khả năng mở rộng
- 6.8. Usability Requirements — Khả năng sử dụng
- 6.9. Accessibility Requirements — Khả năng tiếp cận
- 6.10. Maintainability Requirements — Khả năng bảo trì
- 6.11. Compatibility Requirements — Tính tương thích
- 6.12. Localization Requirements — Ngôn ngữ, múi giờ, định dạng
- 6.13. Backup and Recovery — Sao lưu và khôi phục
- 6.14. Logging and Monitoring — Ghi nhật ký và giám sát
- 6.15. Audit Requirements — Yêu cầu kiểm toán

PHẦN 7. DATA REQUIREMENTS — YÊU CẦU DỮ LIỆU
- 7.1. Data Overview — Tổng quan dữ liệu
- 7.2. Entity Definitions — Định nghĩa thực thể
- 7.3. Entity Relationship Diagram (ERD) — Sơ đồ quan hệ thực thể
- 7.4. Data Dictionary — Từ điển dữ liệu
- 7.5. Data Types and Constraints — Kiểu dữ liệu và ràng buộc
- 7.6. Primary Keys and Foreign Keys — Khóa chính và khóa ngoại
- 7.7. Data Validation Rules — Quy tắc kiểm tra dữ liệu
- 7.8. Data Integrity — Tính toàn vẹn dữ liệu
- 7.9. Data Lifecycle — Vòng đời dữ liệu
- 7.10. Soft Delete and Hard Delete — Xóa mềm và xóa cứng
- 7.11. Data Retention — Thời hạn lưu trữ
- 7.12. Data Migration — Chuyển đổi dữ liệu
- 7.13. Audit Fields — Các trường theo dõi thay đổi
- 7.14. Data Access Rules — Quy tắc truy cập dữ liệu

PHẦN 8. EXTERNAL INTERFACE REQUIREMENTS — YÊU CẦU GIAO TIẾP
- 8.1. User Interface Requirements — Yêu cầu giao diện người dùng
- 8.2. Hardware Interfaces — Giao tiếp phần cứng, nếu có
- 8.3. Software Interfaces — Giao tiếp phần mềm
- 8.4. API Specifications — Đặc tả API
- 8.5. Request and Response Formats — Cấu trúc request/response
- 8.6. Error Response Standards — Chuẩn phản hồi lỗi
- 8.7. Third-party Integrations — Tích hợp bên thứ ba
- 8.8. Communication Protocols — Giao thức giao tiếp

PHẦN 9. UI/UX SPECIFICATION — ĐẶC TẢ GIAO DIỆN
Phần này đặc biệt hữu ích nếu tài liệu được sử dụng để đưa vào Claude Design.
- 9.1. Design Principles — Nguyên tắc thiết kế
- 9.2. Design System — Hệ thống thiết kế
- 9.3. Color Palette — Bảng màu
- 9.4. Typography — Kiểu chữ
- 9.5. Spacing and Layout — Khoảng cách và bố cục
- 9.6. Navigation Structure — Cấu trúc điều hướng
- 9.7. Information Architecture — Kiến trúc thông tin
- 9.8. Sitemap — Sơ đồ cấu trúc màn hình
- 9.9. Screen Inventory — Danh sách màn hình
- 9.10. Wireframes — Bản phác thảo giao diện
- 9.11. Screen Specifications — Đặc tả từng màn hình
- 9.12. Component Specifications — Đặc tả thành phần giao diện
- 9.13. Form and Table Specifications — Đặc tả biểu mẫu và bảng
- 9.14. Interaction and Navigation Flows — Luồng tương tác
- 9.15. Loading, Empty, Error and Success States — Trạng thái giao diện
- 9.16. Responsive Design — Thiết kế thích ứng
- 9.17. Accessibility and Usability — Khả năng tiếp cận và sử dụng
- 9.18. UI Validation and Feedback — Kiểm tra dữ liệu và phản hồi giao diện

PHẦN 10. SYSTEM DESIGN CONSTRAINTS — RÀNG BUỘC THIẾT KẾ HỆ THỐNG
Phần này có thể được tách thành tài liệu SDD riêng nếu dự án cần đặc tả kỹ thuật chuyên sâu.
- 10.1. Technology Constraints — Ràng buộc công nghệ
- 10.2. Architectural Constraints — Ràng buộc kiến trúc
- 10.3. Component Architecture — Kiến trúc thành phần
- 10.4. Deployment Environment — Môi trường triển khai
- 10.5. Integration Architecture — Kiến trúc tích hợp
- 10.6. Infrastructure Constraints — Ràng buộc hạ tầng
- 10.7. Technical Dependencies — Phụ thuộc kỹ thuật

PHẦN 11. VERIFICATION AND VALIDATION — KIỂM CHỨNG VÀ XÁC NHẬN
- 11.1. Verification Strategy — Chiến lược kiểm chứng
- 11.2. Test Levels — Các cấp độ kiểm thử
- 11.3. Test Scenarios — Kịch bản kiểm thử
- 11.4. Test Cases — Các trường hợp kiểm thử
- 11.5. Acceptance Testing — Kiểm thử nghiệm thu
- 11.6. Negative Testing — Kiểm thử trường hợp không hợp lệ
- 11.7. Boundary Testing — Kiểm thử biên
- 11.8. Security Testing — Kiểm thử bảo mật
- 11.9. Performance Testing — Kiểm thử hiệu năng
- 11.10. Definition of Done — Điều kiện hoàn thành

PHẦN 12. REQUIREMENTS TRACEABILITY — TRUY VẾT YÊU CẦU
- 12.1. Requirement ID Convention — Quy ước mã yêu cầu
- 12.2. Requirements Traceability Matrix (RTM) — Ma trận truy vết
- 12.3. Business Requirements to User Stories
- 12.4. User Stories to Use Cases
- 12.5. Use Cases to Functional Requirements
- 12.6. Functional Requirements to Test Cases
- 12.7. Change Impact Analysis — Phân tích ảnh hưởng thay đổi
- 12.8. Coverage and Completeness — Độ bao phủ yêu cầu

PHẦN 13. APPENDICES — PHỤ LỤC
- 13.1. Full Use Case Diagrams — Các sơ đồ Use Case đầy đủ
- 13.2. Full Activity Diagrams — Các sơ đồ Activity đầy đủ
- 13.3. Full Sequence Diagrams — Các sơ đồ Sequence đầy đủ
- 13.4. State Machine Diagrams — Các sơ đồ trạng thái
- 13.5. ERD and Data Models — Sơ đồ dữ liệu
- 13.6. API Examples — Ví dụ API
- 13.7. Sample Data — Dữ liệu mẫu
- 13.8. Glossary — Bảng thuật ngữ
- 13.9. Open Issues and Pending Decisions — Các vấn đề chưa giải quyết
- 13.10. Revision History — Lịch sử phiên bản

---

## Ánh xạ sang file

| File trong `srs/` | Mục SRS | Tạo ở bước |
|---|---|---|
| `README.md` | Mục lục + trạng thái từng file | 1, cập nhật ở 2 |
| `00-document-control.md` | 0.1 → 0.7 | 1 (0.5 cập nhật ở 2) |
| `01-introduction.md` | 1.1 → 1.10 | 1 |
| `02-overall-description.md` | 2.1 → 2.12 | 1 |
| `03-business-requirements.md` | 3.1 → 3.8 | 1 |
| `04-user-requirements.md` | 4.1 → 4.8 | 1 |
| `05-functional/README.md` | Danh sách module | 1 |
| `05-functional/<module-slug>.md` | 5.1 → 5.8 cho từng module | 1 |
| `06-non-functional.md` | 6.1 → 6.15 | 1 (6.8, 6.9, 6.11 cập nhật ở 2) |
| `07-data-requirements.md` | 7.1 → 7.14 | 1 |
| `08-external-interfaces.md` | 8.1 → 8.8 | 1 (8.1 cập nhật ở 2) |
| `09-ui-ux/README.md` | Mục lục Phần 9 | 1 (giữ chỗ), 2 (đầy đủ) |
| `09-ui-ux/01-design-system.md` | 9.1 → 9.5 | 2 |
| `09-ui-ux/02-navigation-sitemap.md` | 9.6 → 9.8 | 2 |
| `09-ui-ux/03-screen-inventory.md` | 9.9 | 2 |
| `09-ui-ux/screens/<screen-slug>.md` | 9.10, 9.11, 9.13 cho từng màn hình | 2 |
| `09-ui-ux/04-states-responsive.md` | 9.12, 9.14 → 9.18 | 2 |
| `10-system-design-constraints.md` | 10.1 → 10.7 | 1 |
| `11-verification-validation.md` | 11.1 → 11.10 | 1 |
| `12-traceability.md` | 12.1 → 12.8 | 1 (bổ sung màn hình ở 2) |
| `13-appendices.md` | 13.1 → 13.10 | 1 (13.9 cập nhật ở 2) |
