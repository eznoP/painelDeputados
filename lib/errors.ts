// erro de comunicação ou de resposta ruim da api externa (vira 502)
export class ExternalApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExternalApiError";
  }
}

// o recurso consultado não existe na api externa (vira 404)
export class ResourceNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResourceNotFoundError";
  }
}
