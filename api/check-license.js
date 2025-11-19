import { google } from "googleapis";

export default async function handler(req, res) {
  const { shop, key } = req.query;

  if (!shop || !key) {
    return res.status(400).json({ error: "Parâmetros faltando" });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    const range = "Respostas!A:D";

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];

    const dataRows = rows.slice(1);

    const found = dataRows.find(
      row => row[2] === shop && row[3] === key
    );

    if (found) {
      return res.status(200).json({ valid: true });
    }

    return res.status(403).json({ valid: false });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro interno ao validar licença" });
  }
}
