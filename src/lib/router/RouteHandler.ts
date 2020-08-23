import { v4 as uuidv4 } from 'uuid';
import {
  HttpMethod,
  HttpStatus,
  LambdaAlbResponse,
  LambdaAlbRoute,
  RouteHandlerOptions,
  RouteMiddlewareHandler
} from "./models";

export default abstract class RouteHandler implements LambdaAlbRoute {

  readonly path: string;
  readonly context: Map<string, any> = new Map();
  readonly middleware: Array<RouteMiddlewareHandler> = [];
  readonly cacheTtl: number = 0;
  readonly allowedMethods: Array<HttpMethod> = [];

  constructor(
     path: string,
     options?: RouteHandlerOptions
  ) {
    this.path = path;

    if (options) {
      const {
        context,
         middleware,
         cacheTtl,
         allowedMethods
      } = options;

      if (context) {
        this.context = context;
      }

      if (middleware) {
        this.middleware = middleware;
      }

      if (cacheTtl) {
        this.cacheTtl = cacheTtl;
      }

      if (allowedMethods) {
        this.allowedMethods = allowedMethods;
      }
    }
  }

  static getNotFoundDetail(method: string, path: string, allowedMethods: Array<string>) {
    return `Method: ${method} is not allowed for path: ${path}. Allowed methods: ${allowedMethods}`;
  }

  static NotFoundError(detail?: string): LambdaAlbResponse {
    return RouteHandler.errorResponse(HttpStatus.NOT_FOUND, detail);
  }

  static NotAllowedError(detail?: string): LambdaAlbResponse {
    return RouteHandler.errorResponse(HttpStatus.METHOD_NOT_ALLOWED, detail);
  }

  static NotImplementedError(detail?: string): LambdaAlbResponse {
    return RouteHandler.errorResponse(HttpStatus.NOT_IMPLEMENTED, detail);
  }

  static BadRequestError(detail?: string): LambdaAlbResponse {
    return RouteHandler.errorResponse(HttpStatus.BAD_REQUEST, detail);
  }

  static NotAuthorizedError(detail?: string): LambdaAlbResponse {
    return RouteHandler.errorResponse(HttpStatus.FORBIDDEN, detail);
  }

  static NotAcceptable(detail?: string): LambdaAlbResponse {
    return RouteHandler.errorResponse(HttpStatus.NOT_ACCEPTABLE, detail);
  }

  static UnsupportedMediaType(detail?: string): LambdaAlbResponse {
    return RouteHandler.errorResponse(HttpStatus.UNSUPPORTED_MEDIA_TYPE, detail);
  }

  static Conflict(detail?: string): LambdaAlbResponse {
    return RouteHandler.errorResponse(HttpStatus.CONFLICT, detail);
  }

  static InternalServerError(detail?: string): LambdaAlbResponse {
    return RouteHandler.errorResponse(HttpStatus.INTERNAL_SERVER_ERROR, detail);
  }

  static errorResponse(statusCode: number, detail?: string): LambdaAlbResponse {
    const error = {
      id: uuidv4(),
      detail: detail || HttpStatus.getStatusText(statusCode)
    };
    return RouteHandler.response(error, statusCode);
  }

  static response(body: any, statusCode: number = HttpStatus.OK, options?: any): LambdaAlbResponse {
    const statusText = HttpStatus.getStatusText(statusCode);
    const responseBody = (body != null && typeof body != 'string') ? JSON.stringify(body) : body;
    const baseResponse = {
      isBase64Encoded: false,
      statusCode: statusCode,
      statusDescription: `${statusCode} ${statusText}`,
      body: responseBody || statusText
    };

    return {
      ...baseResponse,
      ...options
    };
  }
}
