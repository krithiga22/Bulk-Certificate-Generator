export type JobStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'COMPLETED_WITH_ERRORS'
  | 'FAILED';

export type CertificateStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface RecipientInput {
  name: string;
  email: string;
}

export interface JobCreatePayload {
  event_name: string;
  issue_date: string;
  organization_name?: string;
  signatory_name?: string;
  recipients: RecipientInput[];
}

export interface JobCreateResponse {
  job_id: string;
  status: JobStatus;
  total_count: number;
  status_url: string;
}

export interface Job {
  id: string;
  event_name: string;
  issue_date: string;
  organization_name?: string | null;
  signatory_name?: string | null;
  status: JobStatus;
  total_count: number;
  processed_count: number;
  success_count: number;
  failed_count: number;
  pending_count: number;
  progress_percentage: number;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  status_url: string;
  results_url: string;
  report_url: string;
}

export interface CertificateItem {
  id: string;
  recipient_name: string;
  recipient_email: string;
  status: CertificateStatus;
  certificate_code?: string | null;
  download_url?: string | null;
  error_message?: string | null;
  issued_at?: string | null;
}

export interface JobCertificatesResponse {
  job_id: string;
  event_name: string;
  total: number;
  certificates: CertificateItem[];
}

export interface CertificateVerifyResult {
  valid: boolean;
  status: string;
  certificate_code?: string | null;
  recipient_name?: string | null;
  event_name?: string | null;
  issue_date?: string | null;
  organization_name?: string | null;
  signatory_name?: string | null;
  issued_at?: string | null;
  message: string;
}

export interface DashboardStats {
  total_jobs: number;
  certificates_issued: number;
  jobs_processing: number;
  failed_recipients: number;
  recent_jobs: Job[];
}

export interface JobListResponse {
  total: number;
  page: number;
  page_size: number;
  items: Job[];
}
