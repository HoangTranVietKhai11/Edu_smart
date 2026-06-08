from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.ocr_service import extract_text_from_image, preprocess_image
from services.llm_service import get_ocr_guidance

router = APIRouter()


class AnalyzeRequest(BaseModel):
    image_path: str
    question: Optional[str] = ""
    student_name: Optional[str] = "em"


class AnalyzeResponse(BaseModel):
    extracted_text: str
    guidance: str
    subject_hint: str


SUBJECT_KEYWORDS = {
    "toán": ["phương trình", "tích phân", "đạo hàm", "hình học", "số học", "bất phương trình", "logarit"],
    "lý": ["vận tốc", "gia tốc", "lực", "điện", "từ trường", "quang học", "nhiệt"],
    "hóa": ["phản ứng", "mol", "axit", "bazơ", "nguyên tố", "hóa học", "công thức"],
    "anh văn": ["grammar", "vocabulary", "sentence", "verb", "noun", "tense"],
}


def detect_subject(text: str) -> str:
    """Detect subject from extracted text."""
    text_lower = text.lower()
    for subject, keywords in SUBJECT_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            return subject
    return "chưa xác định"


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_image(request: AnalyzeRequest):
    """OCR + AI guidance for exercise images."""
    try:
        # Enhance image for better OCR
        enhanced_path = preprocess_image(request.image_path)

        # Extract text
        extracted_text = extract_text_from_image(enhanced_path)

        if not extracted_text:
            extracted_text = "Không thể nhận diện nội dung từ ảnh. Vui lòng chụp rõ hơn."
            guidance = "Ảnh không đủ rõ để phân tích. Vui lòng chụp lại với ánh sáng tốt hơn và nội dung rõ nét."
            return AnalyzeResponse(
                extracted_text=extracted_text,
                guidance=guidance,
                subject_hint="không xác định",
            )

        # Detect subject
        subject = detect_subject(extracted_text)

        # Generate AI guidance
        guidance = get_ocr_guidance(
            extracted_text=extracted_text,
            question=request.question,
            student_name=request.student_name,
        )

        return AnalyzeResponse(
            extracted_text=extracted_text,
            guidance=guidance,
            subject_hint=subject,
        )

    except Exception as e:
        print(f"OCR analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
