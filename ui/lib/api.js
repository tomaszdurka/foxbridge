const BASE_URL = process.env.FOXBRIDGE_API_URL ?? 'http://localhost:3100';

async function request(path) {
  const res = await fetch(`${BASE_URL}${path}`, { cache: 'no-store' });
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
