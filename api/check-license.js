const { GoogleSpreadsheet } = require('google-spreadsheet');

module.exports = async function handler(req, res) {
  try {
    console.log('Iniciando função check-license...');
    const { domain, license } = req.query;

    if (!domain || !license) {
      console.log('Parâmetros ausentes');
      return res.status(400).json({ error: 'Missing domain or license' });
    }

    const sheetId = process.env.GOOGLE_SHEETS_ID;
    const credsStr = process.env.GOOGLE_SHEETS_CREDENTIALS;

    if (!sheetId) {
      console.log('GOOGLE_SHEETS_ID ausente');
      return res.status(500).json({ error: 'Missing GOOGLE_SHEETS_ID' });
    }

    if (!credsStr) {
      console.log('GOOGLE_SHEETS_CREDENTIALS ausente');
      return res.status(500).json({ error: 'Missing GOOGLE_SHEETS_CREDENTIALS' });
    }

    let creds;
    try {
      creds = JSON.parse(credsStr);
      console.log('Credenciais JSON parseadas com sucesso');
    } catch (err) {
      console.log('Erro ao parsear JSON das credenciais:', err.message);
      return res.status(500).json({ error: 'Invalid JSON in GOOGLE_SHEETS_CREDENTIALS', details: err.message });
    }

    const doc = new GoogleSpreadsheet(sheetId);
    console.log('Documento GoogleSpreadsheet criado');

    await doc.useServiceAccountAuth(creds);
    console.log('Autenticação realizada com sucesso');

    await doc.loadInfo();
    console.log('Informações da planilha carregadas:', doc.title);

    const sheet = doc.sheetsByTitle['Form_Responses'];
    if (!sheet) {
      console.log('Aba Form_Responses não encontrada');
      return res.status(500).json({ error: 'Aba Form_Responses não encontrada' });
    }

    const rows = await sheet.getRows();
    console.log(`Total de linhas carregadas: ${rows.length}`);

    const normalize = str => str?.trim();

    const found = rows.find(row => {
      const rowDomain = normalize(row['Domínio da Loja']);
      const rowLicense = normalize(row['Chave de Licença']);
      return rowDomain === domain.trim() && rowLicense === license.trim();
    });

    console.log('Licença encontrada:', !!found);

    return res.status(200).json({ valid: !!found });
  } catch (error) {
    console.error('Erro na função check-license:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
