const BASE = '';

async function request(url, opts = {}) {
  const res = await fetch(`${BASE}${url}`, opts);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || body.details || `Request failed (${res.status})`);
  }
  return res;
}

export async function analyzeBrandImages(files) {
  const form = new FormData();
  files.forEach((f) => form.append('images', f));
  const res = await request('/api/brand/images', { method: 'POST', body: form });
  return res.json();
}

export async function analyzeBrandUrl(url) {
  const res = await request('/api/brand/url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  return res.json();
}

export async function generateSlides(topic, instructions, brand) {
  const res = await request('/api/presentation/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, instructions: instructions || undefined, brand: brand || undefined }),
  });
  const data = await res.json();
  return data.slides;
}

export async function getHealth() {
  const res = await request('/api/health');
  return res.json();
}

export async function setProvider(provider) {
  const res = await request('/api/provider', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider }),
  });
  return res.json();
}

export async function exportPptx(slides, brand) {
  const res = await request('/api/presentation/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slides, brand }),
  });
  const blob = await res.blob();
  const name = res.headers.get('Content-Disposition')?.match(/filename="?([^";]+)"?/)?.[1] || 'presentation.pptx';
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
