const { GoogleSpreadsheet } = require('google-spreadsheet');

module.exports = async function handler(req, res) {
  try {
    console.log('=== Iniciando função check-license ===');

    // Obter parâmetros da query
    const { domain, license } = req.query;
    if (!domain || !license) {
      return res.status(400).json({ error: 'Missing domain or license' });
    }

    console.log('Domínio recebido:', domain);
    console.log('Licença recebida:', license);

    // Ler variáveis de ambiente
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

    // Pegar a aba correta
    const sheet = doc.sheetsByTitle['Form_Responses'];
    if (!sheet) {
      return res.status(500).json({ error: 'Aba Form_Responses não encontrada' });
    }

    // Carregar linhas
    const rows = await sheet.getRows();
    console.log(`Linhas carregadas: ${rows.length}`);

    // Normalizar strings: trim + lowercase
    const normalize = str => str?.trim().toLowerCase();

    // Mostrar todas as linhas para debug
    rows.forEach((row, i) => {
      console.log(`Linha ${i+1}:`, normalize(row['Domínio da Loja']), normalize(row['Chave de Licença']));
    });

    // Procurar licença
    const found = rows.find(row =>
      normalize(row['Domínio da Loja']) === domain.trim().toLowerCase() &&
      normalize(row['Chave de Licença']) === license.trim().toLowerCase()
    );

    console.log('Licença encontrada?', !!found);

    return res.status(200).json({ valid: !!found });

  } catch (error) {
    console.error('Erro na função check-license:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
