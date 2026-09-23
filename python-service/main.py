import os
from typing import Optional
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .verifier import verify_slip, get_ocr

app = FastAPI(
    title="U.B.R Slip Verification Microservice",
    description="High-speed QR Code and Transfer Amount verification for Thai bank slips",
    version="1.0.0",
)

# CORS middleware for Next.js communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    """Warm up OCR model on startup so first user request is instant"""
    try:
        print("[Microservice] Warming up RapidOCR model...")
        get_ocr()
        print("[Microservice] Ready to accept slip verification requests (OCR warmed up - port ดูตาม uvicorn log)")
    except Exception as e:
        print(f"[Microservice] Warning: OCR warmup encountered error: {e}")

@app.get("/")
@app.get("/health")
def health_check():
    return {
        "status": "online",
        "service": "ubr-slip-verifier",
        "version": "1.0.0",
    }

@app.post("/verify-slip")
async def verify_slip_endpoint(
    file: UploadFile = File(...),
    expected_amount: Optional[float] = Form(None),
):
    """
    Verify uploaded bank slip image:
    - Checks for valid QR Code
    - Validates amount against expected_amount
    """
    if not file:
        raise HTTPException(status_code=400, detail="No image file provided")

    try:
        image_bytes = await file.read()
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty file uploaded")

        result = verify_slip(image_bytes, expected_amount)
        return result
    except Exception as e:
        return {
            "isValid": False,
            "hasQr": False,
            "qrData": None,
            "detectedAmount": None,
            "expectedAmount": expected_amount,
            "amountMatched": False,
            "error": f"เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ตรวจสอบสลิป: {str(e)}",
            "elapsedMs": 0,
        }

if __name__ == "__main__":
    import os
    import uvicorn
    port = int(os.getenv("SLIP_SERVICE_PORT", "8000"))
    uvicorn.run("main:app", host="127.0.0.1", port=port, reload=True)
