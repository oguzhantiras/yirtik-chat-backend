import express from "express";
import cors from "cors";

const app = express();

app.use(cors({
  origin: ["https://oguzhantiras.com", "https://www.oguzhantiras.com"]
}));

app.use(express.json({ limit: "1mb" }));

const PAGE_CONFIG = [
  {
    key: "home",
    url: "https://oguzhantiras.com",
    title: "Ana Sayfa",
    keywords: ["oguzhan", "yırtıkpantolon", "yirtikpantolon", "kim", "hikaye", "genel"]
  },
  {
    key: "links",
    url: "https://oguzhantiras.com/pages/links",
    title: "Linkler",
    keywords: ["link", "sosyal medya", "youtube", "instagram", "tiktok", "facebook", "iletişim", "iletisim", "iş birliği", "is birligi", "medya"]
  },
  {
    key: "bio",
    url: "https://oguzhantiras.com/blogs/dunya-turu/yirtik-pantolon-oguzhan-tiras-kimdir",
    title: "Oğuzhan Kimdir",
    keywords: ["kimdir", "kim", "nereli", "üniversite", "universite", "eğitim", "egitim", "hayatı", "hayati", "biyografi", "kaç yaş", "kac yas"]
  },
  {
    key: "book",
    url: "https://oguzhantiras.com/products/yirtik-pantolon-kitap",
    title: "E-Kitap",
    keywords: ["kitap", "e-kitap", "ekitap", "hikayeler", "satın al", "satinal", "ürün", "urun"]
  },
  {
    key: "signedBook",
    url: "https://oguzhantiras.com/products/yirtik-pantolon-imzali-kitap",
    title: "İmzalı Kitap",
    keywords: ["imzalı", "imzali", "kitap", "signed"]
  },
  {
    key: "course",
    url: "https://oguzhantiras.com/products/dunya-turuna-cikma-ve-icerik-uretme-kursu",
    title: "Kurs",
    keywords: ["kurs", "eğitim", "egitim", "içerik üretimi", "icerik uretimi", "video", "ders"]
  },
  {
    key: "esim",
    url: "https://oguzhantiras.com/yirtik-esim",
    title: "Yırtık eSIM",
    keywords: ["esim", "internet", "sim", "paket", "data", "bağlantı", "baglanti", "yurtdışı internet", "yurtdisi internet"]
  },
  {
    key: "resources",
    url: "https://oguzhantiras.com/pages/seyahat-kaynaklari-ve-uygulamalar",
    title: "Seyahat Kaynakları",
    keywords: ["uygulama", "uygulamalar", "kaynak", "seyahat", "ucuz uçak", "ucuz ucak", "hostel", "backpack", "gezi"]
  }
];

const PRODUCTS = {
  book: {
    id: "book",
    title: "Yırtık Pantolon'dan Hikayeler",
    url: "https://oguzhantiras.com/products/yirtik-pantolon-kitap",
    image: "https://cdn.shopify.com/s/files/1/0654/5404/7384/files/yirtikpantolonkitap.png?v=1718282910",
    subtitle: "E-kitap",
    buttonText: "İncele"
  },
  signedBook: {
    id: "signedBook",
    title: "Yırtık Pantolon İmzalı Kitap",
    url: "https://oguzhantiras.com/products/yirtik-pantolon-imzali-kitap",
    image: "https://cdn.shopify.com/s/files/1/0654/5404/7384/files/yirtikpantolonkitap.png?v=1718282910",
    subtitle: "İmzalı özel baskı",
    buttonText: "İncele"
  },
  course: {
    id: "course",
    title: "Dünya Turuna Çıkma ve İçerik Üretme Kursu",
    url: "https://oguzhantiras.com/products/dunya-turuna-cikma-ve-icerik-uretme-kursu",
    image: "https://cdn.shopify.com/s/files/1/0654/5404/7384/files/dunyaturuvesosyalmedyayaicerikuretmekursu.jpg?v=1722887581",
    subtitle: "Kurs",
    buttonText: "Kursa Git"
  },
  esim: {
    id: "esim",
    title: "Yırtık eSIM",
    url: "https://oguzhantiras.com/yirtik-esim",
    image: "https://cdn.shopify.com/s/files/1/0654/5404/7384/files/yirtikesimlogo.webp?v=1774052546",
    subtitle: "190+ ülke internet",
    buttonText: "eSIM'e Git"
  }
};
const BASE_RULES = `
Sen Oğuzhan Tıraş'ın (YırtıkPantolon) resmi AI asistanısın.

## Tarz
- Türkçe konuş.
- Samimi, net ve doğal konuş.
- Gereksiz uzatma.
- Cevapları genelde 3-6 cümle tut.

## Bilgi Kullanımı
- Sadece sana verilen site içeriğine dayan.
- Emin olmadığın şeyi ASLA uydurma.
- Bilgi yoksa şöyle söyle:
  "Buna dair net bilgi bende yok ama şu sayfaya bakabilirsin:"
- Ürün fiyatı sorulursa tahmin yapma, link ver.

## Format (ÇOK ÖNEMLİ)
Cevapları HER ZAMAN düzenli yaz:

**Başlık varsa kalın yaz**

Kısa açıklama (1-2 cümle)

Alt bölüm:
• madde
• madde

Yeni bölüm:
• madde
• madde

- ASLA tek paragraf yazma
- Maddeleri mutlaka satır satır yaz
- Gereksiz emoji kullanma

## Link Kullanımı
- Linkleri her zaman ayrı satırda ver
- Uygunsa yönlendirme yap

## Ürün Mantığı
- Ürünleri yazı içinde doğal şekilde öner
- Ama satış gibi itici olma
- Backend ayrıca ürün kartı dönecek (tekrar anlatma)
`;

