import crypto from 'crypto';

// Generate RSA key pair for a user
export function generateKeyPair(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });
  
  return { publicKey, privateKey };
}

// Generate a random symmetric key for message encryption
export function generateSymmetricKey(): string {
  return crypto.randomBytes(32).toString('base64');
}

// Encrypt symmetric key with recipient's public key
export function encryptSymmetricKey(symmetricKey: string, publicKey: string): string {
  const buffer = Buffer.from(symmetricKey, 'base64');
  const encrypted = crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    },
    buffer
  );
  return encrypted.toString('base64');
}

// Decrypt symmetric key with recipient's private key
export function decryptSymmetricKey(encryptedKey: string, privateKey: string): string {
  const buffer = Buffer.from(encryptedKey, 'base64');
  const decrypted = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    },
    buffer
  );
  return decrypted.toString('base64');
}

// Encrypt message content with symmetric key
export function encryptMessage(content: string, symmetricKey: string): { iv: string; encrypted: string } {
  const key = Buffer.from(symmetricKey, 'base64');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(content, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const authTag = cipher.getAuthTag();
  
  return {
    iv: iv.toString('base64'),
    encrypted: encrypted + '.' + authTag.toString('base64')
  };
}

// Decrypt message content with symmetric key
export function decryptMessage(encryptedData: { iv: string; encrypted: string }, symmetricKey: string): string {
  const key = Buffer.from(symmetricKey, 'base64');
  const iv = Buffer.from(encryptedData.iv, 'base64');
  
  const [encrypted, authTag] = encryptedData.encrypted.split('.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(Buffer.from(authTag, 'base64'));
  
  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Generate security code for verification
export function generateSecurityCode(publicKey1: string, publicKey2: string): string {
  // Combine and hash public keys to create a unique security code
  const combined = [publicKey1, publicKey2].sort().join('');
  const hash = crypto.createHash('sha256').update(combined).digest('hex');
  
  // Format as groups of 5 digits for easier reading
  const code = hash.substring(0, 20);
  return code.match(/.{1,5}/g)?.join(' ') || code;
}

// Verify security code
export function verifySecurityCode(code: string, publicKey1: string, publicKey2: string): boolean {
  const expectedCode = generateSecurityCode(publicKey1, publicKey2);
  return code.replace(/\s/g, '') === expectedCode.replace(/\s/g, '');
}
