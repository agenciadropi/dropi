const { GoogleSpreadsheet } = require('google-spreadsheet');

// Função principal da API
module.exports = async function handler(req, res) {
  try {
    // Parâmetros
    const { domain, license } = req.query;

    if (!domain || !license) {
      return res.status(400).json({ error: 'Missing domain or license' });
    }

    // Ler variáveis de ambiente
    const sheetId = process.env.GOOGLE_SHEETS_ID;
    const creds = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS);

    if (!sheetId || !creds) {
      return res.status(500).json({ error: 'Missing environment variables' });
    }

    // Conectar à planilha
    const doc = new GoogleSpreadsheet(sheetId);
    await doc.useServiceAccountAuth(creds);
    await doc.loadInfo();

    const sheet = doc.sheetsByIndex[0]; // pega a primeira aba
    await sheet.loadCells(); // carrega todas as células

    const rows = await sheet.getRows();

    // Procurar pela licença
    const found = rows.find(
      row =>
        row['Domínio da Loja']?.trim() === domain.trim() &&
        row['Chave de Licença']?.trim() === license.trim()
    );

    return res.status(200).json({ valid: !!found });
  } catch (error) {
    console.error('Error in check-license:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
