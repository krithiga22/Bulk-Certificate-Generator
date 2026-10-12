import io
import os
import uuid
from datetime import date
from pathlib import Path
from typing import Optional, Tuple

import qrcode
from PIL import Image
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

from app.config import settings


def generate_certificate_code(issue_date: date) -> str:
    """Generate a clean, professional, unique certificate code."""
    date_str = issue_date.strftime("%Y%m%d")
    random_part = uuid.uuid4().hex[:8].upper()
    return f"CERT-{date_str}-{random_part}"


class CertificateGenerator:
    def __init__(self, output_dir: Optional[Path] = None):
        self.output_dir = output_dir or settings.STORAGE_DIR
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def generate(
        self,
        certificate_id: str,
        recipient_name: str,
        event_name: str,
        issue_date: date,
        organization_name: Optional[str] = None,
        signatory_name: Optional[str] = None,
        certificate_code: Optional[str] = None,
        simulate_failure: bool = False,
    ) -> Tuple[str, str]:
        """
        Generates a PDF certificate and returns (file_path, certificate_code).
        Uses atomic file writing: writes to .tmp and renames upon completion.
        """
        if simulate_failure or "[SIMULATE_FAIL]" in recipient_name:
            raise RuntimeError("Deliberate generation failure triggered for testing")

        if not certificate_code:
            certificate_code = generate_certificate_code(issue_date)

        target_file = self.output_dir / f"{certificate_id}.pdf"
        temp_file = self.output_dir / f"{certificate_id}.tmp.pdf"

        try:
            self._render_pdf(
                output_path=temp_file,
                recipient_name=recipient_name,
                event_name=event_name,
                issue_date=issue_date,
                organization_name=organization_name or "CertiBatch Authority",
                signatory_name=signatory_name or "Academic Director",
                certificate_code=certificate_code,
            )

            # Atomic rename
            temp_file.replace(target_file)
            return str(target_file), certificate_code

        except Exception as e:
            if temp_file.exists():
                try:
                    temp_file.unlink()
                except OSError:
                    pass
            raise e

    def _render_pdf(
        self,
        output_path: Path,
        recipient_name: str,
        event_name: str,
        issue_date: date,
        organization_name: str,
        signatory_name: str,
        certificate_code: str,
    ):
        width, height = landscape(A4)
        c = canvas.Canvas(str(output_path), pagesize=(width, height))
        c.setTitle(f"Certificate - {recipient_name}")
        c.setAuthor("CertiBatch")

        # 1. Background Fill: Clean, elegant ivory-white
        c.setFillColor(colors.HexColor("#F8FAFC"))
        c.rect(0, 0, width, height, stroke=0, fill=1)

        # Subtle inner certificate card
        margin = 25
        card_w = width - (2 * margin)
        card_h = height - (2 * margin)
        c.setFillColor(colors.white)
        c.roundRect(margin, margin, card_w, card_h, 8, stroke=0, fill=1)

        # 2. Double Borders
        # Outer Gold Accent Frame
        c.setStrokeColor(colors.HexColor("#D97706"))  # Amber/Gold
        c.setLineWidth(3)
        c.rect(margin + 6, margin + 6, card_w - 12, card_h - 12, stroke=1, fill=0)

        # Inner Navy Frame
        c.setStrokeColor(colors.HexColor("#0F172A"))  # Deep Slate Navy
        c.setLineWidth(1)
        c.rect(margin + 12, margin + 12, card_w - 24, card_h - 24, stroke=1, fill=0)

        # Decorative Corner Ornaments
        corner_size = 18
        for x, y in [
            (margin + 12, margin + 12),
            (width - margin - 12 - corner_size, margin + 12),
            (margin + 12, height - margin - 12 - corner_size),
            (width - margin - 12 - corner_size, height - margin - 12 - corner_size),
        ]:
            c.setFillColor(colors.HexColor("#F59E0B"))
            c.rect(x, y, corner_size, corner_size, stroke=0, fill=1)

        # 3. Header Section
        c.setFillColor(colors.HexColor("#0F172A"))
        c.setFont("Helvetica-Bold", 14)
        c.drawCentredString(width / 2.0, height - 75, organization_name.upper())

        c.setStrokeColor(colors.HexColor("#E2E8F0"))
        c.setLineWidth(1)
        c.line(width / 2.0 - 100, height - 85, width / 2.0 + 100, height - 85)

        c.setFillColor(colors.HexColor("#D97706"))
        c.setFont("Helvetica-Bold", 26)
        c.drawCentredString(width / 2.0, height - 120, "CERTIFICATE OF COMPLETION")

        c.setFillColor(colors.HexColor("#64748B"))
        c.setFont("Helvetica", 11)
        c.drawCentredString(width / 2.0, height - 142, "THIS CERTIFICATE IS PROUDLY PRESENTED TO")

        # 4. Recipient Name
        c.setFillColor(colors.HexColor("#0F172A"))
        c.setFont("Helvetica-Bold", 30)
        c.drawCentredString(width / 2.0, height - 195, recipient_name)

        c.setStrokeColor(colors.HexColor("#D97706"))
        c.setLineWidth(1.5)
        name_width = min(400, max(240, c.stringWidth(recipient_name, "Helvetica-Bold", 30) + 40))
        c.line((width - name_width) / 2.0, height - 205, (width + name_width) / 2.0, height - 205)

        # 5. Course / Event details
        c.setFillColor(colors.HexColor("#64748B"))
        c.setFont("Helvetica", 12)
        c.drawCentredString(width / 2.0, height - 235, "for outstanding participation and successful completion of")

        c.setFillColor(colors.HexColor("#1D4ED8"))  # Vibrant Blue
        c.setFont("Helvetica-Bold", 20)
        c.drawCentredString(width / 2.0, height - 268, event_name)

        # 6. Bottom Information: Verification QR Code & Signatures
        # Verification QR Code
        verify_url = f"{settings.BASE_VERIFY_URL}/{certificate_code}"
        qr_img = self._create_qr_code(verify_url)
        qr_reader = ImageReader(qr_img)
        qr_size = 80
        qr_x = margin + 45
        qr_y = margin + 45
        c.drawImage(qr_reader, qr_x, qr_y, width=qr_size, height=qr_size, mask="auto")

        c.setFillColor(colors.HexColor("#334155"))
        c.setFont("Helvetica-Bold", 8)
        c.drawString(qr_x + qr_size + 15, qr_y + 55, "AUTHENTICITY VERIFICATION")
        c.setFont("Helvetica", 8)
        c.drawString(qr_x + qr_size + 15, qr_y + 40, f"Code: {certificate_code}")
        c.drawString(qr_x + qr_size + 15, qr_y + 25, f"Issued: {issue_date.isoformat()}")
        c.setFillColor(colors.HexColor("#64748B"))
        c.setFont("Helvetica-Oblique", 7)
        c.drawString(qr_x + qr_size + 15, qr_y + 12, "Scan QR to verify in CertiBatch portal")

        # Decorative Seal in the center
        seal_x = width / 2.0
        seal_y = margin + 85
        c.setStrokeColor(colors.HexColor("#F59E0B"))
        c.setFillColor(colors.HexColor("#FEF3C7"))
        c.circle(seal_x, seal_y, 28, stroke=1, fill=1)
        c.circle(seal_x, seal_y, 24, stroke=1, fill=0)
        c.setFillColor(colors.HexColor("#B45309"))
        c.setFont("Helvetica-Bold", 7)
        c.drawCentredString(seal_x, seal_y + 6, "OFFICIAL")
        c.drawCentredString(seal_x, seal_y - 4, "VERIFIED")
        c.drawCentredString(seal_x, seal_y - 14, "SEAL")

        # Signature on the right
        sig_x = width - margin - 220
        sig_line_w = 170
        sig_y = margin + 70
        c.setStrokeColor(colors.HexColor("#94A3B8"))
        c.setLineWidth(1)
        c.line(sig_x, sig_y, sig_x + sig_line_w, sig_y)

        c.setFillColor(colors.HexColor("#0F172A"))
        c.setFont("Helvetica-Bold", 10)
        c.drawCentredString(sig_x + (sig_line_w / 2.0), sig_y - 15, signatory_name)
        c.setFillColor(colors.HexColor("#64748B"))
        c.setFont("Helvetica", 9)
        c.drawCentredString(sig_x + (sig_line_w / 2.0), sig_y - 28, "Authorized Signature")

        c.showPage()
        c.save()

    def _create_qr_code(self, data: str) -> io.BytesIO:
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=4,
            border=1,
        )
        qr.add_data(data)
        qr.make(fit=True)
        img = qr.make_image(fill_color="#0F172A", back_color="white")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)
        return buf
