import axios from 'axios';
import { env } from '../config/env';
import { logger } from './logger';

export interface PaymentSession { reference: string; clientSecret?: string; redirectUrl?: string; provider: string; mocked: boolean; }
export interface CreatePaymentIntentOptions { customerEmail?: string; callbackUrl?: string; metadata?: Record<string, unknown>; }

function buildDefaultCallbackUrl() { return new URL('/checkout/paystack/return', env.clientUrl).toString(); }
export async function createPaymentIntent(_provider: string, amount: number, orderNumber: string, options: CreatePaymentIntentOptions = {}): Promise<PaymentSession> {
  const provider = 'PAYSTACK';
  if (!env.paystack.secretKey) {
    logger.error('[payments] PAYSTACK_SECRET_KEY not set - cannot create Paystack checkout session');
    throw new Error('Paystack checkout is not configured.');
  }
  if (!options.customerEmail) throw new Error('Paystack requires a customer email.');
  const callbackUrl = options.callbackUrl ?? buildDefaultCallbackUrl();
  const { data } = await axios.post('https://api.paystack.co/transaction/initialize', { email: options.customerEmail, amount: Math.round(amount * 100), currency: 'NGN', callback_url: callbackUrl, metadata: { orderNumber, ...options.metadata } }, { headers: { Authorization: 'Bearer ' + env.paystack.secretKey, 'Content-Type': 'application/json' } });
  const session = data?.data;
  if (!session?.reference || !session?.authorization_url) throw new Error('Paystack did not return a valid checkout session.');
  return { reference: session.reference, redirectUrl: session.authorization_url, provider, mocked: false };
}
