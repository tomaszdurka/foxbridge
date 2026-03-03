const BASE_URL = process.env.FOXBRIDGE_API_URL ?? 'http://localhost:3100';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    cache: 'no-store',
    ...options
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json();
}

export async function listRuns() {
  return request('/runs');
}

export async function getRun(runId) {
  return request(`/runs/${runId}`);
}

export async function listWorkspaces() {
  return request('/workspaces');
}

export async function getWorkspace(workspaceId) {
  return request(`/workspaces/${workspaceId}`);
}

export async function updateWorkspace(workspaceId, data) {
  return request(`/workspaces/${workspaceId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

export async function getWorkspaceFile(workspaceId, filename) {
  return request(`/workspaces/${workspaceId}/files/${filename}`);
}
