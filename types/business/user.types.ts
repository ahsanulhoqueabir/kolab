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
  username?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  username: string | null;
  role: string;
}

export interface Profile {
  id: string;
  email: string;
  name: string;
  username: string | null;
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
