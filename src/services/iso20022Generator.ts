// ISO 20022 XML Generator for Swiss payment orders (pain.001)

export interface PaymentOrder {
  creditorName: string;
  creditorIban: string;
  amount: number;
  currency: string;
  reference: string;
  executionDate: string;
  creditorAddress?: {
    street?: string;
    postalCode?: string;
    city?: string;
    country?: string;
  };
}

/**
 * Generate pain.001 XML for payment orders
 * Format: ISO 20022 pain.001.001.03 (Swiss standard)
 */
export function generatePain001(
  payments: PaymentOrder[],
  debtorName: string,
  debtorIban: string,
  debtorBic?: string
): string {
  const messageId = `MSG-${Date.now()}`;
  const creationDateTime = new Date().toISOString();
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2);
  const numberOfTransactions = payments.length.toString();

  // Generate payment information ID
  const paymentInformationId = `PMT-${Date.now()}`;

  // Get the earliest execution date
  const executionDate = payments.length > 0
    ? payments[0].executionDate
    : new Date().toISOString().split('T')[0];

  // Build XML
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n';
  xml += '  <CstmrCdtTrfInitn>\n';

  // Group Header
  xml += '    <GrpHdr>\n';
  xml += `      <MsgId>${escapeXml(messageId)}</MsgId>\n`;
  xml += `      <CreDtTm>${creationDateTime}</CreDtTm>\n`;
  xml += `      <NbOfTxs>${numberOfTransactions}</NbOfTxs>\n`;
  xml += `      <CtrlSum>${totalAmount}</CtrlSum>\n`;
  xml += '      <InitgPty>\n';
  xml += `        <Nm>${escapeXml(debtorName)}</Nm>\n`;
  xml += '      </InitgPty>\n';
  xml += '    </GrpHdr>\n';

  // Payment Information
  xml += '    <PmtInf>\n';
  xml += `      <PmtInfId>${escapeXml(paymentInformationId)}</PmtInfId>\n`;
  xml += '      <PmtMtd>TRF</PmtMtd>\n';
  xml += `      <NbOfTxs>${numberOfTransactions}</NbOfTxs>\n`;
  xml += `      <CtrlSum>${totalAmount}</CtrlSum>\n`;

  // Payment Type Information
  xml += '      <PmtTpInf>\n';
  xml += '        <SvcLvl>\n';
  xml += '          <Cd>SEPA</Cd>\n';
  xml += '        </SvcLvl>\n';
  xml += '      </PmtTpInf>\n';

  xml += `      <ReqdExctnDt>${executionDate}</ReqdExctnDt>\n`;

  // Debtor
  xml += '      <Dbtr>\n';
  xml += `        <Nm>${escapeXml(debtorName)}</Nm>\n`;
  xml += '      </Dbtr>\n';

  // Debtor Account
  xml += '      <DbtrAcct>\n';
  xml += '        <Id>\n';
  xml += `          <IBAN>${escapeXml(debtorIban.replace(/\s/g, ''))}</IBAN>\n`;
  xml += '        </Id>\n';
  xml += '      </DbtrAcct>\n';

  // Debtor Agent (BIC)
  if (debtorBic) {
    xml += '      <DbtrAgt>\n';
    xml += '        <FinInstnId>\n';
    xml += `          <BIC>${escapeXml(debtorBic)}</BIC>\n`;
    xml += '        </FinInstnId>\n';
    xml += '      </DbtrAgt>\n';
  }

  xml += '      <ChrgBr>SLEV</ChrgBr>\n';

  // Credit Transfer Transaction Information
  payments.forEach((payment, index) => {
    const endToEndId = `E2E-${Date.now()}-${index + 1}`;

    xml += '      <CdtTrfTxInf>\n';
    xml += '        <PmtId>\n';
    xml += `          <EndToEndId>${escapeXml(endToEndId)}</EndToEndId>\n`;
    xml += '        </PmtId>\n';

    // Amount
    xml += '        <Amt>\n';
    xml += `          <InstdAmt Ccy="${escapeXml(payment.currency)}">${payment.amount.toFixed(2)}</InstdAmt>\n`;
    xml += '        </Amt>\n';

    // Creditor
    xml += '        <Cdtr>\n';
    xml += `          <Nm>${escapeXml(payment.creditorName)}</Nm>\n`;
    if (payment.creditorAddress) {
      xml += '          <PstlAdr>\n';
      if (payment.creditorAddress.street) {
        xml += `            <StrtNm>${escapeXml(payment.creditorAddress.street)}</StrtNm>\n`;
      }
      if (payment.creditorAddress.postalCode) {
        xml += `            <PstCd>${escapeXml(payment.creditorAddress.postalCode)}</PstCd>\n`;
      }
      if (payment.creditorAddress.city) {
        xml += `            <TwnNm>${escapeXml(payment.creditorAddress.city)}</TwnNm>\n`;
      }
      if (payment.creditorAddress.country) {
        xml += `            <Ctry>${escapeXml(payment.creditorAddress.country)}</Ctry>\n`;
      }
      xml += '          </PstlAdr>\n';
    }
    xml += '        </Cdtr>\n';

    // Creditor Account
    xml += '        <CdtrAcct>\n';
    xml += '          <Id>\n';
    xml += `            <IBAN>${escapeXml(payment.creditorIban.replace(/\s/g, ''))}</IBAN>\n`;
    xml += '          </Id>\n';
    xml += '        </CdtrAcct>\n';

    // Remittance Information
    if (payment.reference) {
      xml += '        <RmtInf>\n';
      xml += `          <Ustrd>${escapeXml(payment.reference)}</Ustrd>\n`;
      xml += '        </RmtInf>\n';
    }

    xml += '      </CdtTrfTxInf>\n';
  });

  xml += '    </PmtInf>\n';
  xml += '  </CstmrCdtTrfInitn>\n';
  xml += '</Document>';

  return xml;
}

/**
 * Escape XML special characters
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Download XML file
 */
export function downloadPain001(
  xml: string,
  filename: string = `pain001_${Date.now()}.xml`
): void {
  const blob = new Blob([xml], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
