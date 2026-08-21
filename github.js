/**
 * GitHub Issues API wrapper — dùng Issues làm nơi lưu & giao việc quản lý dự án.
 * Token của mỗi người dùng chỉ lưu trong localStorage trình duyệt của họ,
 * không bao giờ được commit vào repo hay gửi đi nơi nào khác ngoài api.github.com.
 */
const GH_API = "https://api.github.com";
const LS_KEY = "ysdpm_config_v1";

const GitHubStore = {
  getConfig() {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY)) || {};
    } catch {
      return {};
    }
  },
  saveConfig(cfg) {
    localStorage.setItem(LS_KEY, JSON.stringify(cfg));
  },
  clearToken() {
    const cfg = this.getConfig();
    delete cfg.token;
    this.saveConfig(cfg);
  },
  isConfigured() {
    const c = this.getConfig();
    return !!(c.owner && c.repo && c.token);
  },
};

class GitHubAPI {
  constructor(owner, repo, token) {
    this.owner = owner;
    this.repo = repo;
    this.token = token;
  }

  async _fetch(path, opts = {}) {
    let res;
    try {
      res = await fetch(`${GH_API}${path}`, {
        ...opts,
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: "application/vnd.github+json",
          ...(opts.body ? { "Content-Type": "application/json" } : {}),
          ...(opts.headers || {}),
        },
      });
    } catch (networkErr) {
      // Browsers (esp. Safari) collapse network/CORS failures into a vague
      // "TypeError: Type error" with no useful detail — surface a hint instead.
      throw new Error(
        "Không gọi được api.github.com (lỗi mạng/CORS hoặc bị trình duyệt/tiện ích chặn). " +
        "Hãy kiểm tra kết nối mạng, tắt trình chặn quảng cáo/VPN thử lại, hoặc thử trình duyệt khác (Chrome). " +
        "Chi tiết: " + (networkErr && networkErr.message)
      );
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`GitHub API ${res.status}: ${text.slice(0, 300)}`);
    }
    if (res.status === 204) return null;
    return res.json();
  }

  async testConnection() {
    return this._fetch(`/repos/${this.owner}/${this.repo}`);
  }

  async listLabels() {
    return this._fetch(`/repos/${this.owner}/${this.repo}/labels?per_page=100`);
  }

  async listAssignees() {
    return this._fetch(`/repos/${this.owner}/${this.repo}/assignees?per_page=100`);
  }

  async listIssues({ state = "all" } = {}) {
    let page = 1;
    let all = [];
    for (;;) {
      const batch = await this._fetch(
        `/repos/${this.owner}/${this.repo}/issues?state=${state}&per_page=100&page=${page}`
      );
      all = all.concat(batch);
      if (batch.length < 100) break;
      page++;
      if (page > 10) break;
    }
    // filter out pull requests (Issues API also returns PRs)
    return all.filter((i) => !i.pull_request);
  }

  async createIssue({ title, body, labels, assignees }) {
    return this._fetch(`/repos/${this.owner}/${this.repo}/issues`, {
      method: "POST",
      body: JSON.stringify({ title, body, labels, assignees }),
    });
  }

  async updateIssue(number, patch) {
    return this._fetch(`/repos/${this.owner}/${this.repo}/issues/${number}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  }

  async createLabel(name, color, description) {
    try {
      return await this._fetch(`/repos/${this.owner}/${this.repo}/labels`, {
        method: "POST",
        body: JSON.stringify({ name, color, description }),
      });
    } catch (e) {
      // label may already exist — ignore
      return null;
    }
  }

  // ---- shared JSON data files (master data droplists, export log) ----
  // Stored as real files in the repo via the Contents API, so every
  // collaborator with a token that has "Contents: Read and write" sees the
  // same data. Requires that extra token permission (Issues alone is not enough).

  async getFileRaw(path) {
    return this._fetch(`/repos/${this.owner}/${this.repo}/contents/${path}`);
  }

  async putFileRaw(path, base64Content, sha, message) {
    const body = { message, content: base64Content };
    if (sha) body.sha = sha;
    return this._fetch(`/repos/${this.owner}/${this.repo}/contents/${path}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  async loadJsonFile(path, fallback) {
    try {
      const res = await this.getFileRaw(path);
      return { data: JSON.parse(base64ToUtf8(res.content)), sha: res.sha };
    } catch (e) {
      if (/GitHub API 404/.test(e.message)) return { data: fallback, sha: null };
      throw e;
    }
  }

  async saveJsonFile(path, obj, sha, message) {
    return this.putFileRaw(path, utf8ToBase64(JSON.stringify(obj, null, 2)), sha, message);
  }

  /**
   * Read-modify-write with automatic retry on 409 (someone else saved in
   * between). mutatorFn receives the current data (or `fallback` on first
   * run) and must return the new data to save.
   */
  async updateJsonFile(path, fallback, mutatorFn, message) {
    let lastErr;
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, sha } = await this.loadJsonFile(path, fallback);
      const updated = mutatorFn(structuredCloneCompat(data));
      try {
        return await this.saveJsonFile(path, updated, sha, message);
      } catch (e) {
        lastErr = e;
        if (/GitHub API 409/.test(e.message) && attempt < 2) continue;
        throw e;
      }
    }
    throw lastErr;
  }
}

function utf8ToBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}
function base64ToUtf8(b64) {
  return decodeURIComponent(escape(atob(b64.replace(/\n/g, ""))));
}
function structuredCloneCompat(obj) {
  return typeof structuredClone === "function" ? structuredClone(obj) : JSON.parse(JSON.stringify(obj));
}

// ---- shared task/issue body convention ----
// **Dự án:** ...
// **Mô tả:** ...
// **Hạn hoàn thành:** YYYY-MM-DD
// **Người giao việc:** <login>
function buildIssueBody({ project, description, dueDate, assignedBy }) {
  const lines = [];
  if (project) lines.push(`**Dự án:** ${project}`);
  if (description) lines.push(`**Mô tả:** ${description}`);
  if (dueDate) lines.push(`**Hạn hoàn thành:** ${dueDate}`);
  if (assignedBy) lines.push(`**Người giao việc:** @${assignedBy}`);
  return lines.join("\n\n");
}

function parseIssueBody(body) {
  const out = { project: "", description: "", dueDate: "", assignedBy: "" };
  if (!body) return out;
  const projMatch = body.match(/\*\*Dự án:\*\*\s*([^\n]+)/);
  if (projMatch) out.project = projMatch[1].trim();
  const dueMatch = body.match(/\*\*Hạn hoàn thành:\*\*\s*(\d{4}-\d{2}-\d{2})/);
  if (dueMatch) out.dueDate = dueMatch[1];
  const descMatch = body.match(/\*\*Mô tả:\*\*\s*([^\n]+)/);
  if (descMatch) out.description = descMatch[1].trim();
  const byMatch = body.match(/\*\*Người giao việc:\*\*\s*@?(\S+)/);
  if (byMatch) out.assignedBy = byMatch[1];
  return out;
}

function taskStatus(issue) {
  if (issue.state === "closed") return "done";
  const { dueDate } = parseIssueBody(issue.body);
  if (dueDate) {
    const today = new Date().toISOString().slice(0, 10);
    if (dueDate < today) return "overdue";
  }
  return "open";
}
