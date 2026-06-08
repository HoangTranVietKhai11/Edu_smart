from fastapi import APIRouter, HTTPException, UploadFile, File
import fitz  # PyMuPDF
from docx import Document
import io
import json
from services.llm_service import get_groq_response

router = APIRouter()

EXTRACT_SYSTEM_PROMPT = """Bạn là chuyên gia phân tích đề thi thông minh.
Nhiệm vụ của bạn là nhận vào văn bản (text) được trích xuất từ đề thi (Word/PDF) và bóc tách nó thành cấu trúc JSON nghiêm ngặt chứa mảng các câu hỏi.

CẤU TRÚC JSON ĐẦU RA YÊU CẦU:
```json
{
  "questions": [
    {
      "content": "Nội dung câu hỏi (chỉ lấy câu hỏi, bỏ chữ 'Câu 1:', 'Câu 2:', v.v.)",
      "type": "multiple-choice", 
      "points": 1,
      "explanation": "Giải thích hoặc lời giải chi tiết (nếu đề có ghi)",
      "options": [
        {
          "text": "Nội dung đáp án A (bỏ chữ 'A.', 'A)', v.v.)",
          "isCorrect": true
        },
        {
          "text": "Nội dung đáp án B",
          "isCorrect": false
        }
      ]
    }
  ]
}
```

NGUYÊN TẮC QUAN TRỌNG:
1. Mặc định "type" là "multiple-choice" cho tất cả nếu có các đáp án A, B, C, D. Nếu không có đáp án, đặt là "essay".
2. Nếu đề bài có bôi đậm, gạch chân hoặc khoanh tròn đáp án đúng (hoặc có bảng đáp án), hãy đặt "isCorrect": true cho đáp án đó. Nếu không nhận diện được đáp án đúng nào, hãy để đáp án đầu tiên (A) là true.
3. Không trả về bất kỳ text nào khác ngoài JSON hợp lệ. Đừng bọc bằng markdown (như ```json). Chỉ xuất JSON thuần.
4. "points" mặc định là 1.
"""

def extract_text_from_pdf(file_bytes: bytes) -> str:
    text = ""
    try:
        pdf_document = fitz.open(stream=file_bytes, filetype="pdf")
        for page in pdf_document:
            text += page.get_text()
    except Exception as e:
        print(f"Error reading PDF: {e}")
    return text

def extract_text_from_docx(file_bytes: bytes) -> str:
    text = ""
    try:
        doc = Document(io.BytesIO(file_bytes))
        for para in doc.paragraphs:
            text += para.text + "\n"
    except Exception as e:
        print(f"Error reading DOCX: {e}")
    return text

@router.post("/extract-exam")
async def extract_exam(file: UploadFile = File(...)):
    """Trích xuất câu hỏi từ file PDF hoặc Word và trả về JSON cấu trúc."""
    if not file.filename.endswith((".pdf", ".docx")):
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ file .pdf hoặc .docx")

    file_bytes = await file.read()
    
    # Bước 1: Trích xuất Text thô
    text = ""
    if file.filename.endswith(".pdf"):
        text = extract_text_from_pdf(file_bytes)
    elif file.filename.endswith(".docx"):
        text = extract_text_from_docx(file_bytes)
        
    if not text.strip():
        raise HTTPException(status_code=400, detail="Không thể đọc nội dung từ file hoặc file trống.")

    # Bước 2: Gọi LLM để bóc tách JSON
    try:
        import re
        messages = [{"role": "user", "content": f"Văn bản trích xuất từ đề thi:\n\n{text}"}]
        llm_response = get_groq_response(messages, EXTRACT_SYSTEM_PROMPT, json_mode=True)
        
        # Làm sạch JSON an toàn hơn
        cleaned_json_str = llm_response.strip()
        
        # Tìm block json nếu bị bọc trong markdown
        match = re.search(r'```(?:json)?\s*(.*?)\s*```', cleaned_json_str, re.DOTALL)
        if match:
            cleaned_json_str = match.group(1).strip()
        else:
            # Tìm cặp ngoặc nhọn đầu và cuối
            start = cleaned_json_str.find('{')
            end = cleaned_json_str.rfind('}')
            if start != -1 and end != -1 and end >= start:
                cleaned_json_str = cleaned_json_str[start:end+1]
        
        # Parse JSON
        parsed_data = json.loads(cleaned_json_str)
        return {"success": True, "data": parsed_data.get("questions", [])}

    except json.JSONDecodeError as e:
        print(f"JSON Parsing Error: {e}\nRaw Response: {llm_response}")
        raise HTTPException(status_code=500, detail="AI trả về dữ liệu không đúng định dạng JSON.")
    except Exception as e:
        print(f"Extraction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
