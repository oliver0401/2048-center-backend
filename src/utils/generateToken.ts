import { Env } from "../env";
import jwt from "jsonwebtoken";

export const generateToken = (uuid: string): string => {
  const { secretKey } = Env;
  return `Bearer ${jwt.sign({ uuid }, secretKey || "express")}`; // Permanent token without expiration
};

export const generateResetToken = (email: string): string => {
  const { secretKey } = Env;
  return jwt.sign({ email }, secretKey || "express"); // Permanent reset token without expiration
};
