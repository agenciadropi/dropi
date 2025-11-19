const { GoogleSpreadsheet } = require('google-spreadsheet');

module.exports = async function handler(req, res) {
  try {
    const { domain, license } = req.query;

    if (!domain || !license) {
      return res.status(400).json({ error: 'Missing domain or license' });
    }

    // Variáveis de ambiente
    const sheetId = process.env.GOOGLE_SHEETS_ID;
    const credsStr = process.env.GOOGLE_SHEETS_CREDENTIALS;

    if (!sheetId) return res.status(500).json({ error: 'Missing GOOGLE_SHEETS_ID' });
    if (!credsStr) return res.status(500).json({ error: 'Missing GOOGLE_SHEETS_CREDENTIALS' });

    let creds;
    try {
      creds = JSON.parse(credsStr);
    } catch (err) {
      return res.status(500).json({ error: 'Invalid JSON in GOOGLE_SHEETS_CREDENTIALS', details: err.message });
    }

    // Conectar à planilha
    const doc = new GoogleSpreadsheet(sheetId);
    await doc.useServiceAccountAuth(creds);
    await doc.loadInfo();
    console.log('Planilha carregada:', doc.title);

    // Acessa a aba Form_Responses
    const sheet = doc.sheetsByTitle['Form_Responses'];
    if (!sheet) {
      return res.status(500).json({ error: 'Aba Form_Responses não encontrada' });
    }

    const rows = await sheet.getRows();

    // Função para normalizar nomes de coluna (remove espaços extras)
    const normalize = str => str?.trim();

    // Procurar licença
    const found = rows.find(row => {
      const rowDomain = normalize(row['Domínio da Loja']);
      const rowLicense = normalize(row['Chave de Licença']);
      return rowDomain === domain.trim() && rowLicense === license.trim();
    });

    return res.status(200).json({ valid: !!found });
  } catch (error) {
    console.error('Erro na função check-license:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
