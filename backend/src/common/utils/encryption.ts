import * as crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

function getEncryptionKey(): Buffer {
  const keyStr = process.env.GITHUB_OAUTH_ENCRYPTION_KEY;
  if (!keyStr) {
    throw new Error(
      "GITHUB_OAUTH_ENCRYPTION_KEY environment variable is not defined",
    );
  }
  const key = Buffer.from(keyStr, "utf8");
  if (key.length !== 32) {
    throw new Error(
      `GITHUB_OAUTH_ENCRYPTION_KEY must be exactly 32 bytes. Current length: ${key.length}`,
    );
  }
  return key;
}

export function encrypt(value: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let ciphertext = cipher.update(value, "utf8", "hex");
  ciphertext += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");
  const ivStr = iv.toString("hex");

  return `${ivStr}:${ciphertext}:${authTag}`;
}

export function decrypt(value: string): string {
  const key = getEncryptionKey();
  const parts = value.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted text format");
  }

  const [ivStr, ciphertext, authTagStr] = parts;
  const iv = Buffer.from(ivStr, "hex");
  const authTag = Buffer.from(authTagStr, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export function validateEncryptionKey(): void {
  getEncryptionKey();
}
