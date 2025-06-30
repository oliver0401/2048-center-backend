export type EnvType = {
  dbPort: number;
  dbName: string;
  host: string;
  username: string;
  password: string;
  port: number;
  secretKey: string;
  expiresIn: number;
  stripeSecretKey: string;
  signerKey: string;
  fuseSignerKey: string;
};


export enum httpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  CONFLICT = 409,
  NOT_FOUND = 404,
  ACCEPTED = 202,
  INTERNAL_SERVER_ERROR = 500
}

export type TokenType = {
  uuid: string;
};

export type UserType = {
  username: string;
  email: string;
  password: string;
};

export enum ThemeVisibility {
  PUBLIC = "public",
  PRIVATE = "private",
  PREMIUM = "premium",
  ALL = "all",
}