const FALLBACK_PROMPT = `
${BASE_RULES}

Şu an ayrıntılı site içeriği hazır değil. Yine de kısa ve dürüst cevap ver.
`;

let pageCache = {};
let lastRefreshAt = null;

function normalizeText(str = "") {
  return str
    .toLowerCase()
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u");
}

function extractText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/(p|div|section|article|h1|h2|h3|h4|li|br)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function cleanPageText(text) {
  const lines = text
    .split("\n")
    .map(x => x.trim())
    .filter(Boolean)
    .filter(x => x.length > 20)
    .filter(x => !/sepete ekle|cookie|gizlilik|privacy|navigation|menu|arama|search|hesabim|account/i.test(x));

  return lines.join("\n").slice(0, 2500);
}

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; YirtikPantolonBot/1.0)"
    }
  });

  if (!res.ok) {
    throw new Error(`Sayfa alınamadı: ${url} (${res.status})`);
  }

  const html = await res.text();
  const text = cleanPageText(extractText(html));
  return text;
}

async function refreshPages() {
  const nextCache = {};

  for (const page of PAGE_CONFIG) {
    try {
      const text = await fetchPage(page.url);
      nextCache[page.key] = {
        ...page,
        text
      };
      console.log(`OK: ${page.key}`);
    } catch (err) {
      console.error(`FAIL: ${page.key} -> ${err.message}`);
    }
  }

  if (Object.keys(nextCache).length > 0) {
    pageCache = nextCache;
    lastRefreshAt = new Date().toISOString();
    console.log("Site cache güncellendi.");
  }
}

function scorePage(question, page) {
  const q = normalizeText(question);
  let score = 0;

  for (const kw of page.keywords) {
    const k = normalizeText(kw);
    if (q.includes(k)) score += 3;
  }

  const pageText = normalizeText(page.text || "");
  const qWords = q.split(/\s+/).filter(w => w.length > 2);

  for (const word of qWords) {
    if (pageText.includes(word)) score += 1;
  }

  return score;
}

function getRelevantPages(question, limit = 3) {
  const pages = Object.values(pageCache);

  if (!pages.length) return [];

  const scored = pages
    .map(page => ({ page, score: scorePage(question, page) }))
    .sort((a, b) => b.score - a.score);

  const top = scored.filter(x => x.score > 0).slice(0, limit).map(x => x.page);

  if (top.length) return top;

  return scored.slice(0, 2).map(x => x.page);
}

function buildSystemPrompt(question) {
  const relevantPages = [
    pageCache["bio"],
    ...getRelevantPages(question, 2)
  ].filter(Boolean);

  if (!relevantPages.length) {
    return FALLBACK_PROMPT;
  }

  const siteContext = relevantPages.map(page => {
    return `### ${page.title}
URL: ${page.url}
İçerik:
${page.text}`;
  }).join("\n\n");

  return `
${BASE_RULES}

Aşağıda kullanıcının sorusuyla en alakalı site içerikleri var.
Cevabı öncelikle bunlara dayanarak ver.

${siteContext}
`;
}

function getSuggestedProducts(question, reply = "") {
  const text = normalizeText(`${question} ${reply}`);
  const result = [];

  if (text.includes("esim") || text.includes("internet") || text.includes("baglanti") || text.includes("sim")) {
    result.push(PRODUCTS.esim);
  }

  if (text.includes("kurs") || text.includes("icerik") || text.includes("egitim") || text.includes("video")) {
    result.push(PRODUCTS.course);
  }

  if (text.includes("imzali")) {
    result.push(PRODUCTS.signedBook);
  }

  if (text.includes("kitap") || text.includes("hikaye") || text.includes("ebook") || text.includes("e-kitap")) {
    result.push(PRODUCTS.book);
  }

  if (!result.length && (text.includes("ne satiyor") || text.includes("urun") || text.includes("ürün") || text.includes("neler var"))) {
    result.push(PRODUCTS.esim, PRODUCTS.book, PRODUCTS.course);
  }

  return result.slice(0, 3);
}

app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;
const cleanMessages = messages.slice(-10).map(m => ({
  role: m.role,
  content: m.content
}));
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Geçersiz istek" });
  }

  const lastUserMessage = [...messages].reverse().find(m => m.role === "user")?.content || "";
  const systemPrompt = buildSystemPrompt(lastUserMessage);

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
  system: systemPrompt,
  messages: cleanMessages
})
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("ANTHROPIC ERROR:", data);
      return res.status(response.status).json({
        error: data?.error?.message || "Anthropic hatası"
      });
    }

    const reply = data?.content?.[0]?.text || "Şu an cevap veremedim.";
    const products = getSuggestedProducts(lastUserMessage, reply);

    res.json({ reply, products });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    cachedPages: Object.keys(pageCache).length,
    lastRefreshAt
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`Server çalışıyor: ${PORT}`);
  await refreshPages();
});

setInterval(refreshPages, 1000 * 60 * 60 * 6);
