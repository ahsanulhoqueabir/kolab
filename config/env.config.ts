export const sb = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  secretKey: process.env.SUPABASE_SECRET_KEY,
};

export const jt = {
  secretKey: process.env.JWT_SECRET_KEY,
  expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "15d",
};

export const r2 = {
  bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
  id: process.env.CLOUDFLARE_ACCOUNT_ID,
  key: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
  secret: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  publicUrl: process.env.CLOUDFLARE_R2_PUBLIC_URL,
};

export const app = {
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  timezone: "Asia/Dhaka",
};
