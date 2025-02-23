import { httpStatus } from "../types";
import { CustomError } from "./custom.error";

export class UnauthorizedError extends CustomError {
  constructor(message: string, reasonCode?: string) {
    super(message, httpStatus.UNAUTHORIZED, reasonCode);
  }
}
