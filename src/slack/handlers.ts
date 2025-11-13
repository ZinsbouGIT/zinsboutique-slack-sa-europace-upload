import { WebClient } from '@slack/web-api';
import axios from 'axios';
import { logger } from '../utils/logger';
import { config } from '../utils/config';
import { processUpload } from '../services/processor';
import { parseWithAI, fillDefaultsForTest } from '../services/aiPdfParser';
import { createEuropacePayload } from '../services/europaceMapper';

export async function handleFileUpload(
  file: any,
  client: WebClient
): Promise<void> {
  const { id, name, url_private, user } = file;

  logger.info('Processing PDF upload', {
    fileId: id,
    fileName: name,
    user,
  });

  try {
    // Determine mode for display
    const mode = config.europace.testMode ? 'TEST_MODUS' : 'ECHT_GESCHAEFT';
    const modeEmoji = config.europace.testMode ? '🧪' : '🏭';
    const modeDescription = config.europace.testMode
      ? 'This is test data, not real business'
      : 'Real production data';

    // Send initial acknowledgment
    const ackMessage = await client.chat.postMessage({
      channel: config.slack.channelId,
      text: `🔄 Processing PDF: *${name}*\nExtracting data with AI and uploading to Europace...`,
    });

    // Download the PDF from Slack
    logger.info('Downloading PDF from Slack', { fileId: id });
    const pdfBuffer = await downloadFile(url_private, config.slack.botToken);

    // Update message to show progress
    await client.chat.update({
      channel: config.slack.channelId,
      ts: ackMessage.ts!,
      text: `🔄 Processing PDF: *${name}*\n✅ Downloaded\n🧠 Extracting data with AI...\n⏳ Uploading to Europace (${mode})...`,
    });

    // Process upload to Europace (this handles everything)
    logger.info('Starting Europace upload process');
    const result = await processUpload(pdfBuffer, name);

    // Parse PDF again to show extracted data in Slack (for user feedback)
    let extractedData = await parseWithAI(pdfBuffer);
    extractedData = fillDefaultsForTest(extractedData);

    // Count populated fields
    const totalExtracted = Object.keys(extractedData).filter(
      k => extractedData[k as keyof typeof extractedData] !== null &&
           extractedData[k as keyof typeof extractedData] !== undefined
    ).length;

    // Send success message
    await client.chat.update({
      channel: config.slack.channelId,
      ts: ackMessage.ts!,
      text: [
        `✅ *Successfully Uploaded to Europace (${mode})*`,
        `📄 File: *${name}*`,
        ``,
        `*Europace Response:*`,
        `🆔 Vorgang ID: \`${result.vorgangId}\``,
        `📎 Document ID: \`${result.documentId}\``,
        ``,
        `*Extracted Data Summary:*`,
        `📊 Total Fields: *${totalExtracted}* fields populated`,
        `👤 Name: ${extractedData.vorname} ${extractedData.nachname}`,
        `📧 Email: ${extractedData.email || 'N/A'}`,
        `📱 Phone: ${extractedData.telefonnummer || 'N/A'}`,
        `🎂 DOB: ${extractedData.geburtsdatum || 'N/A'}`,
        `👨‍👩‍👧‍👦 Family: ${extractedData.familienstand || 'N/A'}${extractedData.anzahlKinder ? ` (${extractedData.anzahlKinder} children)` : ''}`,
        `🏢 Employer: ${extractedData.arbeitgeber || 'N/A'}`,
        `💰 Net Income: ${extractedData.nettoeinkommenMonatlich ? `€${extractedData.nettoeinkommenMonatlich}` : 'N/A'}`,
        `🏠 Address: ${[extractedData.strasse, extractedData.hausnummer, extractedData.plz, extractedData.ort].filter(Boolean).join(' ') || 'N/A'}`,
        `🏡 Property: ${extractedData.objektart || 'N/A'}${extractedData.wohnflaeche ? ` (${extractedData.wohnflaeche}m²)` : ''}`,
        `💵 Purchase Price: ${extractedData.kaufpreis ? `€${extractedData.kaufpreis.toLocaleString()}` : 'N/A'}`,
        `💎 Equity: ${extractedData.eigenkapital ? `€${extractedData.eigenkapital.toLocaleString()}` : 'N/A'}`,
        ``,
        `${modeEmoji} *Mode: ${mode}* - ${modeDescription}`,
      ].join('\n'),
    });

    // Optionally upload the payload as JSON for reference
    const vorgangPayload = await createEuropacePayload(extractedData);
    const vorgangPayloadJson = JSON.stringify(vorgangPayload, null, 2);
    await client.files.uploadV2({
      channel_id: config.slack.channelId,
      file: Buffer.from(vorgangPayloadJson, 'utf-8'),
      filename: `vorgang-payload-${result.vorgangId}-${Date.now()}.json`,
      title: '📋 Payload Sent to Europace',
      initial_comment: `*📋 Payload Sent to Europace*\nVorgang ID: \`${result.vorgangId}\`\nAll ${totalExtracted} extracted fields`,
    });

    logger.info('Successfully uploaded to Europace', {
      fileId: id,
      fileName: name,
      vorgangId: result.vorgangId,
      documentId: result.documentId,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    logger.error('Failed to process PDF upload', {
      fileId: id,
      fileName: name,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Send error message to Slack
    await client.chat.postMessage({
      channel: config.slack.channelId,
      text: [
        `❌ *Failed to upload to Europace*`,
        `📄 File: *${name}*`,
        `⚠️ Error: ${errorMessage}`,
        ``,
        `Please check the logs or contact support.`,
      ].join('\n'),
    });
  }
}

async function downloadFile(
  url: string,
  token: string
): Promise<Buffer> {
  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: 'arraybuffer',
    });

    return Buffer.from(response.data);
  } catch (error) {
    logger.error('Failed to download file from Slack', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error('Failed to download file from Slack');
  }
}
