import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL = os.getenv("GROQ_MODEL", "llama3-8b-8192")

SYSTEM_PROMPT = """Bạn là AI Trợ Lý Học Tập thông minh của hệ thống EduSmart, hỗ trợ học sinh học tập hiệu quả.

NGUYÊN TẮC QUAN TRỌNG:
1. TUYỆT ĐỐI không đưa ra đáp án cuối cùng trực tiếp
2. Luôn hướng dẫn học sinh TỰ SUY NGHĨ và TỰ LÀM
3. Chia nhỏ bài toán thành các bước nhỏ dễ hiểu
4. Đặt câu hỏi ngược lại để kích thích tư duy
5. Khen ngợi khi học sinh cố gắng
6. Giải thích theo nhiều cách khác nhau nếu học sinh chưa hiểu
7. Sử dụng tiếng Việt, ngôn ngữ thân thiện, dễ hiểu
8. Ưu tiên sử dụng kiến thức từ tài liệu của giáo viên nếu có

KHI GIẢI BÀI TẬP:
- Hỏi: "Em hiểu đề bài yêu cầu gì chưa?"
- Gợi ý: "Hãy thử nghĩ xem chúng ta cần dùng công thức/phương pháp nào?"
- Hướng dẫn từng bước: "Bước 1, hãy thử..."
- Kiểm tra hiểu biết: "Em có thể giải thích tại sao không?"

Hãy là người thầy kiên nhẫn, thân thiện và khuyến khích học sinh!"""


def get_groq_response(messages: list, system_prompt: str = None) -> str:
    """Call Groq API and return text response."""
    try:
        formatted_messages = [
            {"role": "system", "content": system_prompt or SYSTEM_PROMPT}
        ] + messages

        response = client.chat.completions.create(
            model=MODEL,
            messages=formatted_messages,
            max_tokens=int(os.getenv("MAX_TOKENS", 2048)),
            temperature=float(os.getenv("TEMPERATURE", 0.7)),
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Groq API error: {e}")
        return "Xin lỗi, có lỗi xảy ra khi kết nối với AI. Vui lòng thử lại."


def get_rag_response(question: str, context: str, history: list, student_name: str = "học sinh") -> str:
    """Generate response using RAG context."""
    rag_system_prompt = f"""{SYSTEM_PROMPT}

THÔNG TIN TỪ TÀI LIỆU GIÁO VIÊN:
{context}

Hãy sử dụng thông tin trên để hướng dẫn {student_name}. 
Nếu thông tin trong tài liệu không đủ, hãy sử dụng kiến thức chung nhưng phải thông báo rõ.
Trích dẫn tài liệu khi cần thiết."""

    messages = history + [{"role": "user", "content": question}]
    return get_groq_response(messages, rag_system_prompt)


def get_ocr_guidance(extracted_text: str, question: str, student_name: str = "em") -> str:
    """Generate guidance for image-analyzed exercise."""
    ocr_system_prompt = f"""{SYSTEM_PROMPT}

Học sinh vừa gửi ảnh bài tập. Nội dung được nhận diện từ ảnh:
"{extracted_text}"

Hãy:
1. Xác nhận đề bài (nếu OCR không rõ, hỏi lại)
2. Hướng dẫn {student_name} tiếp cận bài toán
3. KHÔNG giải toàn bộ bài
4. Gợi ý bước đầu tiên để học sinh tự làm"""

    messages = [{"role": "user", "content": question or f"Em cần hướng dẫn bài tập này: {extracted_text}"}]
    return get_groq_response(messages, ocr_system_prompt)
