import { Request, Response } from 'express';
import {
  validateParseCommandInput,
  validateExecuteCommandInput,
  ParsedCommand,
} from '@openron/shared';
import { parseCommand } from '../ai/parseCommand';
import { CustomerService } from '../services/customerService';
import { ProductService } from '../services/productService';
import { TransactionService } from '../services/transactionService';
import { ReportService } from '../services/reportService';
import { logger } from '../utils/logger';

export class CommandController {
  /**
   * Decoupled Step 1: Parse natural language command into validated JSON schema.
   * AI parser NEVER modifies the database.
   */
  static async parse(req: Request, res: Response) {
    const validation = validateParseCommandInput(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: validation.error.message,
      });
    }

    const { command } = validation.data;
    const storeId = req.storeId!;

    try {
      // Fetch store context: known customer and product candidates for disambiguation
      const [customerCandidates, productCandidates] = await Promise.all([
        CustomerService.findCandidates(storeId),
        ProductService.findCandidates(storeId),
      ]);

      const parsed: ParsedCommand = await parseCommand(command, {
        storeId,
        referenceDate: new Date().toISOString().split('T')[0],
        timezone: 'Asia/Kolkata',
        customerCandidates,
        productCandidates,
      });

      // Prepare preview description and confirmation requirement
      let preview = '';
      let requiresConfirmation = false;

      switch (parsed.action) {
        case 'add_udhaar':
          preview = `${parsed.customerName} ko ₹${parsed.amount} ka udhaar jodna hai.`;
          requiresConfirmation = true;
          break;
        case 'record_payment':
          preview = `${parsed.customerName} se ₹${parsed.amount} payment prapt darj karni hai.`;
          requiresConfirmation = true;
          break;
        case 'add_stock':
          preview = `${parsed.productName} ke ${parsed.quantity} ${parsed.unit} stock mein jodna hai.`;
          requiresConfirmation = true;
          break;
        case 'remove_stock':
          preview = `${parsed.productName} ke ${parsed.quantity} ${parsed.unit} stock se ghatana hai (${parsed.reason || 'sale'}).`;
          requiresConfirmation = true;
          break;
        case 'query':
          preview = `Jankari prapt ki ja rahi hai (${parsed.queryType}).`;
          requiresConfirmation = false;
          break;
        case 'needs_clarification':
          preview = parsed.clarify;
          requiresConfirmation = false;
          break;
      }

      return res.status(200).json({
        success: true,
        parsed,
        preview,
        requiresConfirmation,
      });
    } catch (err: any) {
      logger.error('Error during command parsing:', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to process command. Please try again.',
      });
    }
  }

  /**
   * Decoupled Step 2: Backend strictly validates and executes the business action.
   */
  static async execute(req: Request, res: Response) {
    const validation = validateExecuteCommandInput(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: validation.error.message,
      });
    }

    const { parsedCommand } = validation.data;
    const storeId = req.storeId!;

    try {
      switch (parsedCommand.action) {
        case 'add_udhaar': {
          const result = await TransactionService.addUdhaar(
            storeId,
            parsedCommand.customerName,
            parsedCommand.amount,
            parsedCommand.relativeDate,
            parsedCommand.notes
          );
          return res.status(200).json({
            success: true,
            action: parsedCommand.action,
            message: result.message,
            data: result,
          });
        }

        case 'record_payment': {
          const result = await TransactionService.recordPayment(
            storeId,
            parsedCommand.customerName,
            parsedCommand.amount,
            parsedCommand.relativeDate,
            parsedCommand.paymentMethod,
            parsedCommand.notes
          );
          return res.status(200).json({
            success: true,
            action: parsedCommand.action,
            message: result.message,
            data: result,
          });
        }

        case 'add_stock': {
          const result = await ProductService.addStock(
            storeId,
            parsedCommand.productName,
            parsedCommand.quantity,
            parsedCommand.unit,
            parsedCommand.costPrice
          );
          return res.status(200).json({
            success: true,
            action: parsedCommand.action,
            message: `${parsedCommand.productName} ke ${parsedCommand.quantity} ${parsedCommand.unit} stock mein safaltapoorvak jud gaye.`,
            data: result,
          });
        }

        case 'remove_stock': {
          const result = await ProductService.removeStock(
            storeId,
            parsedCommand.productName,
            parsedCommand.quantity,
            parsedCommand.unit,
            parsedCommand.reason
          );
          return res.status(200).json({
            success: true,
            action: parsedCommand.action,
            message: `${parsedCommand.productName} ke ${parsedCommand.quantity} ${parsedCommand.unit} stock se hata diye gaye.`,
            data: result,
          });
        }

        case 'query': {
          let queryResult: any;
          switch (parsedCommand.queryType) {
            case 'balance': {
              if (!parsedCommand.customerName) {
                queryResult = await ReportService.getTotalPendingUdhaar(storeId);
              } else {
                queryResult = await ReportService.getCustomerBalance(
                  storeId,
                  parsedCommand.customerName
                );
              }
              break;
            }
            case 'stock': {
              if (!parsedCommand.productName) {
                const products = await ProductService.findCandidates(storeId);
                queryResult = {
                  message: `Kul ${products.length} products stock mein darj hain.`,
                  products,
                };
              } else {
                queryResult = await ReportService.getProductStock(
                  storeId,
                  parsedCommand.productName
                );
              }
              break;
            }
            case 'sales': {
              queryResult = await ReportService.getTodaySales(storeId);
              break;
            }
            case 'pending_udhaar': {
              queryResult = await ReportService.getTotalPendingUdhaar(storeId);
              break;
            }
            case 'greeting': {
              queryResult = {
                message: 'Namaste! Main OPENRON hoon, aapka dukan sahayak. Kahiye main aapki kya madad karu?',
              };
              break;
            }
            default:
              queryResult = { message: 'Query type samajh nahi aaya.' };
          }

          return res.status(200).json({
            success: true,
            action: parsedCommand.action,
            message: queryResult.message,
            data: queryResult,
          });
        }

        case 'needs_clarification': {
          return res.status(200).json({
            success: false,
            action: parsedCommand.action,
            clarify: parsedCommand.clarify,
            message: parsedCommand.clarify,
          });
        }
      }
    } catch (err: any) {
      logger.error('Error executing parsed command:', err);
      return res.status(400).json({
        success: false,
        error: err.message || 'Operation failed.',
      });
    }
  }

  /**
   * End-to-end endpoint: Parse and execute in single transaction when auto-confirm is enabled or for queries.
   */
  static async process(req: Request, res: Response) {
    const validation = validateParseCommandInput(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: validation.error.message,
      });
    }

    const { command } = validation.data;
    const storeId = req.storeId!;
    const autoExecute = req.body.autoExecute !== false;

    try {
      const [customerCandidates, productCandidates] = await Promise.all([
        CustomerService.findCandidates(storeId),
        ProductService.findCandidates(storeId),
      ]);

      const parsed: ParsedCommand = await parseCommand(command, {
        storeId,
        referenceDate: new Date().toISOString().split('T')[0],
        timezone: 'Asia/Kolkata',
        customerCandidates,
        productCandidates,
      });

      if (parsed.action === 'needs_clarification') {
        return res.status(200).json({
          success: false,
          action: parsed.action,
          clarify: parsed.clarify,
          message: parsed.clarify,
          parsed,
        });
      }

      if (autoExecute) {
        // Forward to execution
        req.body = { parsedCommand: parsed, confirmed: true };
        return CommandController.execute(req, res);
      }

      return res.status(200).json({
        success: true,
        action: parsed.action,
        parsed,
        requiresConfirmation: true,
      });
    } catch (err: any) {
      logger.error('Error processing command:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Command processing failed.',
      });
    }
  }
}
