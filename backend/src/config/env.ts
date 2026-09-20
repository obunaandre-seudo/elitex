import dotenv from 'dotenv';
dotenv.config();

function req(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    // Optional third-party keys should not block startup.
    return '';
  }
  return String(value).trim();
}

function parseOrigins(...values: Array<string | undefined>): string[] {
  const origins = new Set<string>();
  for (const value of values) {
    if (!value) continue;
    for (const origin of value.split(',')) {
      const normalized = origin.trim();
      if (normalized) origins.add(normalized);
    }
  }
  return [...origins];
}

const defaultClientOrigins = [
  'http://localhost:3000',
  'https://elitex-gmr5vr5ml-bae-224a.vercel.app',
];

const clientUrls = parseOrigins(process.env.CORS_ORIGINS, process.env.FRONTEND_URL, process.env.CLIENT_URL, ...defaultClientOrigins);

const cjApiKey = req('CJ_API_KEY');
const cjApiSecret = req('CJ_API_SECRET');
const cjAccessToken = req('CJ_ACCESS_TOKEN');
const cjRefreshToken = req('CJ_REFRESH_TOKEN');
const cjBaseUrl = req('CJ_API_BASE_URL', 'https://developers.cjdropshipping.com/api2.0/v1');
const cjCountry = req('CJ_COUNTRY', 'US');
const cjLanguage = req('CJ_LANGUAGE', 'en');

export const env = {
  port: parseInt(process.env.PORT || process.env.APP_PORT || '4001', 10),
  nodeEnv: req('NODE_ENV', 'development'),
  clientUrl: clientUrls[0],
  clientUrls,
  databaseUrl: req('DATABASE_URL'),
  databaseUrlPooler: req('DATABASE_URL_POOLER'),
  directUrl: req('DIRECT_URL'),
  dbDiagnosticToken: req('DB_DIAGNOSTIC_TOKEN'),
  jwt: {
    accessSecret: req('JWT_ACCESS_SECRET', 'dev_access_secret_change_me'),
    refreshSecret: req('JWT_REFRESH_SECRET', 'dev_refresh_secret_change_me'),
    accessExpiresIn: req('JWT_ACCESS_EXPIRES_IN', '15m'),
    refreshExpiresIn: req('JWT_REFRESH_EXPIRES_IN', '30d'),
  },
  cj: { apiKey: cjApiKey, apiSecret: cjApiSecret, accessToken: cjAccessToken, refreshToken: cjRefreshToken, baseUrl: cjBaseUrl, country: cjCountry, language: cjLanguage, usdToNgnRate: parseFloat(req('CJ_USD_TO_NGN_RATE', '1600')) },
  defaultMarkupPercent: parseFloat(req('DEFAULT_MARKUP_PERCENT', '1400')),
  cloudinary: { cloudName: req('CLOUDINARY_CLOUD_NAME'), apiKey: req('CLOUDINARY_API_KEY'), apiSecret: req('CLOUDINARY_API_SECRET') },
  stripe: { secretKey: req('STRIPE_SECRET_KEY'), webhookSecret: req('STRIPE_WEBHOOK_SECRET') },
  paypal: { clientId: req('PAYPAL_CLIENT_ID'), clientSecret: req('PAYPAL_CLIENT_SECRET'), mode: req('PAYPAL_MODE', 'sandbox') },
  paystack: { secretKey: req('PAYSTACK_SECRET_KEY') },
  flutterwave: { secretKey: req('FLUTTERWAVE_SECRET_KEY') },
  smtp: { host: req('SMTP_HOST'), port: parseInt(req('SMTP_PORT', '587'), 10), user: req('SMTP_USER'), pass: req('SMTP_PASS'), from: req('EMAIL_FROM', 'Elite X Shop <no-reply@elitexshop.com>') },
  rateLimit: { windowMs: parseInt(req('RATE_LIMIT_WINDOW_MS', '900000'), 10), max: parseInt(req('RATE_LIMIT_MAX', '200'), 10) },
};


