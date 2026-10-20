export class CustomError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class CustomNotFoundError extends CustomError {
  constructor(message: string) {
    super(message, 404);
  }
}
