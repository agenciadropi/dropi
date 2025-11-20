import { GoogleSpreadsheet } from 'google-spreadsheet';

export default async function handler(req, res) {
  try {
    const { domain, license } = req.query;
    if (!domain || !license) {
      return res.status(400).json({ error: 'Missing domain or license' });
    }

    const sheetId = process.env.GOOGLE_SHEETS_ID;
    const credsStr = process.env.GOOGLE_SHEETS_CREDENTIALS;
    if (!sheetId) return res.status(500).json({ error: 'Missing GOOGLE_SHEETS_ID' });
    if (!credsStr) return res.status(500).json({ error: 'Missing GOOGLE_SHEETS_CREDENTIALS' });

    const creds = JSON.parse(credsStr);
    const doc = new GoogleSpreadsheet(sheetId);
    await doc.useServiceAccountAuth(creds);
    await doc.loadInfo();

    const sheet = doc.sheetsByTitle['Form_Responses'];
    if (!sheet) return res.status(500).json({ error: 'Aba Form_Responses não encontrada' });

    const rows = await sheet.getRows();
    const normalize = str => str?.trim();

    const found = rows.find(
      row =>
        normalize(row['Domínio da Loja']) === domain.trim() &&
        normalize(row['Chave de Licença']) === license.trim()
    );

    return res.status(200).json({ valid: !!found });
  } catch (error) {
    console.error('Erro na função check-license:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
