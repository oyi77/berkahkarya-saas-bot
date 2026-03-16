import crypto from 'crypto';

/**
 * Verify Telegram Login Widget data
 * 
 * @param data Data from Telegram widget
 * @param botToken Your Bot Token
 * @returns boolean True if verification success
 */
export function checkTelegramHash(data: any, botToken: string): boolean {
  if (!data || !data.hash) return false;

  const { hash, ...userData } = data;
  
  // Sort keys alphabetically
  const dataCheckArr = Object.keys(userData)
    .sort()
    .map(key => `${key}=${userData[key]}`);
  
  const dataCheckString = dataCheckArr.join('\n');
  
  // SHA256 of bot secret token
  const secretKey = crypto.createHash('sha256')
    .update(botToken)
    .digest();
  
  // HMAC-SHA256 of dataCheckString using secretKey as base
  const hmac = crypto.createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');
  
  return hmac === hash;
}
