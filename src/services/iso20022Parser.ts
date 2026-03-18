// ISO 20022 XML Parser for Swiss banking formats (camt.053 and camt.054)

export interface ParsedTransaction {
  reference: string | null;
  montant: number;
  devise: string;
  date_valeur: string;
  date_comptable: string | null;
  description: string | null;
  type: 'credit' | 'debit';
}

/**
 * Parse camt.053 XML (Bank Statement)
 * Format: ISO 20022 camt.053.001.04 (Swiss standard)
 */
export function parseCamt053(xmlContent: string): ParsedTransaction[] {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

  // Check for parsing errors
  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Erreur lors du parsing XML: ' + parserError.textContent);
  }

  const transactions: ParsedTransaction[] = [];

  // Handle Swiss banking namespaces
  const namespaces = {
    'camt': 'urn:iso:std:iso:20022:tech:xsd:camt.053.001.04',
    'camt2': 'urn:iso:std:iso:20022:tech:xsd:camt.053.001.02',
  };

  // Try to find entries with or without namespace
  let entries = xmlDoc.querySelectorAll('Ntry');
  if (entries.length === 0) {
    entries = xmlDoc.querySelectorAll('*|Ntry');
  }

  entries.forEach((entry) => {
    try {
      // Get amount
      const amtNode = entry.querySelector('Amt') || entry.querySelector('*|Amt');
      if (!amtNode) return;

      const amount = parseFloat(amtNode.textContent || '0');
      const currency = amtNode.getAttribute('Ccy') || 'CHF';

      // Get credit/debit indicator
      const cdtDbtInd = entry.querySelector('CdtDbtInd') || entry.querySelector('*|CdtDbtInd');
      const type = cdtDbtInd?.textContent === 'CRDT' ? 'credit' : 'debit';

      // Get value date
      const valDt = entry.querySelector('ValDt Dt') || entry.querySelector('*|ValDt *|Dt');
      const dateValeur = valDt?.textContent || new Date().toISOString().split('T')[0];

      // Get booking date
      const bookDt = entry.querySelector('BookgDt Dt') || entry.querySelector('*|BookgDt *|Dt');
      const dateComptable = bookDt?.textContent || null;

      // Get reference
      const acctSvcrRef = entry.querySelector('AcctSvcrRef') || entry.querySelector('*|AcctSvcrRef');
      const endToEndId = entry.querySelector('EndToEndId') || entry.querySelector('*|EndToEndId');
      const reference = acctSvcrRef?.textContent || endToEndId?.textContent || null;

      // Get description
      const addtlNtryInf = entry.querySelector('AddtlNtryInf') || entry.querySelector('*|AddtlNtryInf');
      const rmtInfUstrd = entry.querySelector('RmtInf Ustrd') || entry.querySelector('*|RmtInf *|Ustrd');
      const description = addtlNtryInf?.textContent || rmtInfUstrd?.textContent || null;

      transactions.push({
        reference,
        montant: type === 'debit' ? -Math.abs(amount) : Math.abs(amount),
        devise: currency,
        date_valeur: dateValeur,
        date_comptable: dateComptable,
        description,
        type,
      });
    } catch (error) {
      console.error('Erreur lors du parsing d\'une entrée:', error);
    }
  });

  return transactions;
}

/**
 * Parse camt.054 XML (Debit/Credit Notification)
 * Format: ISO 20022 camt.054.001.04 (Swiss standard)
 */
export function parseCamt054(xmlContent: string): ParsedTransaction[] {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

  // Check for parsing errors
  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Erreur lors du parsing XML: ' + parserError.textContent);
  }

  const transactions: ParsedTransaction[] = [];

  // Try to find notification entries with or without namespace
  let entries = xmlDoc.querySelectorAll('Ntry');
  if (entries.length === 0) {
    entries = xmlDoc.querySelectorAll('*|Ntry');
  }

  entries.forEach((entry) => {
    try {
      // Get amount
      const amtNode = entry.querySelector('Amt') || entry.querySelector('*|Amt');
      if (!amtNode) return;

      const amount = parseFloat(amtNode.textContent || '0');
      const currency = amtNode.getAttribute('Ccy') || 'CHF';

      // Get credit/debit indicator
      const cdtDbtInd = entry.querySelector('CdtDbtInd') || entry.querySelector('*|CdtDbtInd');
      const type = cdtDbtInd?.textContent === 'CRDT' ? 'credit' : 'debit';

      // Get value date
      const valDt = entry.querySelector('ValDt Dt') || entry.querySelector('*|ValDt *|Dt');
      const dateValeur = valDt?.textContent || new Date().toISOString().split('T')[0];

      // Get booking date
      const bookDt = entry.querySelector('BookgDt Dt') || entry.querySelector('*|BookgDt *|Dt');
      const dateComptable = bookDt?.textContent || null;

      // Get reference (more detailed for camt.054)
      const acctSvcrRef = entry.querySelector('AcctSvcrRef') || entry.querySelector('*|AcctSvcrRef');
      const endToEndId = entry.querySelector('NtryDtls TxDtls Refs EndToEndId') ||
        entry.querySelector('*|NtryDtls *|TxDtls *|Refs *|EndToEndId');
      const txId = entry.querySelector('NtryDtls TxDtls Refs TxId') ||
        entry.querySelector('*|NtryDtls *|TxDtls *|Refs *|TxId');

      const reference = endToEndId?.textContent || txId?.textContent || acctSvcrRef?.textContent || null;

      // Get description (more detailed for camt.054)
      const addtlNtryInf = entry.querySelector('AddtlNtryInf') || entry.querySelector('*|AddtlNtryInf');
      const rmtInfUstrd = entry.querySelector('NtryDtls TxDtls RmtInf Ustrd') ||
        entry.querySelector('*|NtryDtls *|TxDtls *|RmtInf *|Ustrd');
      const addtlTxInf = entry.querySelector('NtryDtls TxDtls AddtlTxInf') ||
        entry.querySelector('*|NtryDtls *|TxDtls *|AddtlTxInf');

      const description = rmtInfUstrd?.textContent ||
        addtlTxInf?.textContent ||
        addtlNtryInf?.textContent ||
        null;

      transactions.push({
        reference,
        montant: type === 'debit' ? -Math.abs(amount) : Math.abs(amount),
        devise: currency,
        date_valeur: dateValeur,
        date_comptable: dateComptable,
        description,
        type,
      });
    } catch (error) {
      console.error('Erreur lors du parsing d\'une entrée:', error);
    }
  });

  return transactions;
}

/**
 * Auto-detect and parse camt file
 */
export function parseCAMT(xmlContent: string): ParsedTransaction[] {
  // Detect file type based on content
  if (xmlContent.includes('camt.053') || xmlContent.includes('BkToCstmrStmt')) {
    return parseCamt053(xmlContent);
  } else if (xmlContent.includes('camt.054') || xmlContent.includes('BkToCstmrDbtCdtNtfctn')) {
    return parseCamt054(xmlContent);
  } else {
    // Try camt.053 as default
    return parseCamt053(xmlContent);
  }
}
