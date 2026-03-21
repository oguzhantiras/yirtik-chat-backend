import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();

app.use(cors({
  origin: ["https://oguzhantiras.com", "https://www.oguzhantiras.com"]
}));

app.use(express.json());

// Taranacak sayfalar
const PAGES_TO_SCRAPE = [
  "https://oguzhantiras.com",
  "https://oguzhantiras.com/pages/links",
  "https://oguzhantiras.com/products/yirtik-pantolon-kitap",
  "https://oguzhantiras.com/products/yirtik-pantolon-imzali-kitap",
  "https://oguzhantiras.com/products/dunya-turuna-cikma-ve-icerik-uretme-kursu",
  "https://oguzhantiras.com/yirtik-esim",
  "https://oguzhantiras.com/blogs/dunya-turu/yirtik-pantolon-oguzhan-tiras-kimdir",
  "https://oguzhantiras.com/pages/dunya-turuna-cikmak-ve-icerik-uretmek",
  "https://oguzhantiras.com/pages/seyahat-kaynaklari-ve-uygulamalar",
  "https://oguzhantiras.com/blogs/dunya-turu"
];

// HTML'den temiz metin çıkar
function extractText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 2000); // her sayfadan max 2000 karakter
}

// Tüm sayfaları tara ve birleştir
async function scrapeAllPages() {
  console.log("Siteler taranıyor...");
  const results = [];

  for (const url of PAGES_TO_SCRAPE) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
        timeout: 10000
      });
      const html = await res.text();
      const text = extractText(html);
      const label = url.replace("https://oguzhantiras.com", "") || "/";
      results.push(`=== Sayfa: ${label} ===\n${text}`);
      console.log(`Tarandı: ${url}`);
    } catch (e) {
      console.error(`Taranamadı: ${url}`, e.message);
    }
  }

  return results.join("\n\n");
}

// System prompt'u site içeriğiyle oluştur
function buildSystemPrompt(siteContent) {
  return `Sen Oğuzhan Tıraş'ın (YırtıkPantolon) resmi AI asistanısın.

Aşağıda oguzhantiras.com sitesinin güncel içeriği var. Kullanıcıların sorularını bu içeriğe dayanarak cevapla.

## Davranış Kuralları
- Samimi, sıcak, motive edici konuş — Oğuzhan'ın sesini yansıt
- Ürün fiyatı sorulunca ilgili ürün sayfasına yönlendir (fiyatlar değişken)
- Bilmediğin şeyi uydurma, emin olmadığında açıkça söyle
- Yanıtları kısa tut (3-5 cümle)
- Türkçe konuş
- Uygun yerlerde ilgili sayfaların linkini ver

## Site İçeriği
${siteContent}`;
}

// Global sistem prompt — başlangıçta yüklenir, 24 saatte bir güncellenir
let SYSTEM_PROMPT = `Sen YırtıkPantolon AI asistanısın. Oğuzhan Tıraş, yolculukları ve ürünleri hakkında yardımcı olursun. Samimi, kısa, net konuş.`;

async function refreshSiteContent() {
  try {
    const content = await scrapeAllPages();
    SYSTEM_PROMPT = buildSystemPrompt(content);
    console.log("System prompt güncellendi.");
  } catch (e) {
    console.error("Site tarama hatası:", e.message);
  }
}

// Sunucu başlarken tara, sonra her 24 saatte bir güncelle
refreshSiteContent();
setInterval(refreshSiteContent, 24 * 60 * 60 * 1000);

app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Geçersiz istek" });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 700,
        system: SYSTEM_PROMPT,
        messages: messages.slice(-10)
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const reply = data?.content?.[0]?.text || "Şu an cevap veremedim.";
    res.json({ reply });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", promptReady: SYSTEM_PROMPT.length > 200 });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server çalışıyor: ${PORT}`));
