import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Integer,
    Date,
    DateTime,
    ForeignKey,
    Enum as SQLEnum,
    CheckConstraint,
    Index,
)
from sqlalchemy.orm import relationship
from app.database import Base


def utcnow():
    return datetime.now(timezone.utc)


def generate_uuid():
    return str(uuid.uuid4())


class JobStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    COMPLETED_WITH_ERRORS = "COMPLETED_WITH_ERRORS"
    FAILED = "FAILED"


class CertificateStatus(str, enum.Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"


class GenerationJob(Base):
    __tablename__ = "generation_jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    event_name = Column(String(255), nullable=False)
    issue_date = Column(Date, nullable=False)
    organization_name = Column(String(255), nullable=True)
    signatory_name = Column(String(255), nullable=True)

    status = Column(
        SQLEnum(JobStatus),
        nullable=False,
        default=JobStatus.PENDING,
        index=True,
    )

    total_count = Column(Integer, nullable=False, default=0)
    processed_count = Column(Integer, nullable=False, default=0)
    success_count = Column(Integer, nullable=False, default=0)
    failed_count = Column(Integer, nullable=False, default=0)

    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    certificates = relationship(
        "Certificate",
        back_populates="job",
        cascade="all, delete-orphan",
        order_by="Certificate.created_at",
    )

    __table_args__ = (
        CheckConstraint("total_count >= 0", name="chk_total_count_non_negative"),
        CheckConstraint("processed_count >= 0", name="chk_processed_count_non_negative"),
        CheckConstraint("success_count >= 0", name="chk_success_count_non_negative"),
        CheckConstraint("failed_count >= 0", name="chk_failed_count_non_negative"),
        CheckConstraint("processed_count <= total_count", name="chk_processed_lte_total"),
    )


class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    job_id = Column(
        String(36),
        ForeignKey("generation_jobs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    certificate_code = Column(String(64), unique=True, nullable=True, index=True)
    recipient_name = Column(String(255), nullable=False)
    recipient_email = Column(String(255), nullable=False)

    status = Column(
        SQLEnum(CertificateStatus),
        nullable=False,
        default=CertificateStatus.PENDING,
        index=True,
    )

    file_path = Column(String(512), nullable=True)
    error_message = Column(String(1000), nullable=True)

    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)
    issued_at = Column(DateTime(timezone=True), nullable=True)

    # Relationship
    job = relationship("GenerationJob", back_populates="certificates")

    __table_args__ = (
        Index("ix_certificates_job_status", "job_id", "status"),
    )
