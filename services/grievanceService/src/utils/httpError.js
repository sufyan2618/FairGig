export class HttpError extends Error {
  constructor(status, code, message, details = undefined) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const raise = (status, code, message, details) => {
  throw new HttpError(status, code, message, details);
};
