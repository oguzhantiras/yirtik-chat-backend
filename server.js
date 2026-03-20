import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();

app.use(cors({
  origin: ["https://oguzhantiras.com", "https://www.oguzhantiras.com"]
}));
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});
app.use(express.json());

const SYSTEM_PROMPT = `Sen YırtıkPantolon AI asistanısın.
Oğuzhan Tıraş, yolculukları, projeleri, içerikleri, ürünleri ve seyahat deneyimi hakkında yardımcı olursun.
Samimi, kısa, net ve doğal konuş.
Bilmediğin şeyi uydurma.
Emin olmadığında bunu açıkça söyle.
Gerektiğinde kullanıcıyı ilgili sayfaya yönlendir.`;

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
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server çalışıyor: ${PORT}`));
