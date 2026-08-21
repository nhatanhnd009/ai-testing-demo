# Tinh Nang Checkout

## Muc Tieu

Nguoi dung co the thuc hien checkout sau khi them san pham vao gio hang, nhap thong tin can thiet va chuyen sang buoc thanh toan.

## Mo Ta Yeu Cau

Sau khi nguoi dung them san pham vao gio hang, nguoi dung co the nhan vao gio hang de chuyen sang trang `Cart`. Tai trang `Cart`, nguoi dung nhan nut `Checkout` de chuyen sang trang `Checkout`.

Tai trang `Checkout`, nguoi dung nhap thong tin bat buoc gom `First Name`, `Last Name` va `Zip Code`. Neu nhap day du thong tin, nguoi dung co the tiep tuc sang trang thanh toan. Neu thieu thong tin, he thong se hien thi loi.

Nguoi dung co the huy checkout de quay lai trang `Cart`.

## Business Rules

### BR1: Dieu Kien Bat Dau Checkout

Nguoi dung chi co the bat dau checkout sau khi da them it nhat mot san pham vao gio hang.

### BR2: Thong Tin Bat Buoc Tai Checkout

Ca truong `First Name`, `Last Name` va `Zip Code` la bat buoc.

### BR3: Validate Thong Tin Checkout

He thong khong cho phep nguoi dung tiep tuc sang trang thanh toan neu thieu mot trong cac truong bat buoc.

### BR4: Hien Thi Loi

Khi nguoi dung thieu thong tin bat buoc va nhan nut checkout/continue, he thong phai hien thi thong bao loi mau do.

### BR5: Huy Checkout

Khi nguoi dung nhan nut `Cancel`, he thong chuyen nguoi dung ve trang `Cart` va khong xoa san pham trong gio hang.

## Acceptance Criteria

### AC1: Chuyen Tu Gio Hang Sang Trang Checkout

Sau khi them san pham vao gio hang, nguoi dung nhan vao gio hang thi he thong chuyen sang trang `Cart`. Tai trang `Cart`, khi nguoi dung nhan nut `Checkout`, he thong chuyen sang trang `Checkout` de bat dau qua trinh thanh toan.

### AC2: Nhap Day Du Thong Tin Checkout

Tai trang `Checkout`, nguoi dung nhap day du thong tin vao 3 truong bat buoc: `First Name`, `Last Name` va `Zip Code`. Sau do, khi nguoi dung nhan nut tiep tuc checkout, he thong chuyen sang trang thanh toan.

### AC3: Bao Loi Khi Thieu Thong Tin Bat Buoc

Tai trang `Checkout`, neu nguoi dung khong nhap du thong tin vao 3 truong bat buoc gom `First Name`, `Last Name` va `Zip Code`, khi nhan nut checkout/continue, he thong hien thi thong bao loi mau do va khong chuyen sang trang thanh toan.

### AC4: Huy Checkout

Tai trang `Checkout`, khi nguoi dung nhan nut `Cancel`, he thong chuyen nguoi dung ve trang `Cart`.
