import { generateKeyPair, exportPKCS8, exportSPKI } from 'jose';
import fs from 'fs';

/**
 * Utility script to generate ES256 key pair for FE JWS exchange.
 */
(async () => {
  const { privateKey, publicKey } = await generateKeyPair('ES256',{ extractable: true }); // P-256

  const pkcs8 = await exportPKCS8(privateKey);  // -----BEGIN PRIVATE KEY-----
  const spki  = await exportSPKI(publicKey);    // -----BEGIN PUBLIC KEY-----

  fs.mkdirSync('./secrets', { recursive: true });
  fs.writeFileSync('./secrets/es256-private.pk8.pem', pkcs8, 'utf8');
  fs.writeFileSync('./secrets/es256-public.spki.pem', spki, 'utf8');

  console.log('✅ Keys written to ./secrets');
})();
