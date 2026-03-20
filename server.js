import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/chat", async (req, res) => {
  const userMsg = req.body.message;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 500,
        system: "Sen YırtıkPantolon AI asistanısın.",
        messages: [{ role: "user", content: userMsg }]
      })
    });

    const data = await response.json();
    res.json({ reply: data.content[0].text });

  } catch (e) {
    res.status(500).json({ error: "Hata oluştu" });
  }
});

app.listen(3000, () => console.log("Server çalışıyor"));
