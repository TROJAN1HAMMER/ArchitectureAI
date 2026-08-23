import { encrypt, decrypt, validateEncryptionKey } from "./encryption.js";

describe("Encryption Utility Unit Tests", () => {
  const originalKey = process.env.GITHUB_OAUTH_ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.GITHUB_OAUTH_ENCRYPTION_KEY =
      "12345678901234567890123456789012";
  });

  afterAll(() => {
    process.env.GITHUB_OAUTH_ENCRYPTION_KEY = originalKey;
  });

  it("should encrypt and decrypt a string successfully (round-trip)", () => {
    const originalText = "my-github-oauth-token-123456";
    const encrypted = encrypt(originalText);
    expect(encrypted).not.toBe(originalText);
    expect(encrypted.split(":").length).toBe(3);

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(originalText);
  });

  it("should produce different ciphertexts for repeated encryptions of the same value", () => {
    const text = "secret-token";
    const cipher1 = encrypt(text);
    const cipher2 = encrypt(text);
    expect(cipher1).not.toBe(cipher2);
  });

  it("should fail decryption if auth tag is tampered with", () => {
    const text = "secret-token";
    const encrypted = encrypt(text);
    const parts = encrypted.split(":");

    parts[2] =
      parts[2].substring(0, parts[2].length - 1) +
      (parts[2].endsWith("a") ? "b" : "a");
    const tampered = parts.join(":");

    expect(() => decrypt(tampered)).toThrow();
  });

  it("should fail if the encryption key is not exactly 32 bytes", () => {
    process.env.GITHUB_OAUTH_ENCRYPTION_KEY = "short_key";
    expect(() => encrypt("test")).toThrow(
      "GITHUB_OAUTH_ENCRYPTION_KEY must be exactly 32 bytes",
    );
    expect(() => validateEncryptionKey()).toThrow();
  });
});
