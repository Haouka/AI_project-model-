import { CaseDetail, CaseListItem, DemoPreset, AuditEventItem, User } from "../types";

const API_BASE = "/api/v1";

class ApiClient {
  private token: string | null = localStorage.getItem("docshield_token");

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem("docshield_token", token);
    } else {
      localStorage.removeItem("docshield_token");
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    if (this.token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${this.token}`);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMsg = `HTTP ${response.status} ${response.statusText}`;
      try {
        const errJson = await response.json();
        errorMsg = errJson.detail || JSON.stringify(errJson);
      } catch (e) {
        // ignore
      }
      throw new Error(errorMsg);
    }

    return response.json();
  }

  async login(username: string, password: string): Promise<{ access_token: string; user: User }> {
    const data = await this.request<{
      access_token: string;
      token_type: string;
      user_id: number;
      username: string;
      full_name: string;
      role: any;
    }>("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    this.setToken(data.access_token);
    return {
      access_token: data.access_token,
      user: {
        id: data.user_id,
        username: data.username,
        full_name: data.full_name,
        role: data.role,
        email: `${data.username}@docshield.ai`,
        is_active: true,
      },
    };
  }

  async getMe(): Promise<User> {
    return this.request<User>("/auth/me");
  }

  async listCases(params?: {
    status?: string;
    document_type?: string;
    priority?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    total: number;
    active_cases: number;
    needs_review: number;
    completed: number;
    high_priority: number;
    items: CaseListItem[];
  }> {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.document_type) query.set("document_type", params.document_type);
    if (params?.priority) query.set("priority", params.priority);
    if (params?.search) query.set("search", params.search);
    if (params?.limit) query.set("limit", params.limit.toString());
    if (params?.offset) query.set("offset", params.offset.toString());

    return this.request(`/cases?${query.toString()}`);
  }

  async getCase(caseId: string): Promise<CaseDetail> {
    return this.request<CaseDetail>(`/cases/${caseId}`);
  }

  async createCase(title: string, document_type: string): Promise<{ case_id: string }> {
    return this.request<{ case_id: string }>("/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, document_type }),
    });
  }

  async uploadDocuments(
    caseId: string,
    documentFile: File,
    livePhotoFile?: File | null
  ): Promise<any> {
    const formData = new FormData();
    formData.append("document_file", documentFile);
    if (livePhotoFile) {
      formData.append("live_photo_file", livePhotoFile);
    }

    return this.request(`/cases/${caseId}/documents`, {
      method: "POST",
      body: formData,
    });
  }

  async processCase(caseId: string): Promise<any> {
    return this.request(`/cases/${caseId}/process`, {
      method: "POST",
    });
  }

  async recordReview(
    caseId: string,
    action: string,
    notes?: string,
    reason?: string
  ): Promise<any> {
    return this.request(`/cases/${caseId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, notes, reason }),
    });
  }

  async getAuditTrail(caseId: string): Promise<{ case_id: string; count: number; events: AuditEventItem[] }> {
    return this.request(`/audit/${caseId}`);
  }

  async getAnalytics(): Promise<any> {
    return this.request("/analytics");
  }

  async getDemoPresets(): Promise<DemoPreset[]> {
    return this.request<DemoPreset[]>("/demo/presets");
  }

  async seedDemoCases(): Promise<any> {
    return this.request("/demo/seed", { method: "POST" });
  }

  async getRules(): Promise<any> {
    return this.request("/rules");
  }
}

export const api = new ApiClient();
