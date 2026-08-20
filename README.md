# testing — AI Tester với Playwright, TypeScript và Zephyr

Project nền tảng cho luồng:

```text
AI đọc requirement
→ phân tích requirement
→ đề xuất testcase trong chat
→ human review
→ human yêu cầu cập nhật Zephyr
→ tester khác review chéo trên Zephyr
→ human xác nhận hoàn tất review
→ human yêu cầu tạo script bằng HC-Txxx
→ AI đọc lại testcase trên Zephyr
→ tạo Playwright script + JSON test data
→ chạy và ghi Pass/Fail
```

Zephyr là nơi duy nhất lưu testcase chính thức. GitLab chỉ lưu requirement analysis, automation code, test data không bí mật và cấu hình project.

## 1. Cấu trúc project

```text
testing/
├── .agents/skills/
│   ├── analyze-requirement/
│   ├── generate-testcases/
│   ├── generate-automation/
│   └── run-testcases/
├── project/
│   ├── project.yaml
│   ├── requirement-sources.yaml
│   └── zephyr.yaml
├── requirements/
│   ├── input/
│   └── analyzed/
├── tests/
│   ├── api/<feature>/
│   ├── ui/<feature>/
│   ├── integration/<feature>/
│   ├── end-to-end/<release-flow>/
│   ├── pages/
│   ├── api-clients/
│   ├── fixtures/
│   ├── config/
│   └── test-data/
│       ├── api/<feature>/
│       ├── ui/<feature>/
│       ├── integration/<feature>/
│       └── end-to-end/<release-flow>/
├── reports/
├── scripts/
├── .env.example
├── playwright.config.ts
└── package.json
```

Các layer:

- `api`: kiểm tra API bằng Playwright `request`;
- `ui`: kiểm tra giao diện bằng Page Object Model;
- `integration`: gọi và xác minh API trước, sau đó kiểm tra kết quả trên UI;
- `end-to-end`: các luồng đầy đủ chạy trước release;
- `Manual`: chỉ quản lý và chạy trên Zephyr, không tạo Playwright test giả.

## 2. Tạo GitLab repo trước

Đúng: cần tạo repository trên GitLab trước khi dùng lệnh clone.

1. Đăng nhập GitLab.
2. Chọn **New project** → **Create blank project**.
3. Đặt tên `testing`.
4. Chọn `Private` nếu là project nội bộ.
5. Nếu sẽ đẩy bộ source này lên repo mới, không chọn tạo sẵn README.
6. Sao chép URL HTTPS của repo.

Tại PowerShell, chuyển đến thư mục cha mà bạn muốn lưu project, ví dụ:

```powershell
cd D:\Projects
git clone https://gitlab.com/<group>/testing.git testing
cd testing
```

Thư mục `testing` nằm tại `D:\Projects\testing` vì lệnh clone được chạy trong `D:\Projects`. Có thể kiểm tra bằng:

```powershell
Get-Location
```

Nếu dùng file ZIP của project này, giải nén thành `D:\Projects\testing`, sau đó:

```powershell
cd D:\Projects\testing
git init
git branch -M main
git remote add origin https://gitlab.com/<group>/testing.git
git add .
git commit -m "chore: initialize testing project"
git push -u origin main
```

## 3. Cài Playwright và TypeScript

Yêu cầu Node.js 20+ và Git:

```powershell
node --version
npm --version
git --version
```

Trong folder `testing`:

```powershell
npm install
npx playwright install chromium
Copy-Item .env.example .env
```

File chứa URL và tài khoản đăng nhập là `.env` ở ngay thư mục gốc:

```env
BASE_URL=https://website-test.example/
LOGIN_URL=https://website-test.example/login
API_BASE_URL=https://api.website-test.example/
TEST_USERNAME=tester01
TEST_PASSWORD=your-local-password
```

Không commit `.env`. Không lưu password/token trong Zephyr, JSON, spec, Page Object, log hoặc report. Trên GitLab CI, khai báo cùng tên biến trong **Settings → CI/CD → Variables**.

Kiểm tra foundation:

```powershell
npm run verify
```

Khi chưa có testcase Zephyr thật, `test:list` hiển thị `0 tests`; đây là trạng thái đúng, không phải lỗi.

## 4. Quy trình sử dụng AI

### Bước 1 — Phân tích requirement

```text
Use $analyze-requirement to analyze this Jira ticket, Confluence page, or local BRD.
```

