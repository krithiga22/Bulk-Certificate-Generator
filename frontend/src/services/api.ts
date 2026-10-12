import type {
  DashboardStats,
  Job,
  JobCertificatesResponse,
  JobCreatePayload,
  JobCreateResponse,
  JobListResponse,
  CertificateVerifyResult,
  CertificateItem,
} from '../types/api';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorDetail = 'Request failed';
    try {
      const errJson = await response.json();
      if (errJson.error?.message) {
        errorDetail = errJson.error.message;
      } else if (errJson.detail) {
        errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      errorDetail = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorDetail);
  }
  return response.json();
}

export const api = {
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/jobs/dashboard/stats`);
    return handleResponse<DashboardStats>(res);
  },

  async getJobs(page = 1, pageSize = 20, status?: string): Promise<JobListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    if (status && status !== 'ALL') {
      params.append('status', status);
    }
    const res = await fetch(`${API_BASE}/jobs?${params.toString()}`);
    return handleResponse<JobListResponse>(res);
  },

  async getJob(jobId: string): Promise<Job> {
    const res = await fetch(`${API_BASE}/jobs/${jobId}`);
    return handleResponse<Job>(res);
  },

  async getJobCertificates(jobId: string): Promise<JobCertificatesResponse> {
    const res = await fetch(`${API_BASE}/jobs/${jobId}/certificates`);
    return handleResponse<JobCertificatesResponse>(res);
  },

  async createJob(payload: JobCreatePayload): Promise<JobCreateResponse> {
    const res = await fetch(`${API_BASE}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<JobCreateResponse>(res);
  },

  async getAllCertificates(
    page = 1,
    pageSize = 30,
    search?: string,
    statusFilter?: string
  ): Promise<{ total: number; certificates: CertificateItem[] }> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    if (search && search.trim()) {
      params.append('search', search.trim());
    }
    if (statusFilter && statusFilter !== 'ALL') {
      params.append('status_filter', statusFilter);
    }
    const res = await fetch(`${API_BASE}/certificates?${params.toString()}`);
    return handleResponse<{ total: number; certificates: CertificateItem[] }>(res);
  },

  async verifyCertificate(code: string): Promise<CertificateVerifyResult> {
    const res = await fetch(`${API_BASE}/verify/${encodeURIComponent(code.trim())}`);
    return handleResponse<CertificateVerifyResult>(res);
  },

  getCertificateDownloadUrl(certificateId: string): string {
    return `${API_BASE}/certificates/${certificateId}/download`;
  },

  getJobReportUrl(jobId: string): string {
    return `${API_BASE}/jobs/${jobId}/report`;
  },
};
