export class AppError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const raise = (status: number, code: string, message: string): never => {
  throw new AppError(status, code, message);
};
