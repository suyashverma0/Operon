import { logger } from '../utils/logger';

export class WhatsAppService {
  static async sendUdhaarReminder(phone: string, customerName: string, amount: number) {
    logger.info(`Sending WhatsApp reminder to ${customerName} (${phone}) for ₹${amount}`);
    return {
      success: true,
      messageId: `wa-${Date.now()}`,
    };
  }
}
