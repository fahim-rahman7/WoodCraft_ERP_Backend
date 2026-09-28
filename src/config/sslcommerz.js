import 'dotenv/config';
import SSLCommerzPayment from 'sslcommerz-lts';

const storeId = process.env.SSLCOMMERZ_STORE_ID;
const storePass = process.env.SSLCOMMERZ_STORE_PASSWORD;
const isLive = process.env.NODE_ENV === 'production';

if (!storeId || !storePass) {
  throw new Error('SSLCommerz store credentials are missing in environment variables');
}

export const sslcommerz = new SSLCommerzPayment(storeId, storePass, isLive);