Kết quả đã xác minh được lưu trong `requirements/analyzed/`. AI phải chỉ rõ phần API, UI, API + UI, E2E, Manual và các điểm chưa rõ.

### Bước 2 — Đề xuất testcase

```text
Use $generate-testcases to propose complete testcases for this analysis.
```

Mỗi testcase phải có Feature, Title, Preconditions, Test Layer, Steps, Test Data và Expected Result. AI chỉ trình bày đề xuất trong chat; không tạo folder testcase trong Git và không viết script.

### Bước 3 — Human review và cập nhật Zephyr

Human review đề xuất. Chỉ khi human nói rõ “cập nhật lên Zephyr”, AI mới tạo hoặc sửa testcase trên Zephyr. Zephyr cấp Testcase ID chính thức dạng `HC-Txxx`.

Tester thứ hai review chéo trực tiếp trên Zephyr và có thể sửa tại đó. Sau khi review xong, human thông báo thủ công; không cần status testcase hoặc Merge Request cho testcase.

### Bước 4 — Human yêu cầu tạo script

Ví dụ:

```text
Cross-review đã hoàn tất. Use $generate-automation to create scripts for HC-T123 and HC-T124.
```

AI phải đọc lại bản testcase mới nhất trên Zephyr trước khi tạo code. Nếu case là `Manual`, thiếu layer, chưa review xong hoặc không đọc được Zephyr, AI phải dừng và báo blocker.

Với UI, integration và E2E, AI mở URL thật từ `.env`, đăng nhập bằng profile được cấp, đi theo steps và kiểm tra DOM để lấy locator. Locator ưu tiên:

```text
getByTestId → getByRole → getByLabel → getByPlaceholder → stable CSS
```

Locator và reusable UI actions nằm trong `tests/pages/`; spec không chứa raw selector.

## 5. Rule một spec — một JSON test data

Mỗi `*.spec.ts` bắt buộc có đúng một `*.testdata.json` cùng tên và cùng đường dẫn layer/feature:

```text
tests/integration/authentication/login.spec.ts
↔
tests/test-data/integration/authentication/login.testdata.json
```

Test ID dùng thống nhất ở mọi nơi:

```text
Zephyr Key:           HC-T123
Playwright title:     HC-T123 | Login successfully
JSON object key:      HC-T123
Pass/Fail report:     HC-T123
```

Ví dụ JSON:

```json
{
  "HC-T123": {
    "credentialProfile": "standardUser",
    "apiSetup": {
      "accountStatus": "active"
    },
    "ui": {
      "expectedPage": "inventory"
    },
    "expected": {
      "productListVisible": true
    }
  }
}
```

Payload API, input UI và expected value riêng của testcase phải lấy từ JSON. Credential chỉ được tham chiếu bằng tên profile như `standardUser`; username/password thật được loader lấy từ `.env`.

Kiểm tra mapping:

```powershell
npm run check:mapping
```

Validator từ chối spec thiếu JSON tương ứng, sai đường dẫn/tên file, Test ID không phải `HC-Txxx`, key trùng, JSON key thừa/thiếu hoặc testcase-specific literal bị hardcode trong test callback.

## 6. Chạy test

```powershell
npm run test:api
npm run test:ui
npm run test:integration
npm run test:e2e
npm run test:id -- HC-T123
```

`test:integration` chạy các case API trước rồi UI trong cùng testcase. `test:e2e` chỉ chạy folder release full flow. Chạy toàn bộ automation bằng:

```powershell
npm test
npm run summarize
```

Kết quả:

| Nội dung | Đường dẫn |
|---|---|
| Playwright JSON | `reports/results.json` |
| Pass/Fail summary theo HC key | `reports/summary.json` |
| HTML report | `reports/playwright-report/index.html` |
| Screenshot, video, trace | `reports/test-results/` |

Mở HTML report:

```powershell
npm run report
```

## 7. GitLab workflow cho automation

Chỉ code automation và JSON test data đi qua branch/Merge Request:

```powershell
git switch main
git pull
git switch -c automation/HC-T123

npm run verify
git add tests project .agents scripts package.json package-lock.json README.md
git commit -m "test: automate HC-T123"
git push -u origin automation/HC-T123
```

Tạo Merge Request để tester khác review code. Không tạo thêm testcase draft hoặc testcase chính thức trong Git vì phần đó đã được review trên Zephyr.

## 8. Phạm vi version đầu

Version đầu chỉ hỗ trợ đăng nhập username/password thông thường. OTP, CAPTCHA, SSO, Microsoft Login và Google Login chưa nằm trong phạm vi.
