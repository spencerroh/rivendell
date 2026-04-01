export function isNoSecureMode(): boolean {
  return process.env.NO_SECURE_DATASETS === "1";
}
