# Ôn thi cùng Tú — frontend

React client cho phần Hỏi đáp và Luyện đề. Backend FastAPI/NotebookLM chạy trên máy chủ riêng; repository này tuyệt đối không chứa cookie, Google storage state, SQLite hay GitHub token.

## Chạy local

```powershell
npm ci
npm run dev
```

Vite proxy `/api` tới `http://127.0.0.1:8000` khi phát triển.

## Website public qua Cloudflare Tunnel

Named Cloudflare Tunnel `on-thi-cung-tu` trỏ `https://nhaqrigroup.uk` tới `http://127.0.0.1:8000`. FastAPI phục vụ trực tiếp bản React trong `dist`, vì vậy website và `/api` dùng chung một domain. Repository GitHub chỉ lưu source client, không chạy GitHub Pages/Actions.

Chạy `run.ps1` ở thư mục dự án để khởi động cả backend và tunnel. Có thể thêm `-NoTunnel` nếu chỉ cần chạy local.
