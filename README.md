# Ôn thi cùng Tú — frontend

React client cho phần Hỏi đáp và Luyện đề. Backend FastAPI/NotebookLM chạy trên máy chủ riêng; repository này tuyệt đối không chứa cookie, Google storage state, SQLite hay GitHub token.

## Chạy local

```powershell
npm ci
npm run dev
```

Vite proxy `/api` tới `http://127.0.0.1:8000` khi phát triển.

## GitHub Pages + Cloudflare Tunnel

1. Tạo một named Cloudflare Tunnel trỏ hostname public (ví dụ `api.example.com`) tới `http://127.0.0.1:8000`.
2. Trong repository GitHub, tạo Actions variable `VITE_API_BASE_URL` với giá trị `https://api.example.com/api`.
3. Ở backend `.env`, đặt `FRONTEND_ORIGINS=https://TEN_GITHUB.github.io` rồi khởi động lại app.
4. Chọn **Settings → Pages → Source: GitHub Actions**. Workflow trong `.github/workflows/deploy-pages.yml` tự build và deploy khi push vào `main`.

Không dùng Quick Tunnel cho website lâu dài vì URL ngẫu nhiên thay đổi khi tunnel khởi động lại.
