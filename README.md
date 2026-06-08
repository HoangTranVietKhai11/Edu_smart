# 🎓 EduSmart AI - Hệ Thống Hỗ Trợ Giảng Dạy Thông Minh

> Nền tảng học tập trực tuyến tích hợp AI với RAG (Retrieval-Augmented Generation) từ tài liệu giáo viên

## ✨ Tính Năng Chính

| Tính Năng | Mô Tả |
|-----------|--------|
| 🤖 **AI Trợ Lý 24/7** | Chat với AI được đào tạo từ tài liệu của giáo viên |
| 📸 **Nhận Diện Bài Tập** | Upload ảnh bài tập, AI phân tích và hướng dẫn giải |
| 📚 **Kho Tài Liệu** | PDF, DOCX, PPTX, Video - phân loại theo lớp/môn/chương |
| ✅ **Điểm Danh** | Điểm danh theo buổi, cảnh báo nghỉ nhiều |
| 📖 **Bài Đã Nghỉ** | Tự động hiển thị tài liệu khi học sinh vắng mặt |
| 📝 **Kiểm Tra Online** | Tạo đề, làm bài, chấm điểm tự động |
| 📊 **Dashboard** | Thống kê học tập chi tiết cho giáo viên và học sinh |
| 🔔 **Bảng Tin** | Timeline thông báo theo loại |
| ✍️ **Blog** | Chia sẻ kinh nghiệm, kiến thức |

## 🏗️ Kiến Trúc

```
EduSmart AI
├── frontend/          # ReactJS + TailwindCSS + Material UI
├── backend/           # NodeJS + ExpressJS (MVC)
├── ai-service/        # Python FastAPI + Groq + ChromaDB (RAG)
└── docker-compose.yml # Full stack deployment
```

## 🚀 Chạy Nhanh (Local Development)

### Prerequisites
- Node.js >= 18
- Python >= 3.10
- MongoDB (local hoặc Atlas)
- Groq API Key (từ console.groq.com)

### 1. Backend
```bash
cd backend
cp .env.example .env   # Điền MONGODB_URI và các key
npm install
npm run dev            # Port 5000
```

### 2. AI Service
```bash
cd ai-service
cp .env .env.local     # Điền GROQ_API_KEY
pip install -r requirements.txt
python main.py         # Port 8000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev            # Port 3000
```

### 4. Docker (Toàn bộ hệ thống)
```bash
# Tạo file .env ở root với GROQ_API_KEY
echo "GROQ_API_KEY=your_key_here" > .env
docker-compose up -d
```

## 🔑 Biến Môi Trường

### Backend (`backend/.env`)
```env
MONGODB_URI=mongodb://localhost:27017/edusmart
JWT_SECRET=your_secret_key
AI_SERVICE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
```

### AI Service (`ai-service/.env`)
```env
GROQ_API_KEY=gsk_xxxxxxx   # Từ console.groq.com
GROQ_MODEL=llama3-8b-8192
EMBEDDING_MODEL=all-MiniLM-L6-v2
```

## 👤 Tài Khoản Demo

| Role | Email | Password |
|------|-------|----------|
| 👩‍🏫 Giáo viên | teacher@edusmart.vn | 123456 |
| 👨‍🎓 Học sinh | student@edusmart.vn | 123456 |

> Tạo tài khoản giáo viên: Thêm trực tiếp vào MongoDB với `role: "teacher"`

## 🤖 AI RAG Pipeline

```
Tài liệu giáo viên (PDF/DOCX/PPTX)
        ↓
   Trích xuất văn bản (PyMuPDF, python-docx, pptx)
        ↓
   Chunk 500 từ (overlap 50 từ)
        ↓
   Embedding (sentence-transformers: all-MiniLM-L6-v2)
        ↓
   Lưu ChromaDB (cosine similarity)
        ↓
   Học sinh hỏi → Retrieval ngữ nghĩa
        ↓
   Context + History → Groq LLaMA3
        ↓
   Trả lời hướng dẫn (KHÔNG đưa đáp án)
```

## 📁 Cấu Trúc Thư Mục

```
backend/src/
├── config/          # DB, JWT config
├── models/          # 11 Mongoose models
├── controllers/     # Business logic
├── routes/          # Express routes
├── middleware/       # Auth, Upload, Error handler
└── server.js

frontend/src/
├── pages/           # Home, Auth, Teacher, Student, AI, Blog
├── layouts/         # Main, Teacher, Student layouts
├── components/      # Shared components
├── contexts/        # AuthContext
└── services/        # API service layer

ai-service/
├── routers/         # chat, rag, ocr endpoints
├── services/        # LLM, RAG, OCR services
└── main.py
```

## 🔐 API Authentication

```http
POST /api/auth/login
Authorization: Bearer <JWT_TOKEN>
```

Tất cả API yêu cầu header `Authorization: Bearer <token>` ngoại trừ public routes.

## 📝 License

MIT License - Developed for educational purposes
