import io
import re
import time
from typing import Optional, Tuple, Dict, Any
from PIL import Image
import cv2
import numpy as np
import zxingcpp
from rapidocr_onnxruntime import RapidOCR

# Lazy singleton instance for RapidOCR to preserve memory and avoid repeated initialization
_ocr_instance: Optional[RapidOCR] = None

def get_ocr() -> RapidOCR:
    global _ocr_instance
    if _ocr_instance is None:
        _ocr_instance = RapidOCR()
    return _ocr_instance


THAI_BANK_NAMES: Dict[str, str] = {
    "002": "ธนาคารกรุงเทพ (BBL)",
    "004": "ธนาคารกสิกรไทย (KBANK)",
    "006": "ธนาคารกรุงไทย (KTB)",
    "011": "ธนาคารทหารไทยธนชาต (TTB)",
    "014": "ธนาคารไทยพาณิชย์ (SCB)",
    "025": "ธนาคารกรุงศรีอยุธยา (BAY)",
    "069": "ธนาคารเกียรตินาคินภัทร (KKP)",
    "022": "ธนาคารซีไอเอ็มบีไทย (CIMBT)",
    "067": "ธนาคารทิสโก้ (TISCO)",
    "024": "ธนาคารยูโอบี (UOB)",
    "071": "ธนาคารไทยเครดิต (TCRB)",
    "073": "ธนาคารแลนด์ แอนด์ เฮ้าส์ (LH Bank)",
    "030": "ธนาคารออมสิน (GSB)",
    "034": "ธ.ก.ส. (BAAC)",
    "033": "ธนาคารอาคารสงเคราะห์ (GHB)",
    "070": "ธนาคารเพื่อการส่งออกและนำเข้าแห่งประเทศไทย (EXIM)",
}


def decode_tlv_tags(payload: str) -> Dict[str, str]:
    """
    Decodes standard EMV / TLV string into dictionary of tag -> value
    """
    tags = {}
    idx = 0
    while idx < len(payload):
        if idx + 4 > len(payload):
            break
        tag_id = payload[idx : idx + 2]
        len_str = payload[idx + 2 : idx + 4]
        if not len_str.isdigit():
            break
        length = int(len_str)
        if length <= 0 or idx + 4 + length > len(payload):
            break
        val = payload[idx + 4 : idx + 4 + length]
        tags[tag_id] = val
        idx += 4 + length
    return tags


def parse_slip_qr_data(qr_data: str) -> Dict[str, Any]:
    """
    Parse Raw QR Code Text from Thai Bank Transfer Slip.
    Extracts:
      - sendingBank (รหัสธนาคาร 3 หลัก)
      - sendingBankName (ชื่อธนาคารภาษาไทย)
      - transferDateTime (วัน-เวลาที่โอน)
      - transRef (รหัสอ้างอิงธุรกรรม / Transaction ID)
    """
    result: Dict[str, Any] = {
        "rawQr": qr_data,
        "sendingBank": None,
        "sendingBankName": None,
        "transferDateTime": None,
        "transferDateTimeFormatted": None,
        "transRef": None,
    }
    if not qr_data:
        return result

    # 1. Decode TLV tags
    top_tags = decode_tlv_tags(qr_data)

    # Format A: ITMX Standard Mini QR (กสิกรไทย, ไทยพาณิชย์ ฯลฯ)
    # Tag 00 has sub-tags: 00=API Version, 01=SendingBank, 02=TransRef
    if "00" in top_tags:
        sub_tags = decode_tlv_tags(top_tags["00"])
        if "01" in sub_tags:
            result["sendingBank"] = sub_tags["01"]
        if "02" in sub_tags:
            result["transRef"] = sub_tags["02"]

    # Format B: Universal Slip Tag Standard (Tag 03=Bank, Tag 04=DateTime, Tag 05=TransRef)
    if "03" in top_tags and not result["sendingBank"]:
        result["sendingBank"] = top_tags["03"]
    if "04" in top_tags and not result["transferDateTime"]:
        result["transferDateTime"] = top_tags["04"]
    if "05" in top_tags and not result["transRef"]:
        result["transRef"] = top_tags["05"]

    # Format C: Regex Heuristics Fallback (for arbitrary Raw Text formats)
    if not result["transRef"] or not result["sendingBank"]:
        bank_m = re.search(r'(?:0303|0103)(\d{3})', qr_data)
        if bank_m and not result["sendingBank"]:
            result["sendingBank"] = bank_m.group(1)

        dt_m = re.search(r'(?:04(?:12|14))?((?:20\d{2})(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{4,6})', qr_data)
        if dt_m and not result["transferDateTime"]:
            result["transferDateTime"] = dt_m.group(1)

        ref_m = re.search(r'05\d{2}([A-Za-z0-9_-]{10,35})', qr_data) or re.search(r'02\d{2}([A-Za-z0-9_-]{10,35})', qr_data)
        if ref_m and not result["transRef"]:
            result["transRef"] = ref_m.group(1)

    # Fallback to alphanumeric token if transRef still empty
    if not result["transRef"] and len(qr_data) >= 20:
        alphanumeric = re.findall(r'[A-Za-z0-9]{12,}', qr_data)
        if alphanumeric:
            result["transRef"] = alphanumeric[-1]

    # Map bank name
    if result["sendingBank"]:
        bank_id = result["sendingBank"]
        result["sendingBankName"] = THAI_BANK_NAMES.get(bank_id, f"ธนาคารรหัส {bank_id}")

    # Format datetime if YYYYMMDDHHMMSS
    if result["transferDateTime"] and len(result["transferDateTime"]) >= 12:
        dt = result["transferDateTime"]
        try:
            formatted_dt = f"{dt[0:4]}-{dt[4:6]}-{dt[6:8]} {dt[8:10]}:{dt[10:12]}"
            if len(dt) >= 14:
                formatted_dt += f":{dt[12:14]}"
            result["transferDateTimeFormatted"] = formatted_dt
        except Exception:
            pass

    return result


