const API = "";

const topicEl = document.getElementById("topic");
const instructionsEl = document.getElementById("instructions");
const brandFileEl = document.getElementById("brandFile");
const uploadZone = document.getElementById("uploadZone");
const brandPreview = document.getElementById("brandPreview");
const extractBrandBtn = document.getElementById("extractBrand");
const brandStyleEl = document.getElementById("brandStyle");
const generateBtn = document.getElementById("generate");
const statusEl = document.getElementById("status");
const errorEl = document.getElementById("error");
const brandUrlEl = document.getElementById("brandUrl");
const extractBrandByUrlBtn = document.getElementById("extractBrandByUrl");

let brandStyle = null;
let selectedFiles = [];

function showStatus(msg, type = "") {
  statusEl.textContent = msg;
  statusEl.className = "status " + type;
  errorEl.textContent = "";
}

function showError(msg) {
  errorEl.textContent = msg;
  statusEl.textContent = "";
  statusEl.className = "status";
}

function clearMessages() {
  statusEl.textContent = "";
  statusEl.className = "status";
  errorEl.textContent = "";
}

uploadZone.addEventListener("click", () => brandFileEl.click());
uploadZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadZone.classList.add("dragover");
});
uploadZone.addEventListener("dragleave", () => uploadZone.classList.remove("dragover"));
uploadZone.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadZone.classList.remove("dragover");
  const files = Array.from(e.dataTransfer.files).filter((f) =>
    /\.(png|jpg|jpeg|webp)$/i.test(f.name)
  );
  if (files.length) setFiles(files);
});

brandFileEl.addEventListener("change", () => {
  const files = Array.from(brandFileEl.files || []);
  setFiles(files);
});

function setFiles(files) {
  selectedFiles = files;
  brandPreview.innerHTML = "";
  extractBrandBtn.disabled = !files.length;
  brandStyle = null;
  brandStyleEl.innerHTML = "";
  files.forEach((file) => {
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.alt = file.name;
    brandPreview.appendChild(img);
  });
}

function renderBrandStyle(data) {
  brandStyle = data;
  brandStyleEl.innerHTML = `
    <strong>Стиль:</strong>
    ${brandStyle.primaryColor ? `<span class="swatch" style="background:${brandStyle.primaryColor}"></span> ${brandStyle.primaryColor}` : ""}
    ${brandStyle.secondaryColor ? ` · <span class="swatch" style="background:${brandStyle.secondaryColor}"></span> ${brandStyle.secondaryColor}` : ""}
    ${brandStyle.accentColor ? ` · <span class="swatch" style="background:${brandStyle.accentColor}"></span> ${brandStyle.accentColor}` : ""}
    ${brandStyle.tone ? ` · ${brandStyle.tone}` : ""}
  `;
}

extractBrandBtn.addEventListener("click", async () => {
  if (!selectedFiles.length) return;
  clearMessages();
  extractBrandBtn.disabled = true;
  showStatus("Извлекаю стиль из брендбука…", "loading");
  const form = new FormData();
  selectedFiles.forEach((f) => form.append("brandBook", f));
  try {
    const res = await fetch(`${API}/api/extract-brand`, {
      method: "POST",
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.details || "Ошибка запроса");
    renderBrandStyle(data);
    showStatus("Стиль извлечён. Можно создавать презентацию.", "success");
  } catch (e) {
    showError(e.message);
  } finally {
    extractBrandBtn.disabled = false;
  }
});

extractBrandByUrlBtn.addEventListener("click", async () => {
  const url = (brandUrlEl.value || "").trim();
  if (!url) {
    showError("Введите ссылку на брендбук.");
    return;
  }
  clearMessages();
  extractBrandByUrlBtn.disabled = true;
  showStatus("Загружаю по ссылке и извлекаю стиль…", "loading");
  try {
    const res = await fetch(`${API}/api/extract-brand-from-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.details || "Ошибка запроса");
    renderBrandStyle(data);
    showStatus("Стиль извлечён по ссылке. Можно создавать презентацию.", "success");
  } catch (e) {
    showError(e.message);
  } finally {
    extractBrandByUrlBtn.disabled = false;
  }
});

generateBtn.addEventListener("click", async () => {
  const topic = (topicEl.value || "").trim();
  if (!topic) {
    showError("Введите тему презентации.");
    return;
  }
  clearMessages();
  generateBtn.disabled = true;
  showStatus("Генерирую презентацию…", "loading");
  try {
    const res = await fetch(`${API}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, instructions: (instructionsEl.value || "").trim(), brandStyle }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || data.details || `Ошибка ${res.status}`);
    }
    const blob = await res.blob();
    const filename = res.headers.get("Content-Disposition")?.match(/filename="?([^";]+)"?/)?.[1] || "presentation.pptx";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
    showStatus("Презентация создана и сохранена.", "success");
  } catch (e) {
    showError(e.message);
  } finally {
    generateBtn.disabled = false;
  }
});
