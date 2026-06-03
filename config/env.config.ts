export const sb = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  secretKey: process.env.SUPABASE_SECRET_KEY,
};

export const jt = {
  secretKey: process.env.JWT_SECRET_KEY,
  expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "15d",
};