def parse_emv_tag54_amount(qr_data: str) -> Optional[float]:
    """
    Parse transaction amount (Tag 54) from EMVCo PromptPay QR Code payload
    """
    if not qr_data or not qr_data.startswith("000201"):
        return None
    try:
        idx = 0
        while idx < len(qr_data) - 4:
            tag = qr_data[idx : idx + 2]
            length_str = qr_data[idx + 2 : idx + 4]
            if not length_str.isdigit():
                break
            length = int(length_str)
            if length <= 0 or idx + 4 + length > len(qr_data):
                break
            val = qr_data[idx + 4 : idx + 4 + length]
            if tag == "54":
                try:
                    num = float(val)
                    if num > 0:
                        return num
                except ValueError:
                    pass
            idx += 4 + length
    except Exception:
        pass
    return None


def detect_qr_code(pil_img: Image.Image) -> Tuple[bool, Optional[str]]:
    """
    Detect QR Code from PIL Image using zxing-cpp with OpenCV fallback
    """
    # 1. Primary: zxing-cpp (C++ engine, ultra-fast and handles rotations)
    try:
        results = zxingcpp.read_barcodes(pil_img)
        for r in results:
            if r.text and len(r.text.strip()) > 0:
                return True, r.text.strip()
    except Exception as e:
        print(f"[QR] zxing-cpp scan error: {e}")

    # 2. Secondary fallback: OpenCV QRCodeDetector
    try:
        cv_img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        detector = cv2.QRCodeDetector()
        val, _, _ = detector.detectAndDecode(cv_img)
        if val and len(val.strip()) > 0:
            return True, val.strip()

        # Multi-scale pass if original was large
        h, w = cv_img.shape[:2]
        if w > 1000:
            scale = 800.0 / w
            resized = cv2.resize(cv_img, (800, int(h * scale)))
            val_r, _, _ = detector.detectAndDecode(resized)
            if val_r and len(val_r.strip()) > 0:
                return True, val_r.strip()
    except Exception as e:
        print(f"[QR] OpenCV scan error: {e}")

    return False, None


def extract_amount_from_text(text: str, expected_amount: Optional[float] = None) -> Tuple[Optional[float], bool]:
    """
    Extract transfer amount from OCR text and compare against expected amount
    """
    if not text:
        return None, False

    # 1. Direct match if expected_amount is specified
    if expected_amount is not None and expected_amount > 0:
        formatted_with_comma = f"{expected_amount:,.2f}"
        formatted_no_comma = f"{expected_amount:.2f}"
        int_str = str(int(expected_amount))

        if (
            formatted_with_comma in text
            or formatted_no_comma in text
            or (expected_amount.is_integer() and re.search(rf"\b{int_str}(?:\.00)?\b", text))
        ):
            return expected_amount, True

    # 2. Regex patterns for Thai bank transfer slips (covers all major Thai banks: KBANK, SCB, BBL, KTB, BAY, TTB, GSB, BAAC, TrueMoney, etc.)
    patterns = [
        # แบบมีคีย์เวิร์ดกำกับชัดเจน (รองรับการขึ้นบรรทัดใหม่ \n และวงเล็บสกุลเงิน เช่น "จำนวนเงิน\n(บาท)\n500.00")
        r"(?:จ[ำาํ]นวนเงิน(?:ที่โอน|โอน|ที่ช[ำาํ]ระ)?|ยอด(?:เงิน)?(?:โอน|ช[ำาํ]ระ)?|จ[ำาํ]นวน|transfer\s*amount|total\s*amount|amount|paid\s*amount)\s*(?:\([^)]*\))?\s*[:\s]*([0-9,]+\.?[0-9]*)",
        # แบบตามด้วยหน่วยเงิน เช่น "1,250.00 บาท", "500.00 THB", "2.00 Baht"
        r"([0-9,]+\.[0-9]{2})\s*(?:บาท|THB|baht)",
        # แบบขึ้นต้นด้วยสกุลเงิน เช่น "บาท 500.00", "฿ 500.00", "THB 1,250.00"
        r"(?:บาท|THB|฿)\s*([0-9,]+\.[0-9]{2})",
        # ตัวเลขทศนิยม 2 ตำแหน่งทั่วไป
        r"([0-9,]+\.[0-9]{2})",
    ]

    for pat in patterns:
        matches = re.findall(pat, text, flags=re.IGNORECASE)
        for m in matches:
            cleaned = m.replace(",", "").strip()
            try:
                val = float(cleaned)
                if val > 0:
                    matched = (
                        abs(val - expected_amount) < 0.01
                        if expected_amount is not None
                        else False
                    )
                    return val, matched
            except ValueError:
                continue

    return None, False


