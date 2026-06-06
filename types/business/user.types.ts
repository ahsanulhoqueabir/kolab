export interface JwtPayload {
  profile: string;
  email: string;
  role: string;
}

export interface LoginParams {
  email: string;
  password: string;
}

export interface SignUpParams {
  email: string;
  password: string;
  name: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  image?: string | null;
  role: string;
  roleName?: string;
  permissions?: string[];
  pages?: string[];
}

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface LoginResponseData {
  user: Profile;
  token: string;
}

export interface SignUpResponseData {
  user: Profile;
  token: string;
}
