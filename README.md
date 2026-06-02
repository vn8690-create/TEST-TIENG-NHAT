# 🌸 NihongoQuest — Luyện thi JLPT

App luyện thi tiếng Nhật chạy hoàn toàn trên browser, không cần server. Deploy trực tiếp lên **GitHub Pages**.

## 🚀 Deploy lên GitHub Pages

1. Fork hoặc tạo repo mới, upload toàn bộ file
2. Vào **Settings → Pages → Branch: main → / (root)**
3. Save → đợi 1-2 phút → truy cập `https://username.github.io/repo-name`

## 📁 Cấu trúc dự án

```
nihongo-quest/
├── index.html          # App chính + toàn bộ CSS (giao diện Anime)
├── app.js              # Controller chính — điều phối màn hình, game logic
├── questionEngine.js   # Random engine, seed generator, xếp hạng S/A/B/C
├── storage.js          # LocalStorage manager — lịch sử, câu sai, tiến độ
└── data/
    ├── N5/
    │   ├── kanji.json   (20 câu mẫu)
    │   ├── vocab.json   (20 câu mẫu)
    │   └── grammar.json (20 câu mẫu)
    ├── N4/
    ├── N3/
    ├── N2/
    └── N1/
```

## 🎮 Các chế độ chơi

| Mode | Câu | Thời gian | Mô tả |
|------|-----|-----------|-------|
| Mock Test | 60 | 60 phút | 20 Kanji + 20 Vocab + 20 Grammar |
| Random Exam | 60 | 60 phút | Random toàn bộ pool, có seed ID |
| Quick Test | 10 | 10 phút | Học nhanh |
| Survival | ∞ | Vô hạn | 3 mạng, sai hết thì thua |
| Ôn tập | tùy | Vô hạn | Chỉ ôn câu đã sai |

## 📊 Xếp hạng

| Rank | Điểm |
|------|------|
| S | ≥ 90% |
| A | ≥ 75% |
| B | ≥ 60% |
| C | < 60% |

## 📝 Thêm câu hỏi

Mỗi câu hỏi trong file JSON có cấu trúc:

```json
{
  "id": "n5k001",
  "question": "「日」の読み方は？",
  "questionVi": "Cách đọc của 「日」là?",
  "kanji": "日",
  "choices": ["にち", "げつ", "か", "ねん"],
  "choicesVi": ["nichi", "getsu", "ka", "nen"],
  "answer": 0,
  "explanation": "Giải thích bằng tiếng Nhật",
  "explanationVi": "Giải thích bằng tiếng Việt",
  "category": "kanji",
  "level": "N5"
}
```

**category** có thể là: `kanji` | `vocab` | `grammar`

## 🌸 Tính năng

- ✅ Giao diện Anime dark theme với hoa anh đào rơi
- ✅ Random Engine với seed → chia sẻ đề thi với bạn bè
- ✅ LocalStorage: lưu tiến độ, lịch sử thi, câu sai
- ✅ Survival Mode: 3 mạng
- ✅ Ôn tập câu sai
- ✅ Song ngữ Nhật/Việt
- ✅ Xếp hạng S/A/B/C
- ✅ Hoàn toàn offline sau lần tải đầu

## 💡 Tips mở rộng

- Thêm dữ liệu vào `data/N4/`, `data/N3/`... theo đúng format
- Seed ID cho phép share đề thi: "Bạn thử đề #09581 xem!"
- Dùng browser DevTools > Application > LocalStorage để xem dữ liệu lưu