def verify_slip(image_bytes: bytes, expected_amount: Optional[float] = None) -> Dict[str, Any]:
    """
    Verify bank slip:
    1. Check for valid QR code
    2. Check transfer amount against expected amount (via Tag 54 or RapidOCR)
    """
    t_start = time.time()

    try:
        pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        return {
            "isValid": False,
            "hasQr": False,
            "qrData": None,
            "detectedAmount": None,
            "expectedAmount": expected_amount,
            "amountMatched": False,
            "error": f"ไม่สามารถเปิดไฟล์รูปภาพได้: {str(e)}",
            "elapsedMs": round((time.time() - t_start) * 1000, 2),
        }

    # Step 1: Detect QR code
    has_qr, qr_data = detect_qr_code(pil_img)
    if not has_qr:
        return {
            "isValid": False,
            "hasQr": False,
            "qrData": None,
            "slipInfo": None,
            "detectedAmount": None,
            "expectedAmount": expected_amount,
            "amountMatched": False,
            "error": "สลิปไม่ถูกต้อง! กรุณาอัปโหลดสลิปที่ถูกต้อง",
            "elapsedMs": round((time.time() - t_start) * 1000, 2),
        }

    # Extract slip QR data (Bank, DateTime, TransRef)
    slip_info = parse_slip_qr_data(qr_data) if qr_data else None

    # If no expected amount is required, having a QR code is sufficient
    if expected_amount is None or expected_amount <= 0:
        return {
            "isValid": True,
            "hasQr": True,
            "qrData": qr_data,
            "slipInfo": slip_info,
            "detectedAmount": None,
            "expectedAmount": expected_amount,
            "amountMatched": True,
            "error": None,
            "elapsedMs": round((time.time() - t_start) * 1000, 2),
        }

    # Step 2: Extract amount
    detected_amount: Optional[float] = None
    amount_matched = False
    raw_text: Optional[str] = None

    # 2.1 Check EMVCo Tag 54 in QR payload first (Instant)
    if qr_data:
        tag54_amount = parse_emv_tag54_amount(qr_data)
        if tag54_amount is not None:
            detected_amount = tag54_amount
            amount_matched = abs(detected_amount - expected_amount) < 0.01

    # 2.2 If Tag 54 didn't match or not found, perform high-speed RapidOCR
    if not amount_matched:
        ocr = get_ocr()
        # Resize to max width 1000px for speed and clarity
        w, h = pil_img.size
        ocr_img = pil_img
        if w > 1000:
            new_h = int(h * (1000.0 / w))
            ocr_img = pil_img.resize((1000, new_h), Image.Resampling.LANCZOS)

        cv_ocr = cv2.cvtColor(np.array(ocr_img), cv2.COLOR_RGB2BGR)
        ocr_res, _ = ocr(cv_ocr)

        if ocr_res:
            lines = [line[1] for line in ocr_res if len(line) > 1 and line[1]]
            raw_text = "\n".join(lines)
            ocr_amt, matches = extract_amount_from_text(raw_text, expected_amount)
            if matches:
                detected_amount = expected_amount
                amount_matched = True
            elif ocr_amt is not None:
                detected_amount = ocr_amt
                amount_matched = abs(detected_amount - expected_amount) < 0.01

    elapsed_ms = round((time.time() - t_start) * 1000, 2)

    if not amount_matched:
        expected_str = f"{expected_amount:,.2f}"
        detected_str = f"{detected_amount:,.2f}" if detected_amount is not None else "ไม่สามารถระบุได้"
        return {
            "isValid": False,
            "hasQr": True,
            "qrData": qr_data,
            "slipInfo": slip_info,
            "detectedAmount": detected_amount,
            "expectedAmount": expected_amount,
            "amountMatched": False,
            "rawText": raw_text,
            "error": f"ยอดเงินในสลิป (฿{detected_str}) ไม่ตรงกับยอดที่ต้องชำระ (฿{expected_str}) กรุณาตรวจสอบสลิปและอัปโหลดใหม่อีกครั้ง",
            "elapsedMs": elapsed_ms,
        }

    return {
        "isValid": True,
        "hasQr": True,
        "qrData": qr_data,
        "slipInfo": slip_info,
        "detectedAmount": detected_amount if detected_amount is not None else expected_amount,
        "expectedAmount": expected_amount,
        "amountMatched": True,
        "rawText": raw_text,
        "error": None,
        "elapsedMs": elapsed_ms,
    }
