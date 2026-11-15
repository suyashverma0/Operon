import { Request, Response } from 'express';
import {
  validateParseCommandInput,
  validateExecuteCommandInput,
} from '@openron/shared';
import { parseCommand } from '../ai/parseCommand';
import { getGeminiClient } from '../ai/gemini';
import { ParseContext, ParseOutcome } from '../ai/types';
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

      const parseContext: ParseContext = {
        referenceDate: new Date().toISOString(),
        timezone: 'Asia/Kolkata',
        customers: customerCandidates.map((c) => ({ id: c.id, name: c.name })),
        products: productCandidates.map((p) => ({ id: p.id, name: p.name, unit: p.unit as any })),
        requestId: `req-${Date.now()}`,
      };

      const outcome: ParseOutcome = await parseCommand(command, parseContext, {
        client: getGeminiClient(),
        logger: {
          info: (f, m) => logger.info(m, f),
          warn: (f, m) => logger.warn(m, f),
          error: (f, m) => logger.error(m, f),
        },
      });

      if (outcome.status === 'clarification') {
        return res.status(200).json({
          success: false,
          outcome,
          clarify: outcome.clarify,
          reason: outcome.reason,
          preview: outcome.clarify,
          requiresConfirmation: false,
        });
      }

      const parsed = outcome.command;
      let preview = '';

      switch (parsed.action) {
        case 'add_udhaar':
          preview = `${parsed.customerName} ko ₹${parsed.amount} ka udhaar jodna hai.`;
          break;
        case 'record_payment':
          preview = `${parsed.customerName} se ₹${parsed.amount} payment prapt darj karni hai.`;
          break;
        case 'add_stock':
          preview = `${parsed.productName} ke ${parsed.quantity} ${parsed.unit} stock mein jodna hai.`;
          break;
        case 'remove_stock':
          preview = `${parsed.productName} ke ${parsed.quantity} ${parsed.unit} stock se ghatana hai (${parsed.reason || 'sale'}).`;
          break;
        case 'query':
          preview = `Jankari prapt ki ja rahi hai (${parsed.queryType}).`;
          break;
      }

      return res.status(200).json({
        success: true,
        outcome,
        parsed,
        resolved: outcome.resolved,
        preview,
        requiresConfirmation: outcome.requiresConfirmation,
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

      const parseContext: ParseContext = {
        referenceDate: new Date().toISOString(),
        timezone: 'Asia/Kolkata',
        customers: customerCandidates.map((c) => ({ id: c.id, name: c.name })),
        products: productCandidates.map((p) => ({ id: p.id, name: p.name, unit: p.unit as any })),
        requestId: `req-${Date.now()}`,
      };

      const outcome = await parseCommand(command, parseContext, {
        client: getGeminiClient(),
        logger: {
          info: (f, m) => logger.info(m, f),
          warn: (f, m) => logger.warn(m, f),
          error: (f, m) => logger.error(m, f),
        },
      });

      if (outcome.status === 'clarification') {
        return res.status(200).json({
          success: false,
          outcome,
          clarify: outcome.clarify,
          reason: outcome.reason,
          message: outcome.clarify,
        });
      }

      const parsed = outcome.command;

      if (autoExecute || !outcome.requiresConfirmation) {
        req.body = { parsedCommand: parsed, confirmed: true };
        return CommandController.execute(req, res);
      }

      return res.status(200).json({
        success: true,
        outcome,
        parsed,
        resolved: outcome.resolved,
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
