import {ALBEvent} from "aws-lambda";

export * as HttpStatus from 'http-status-codes';

export enum HttpMethod {
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
  GET = 'GET',
  PUT = 'PUT',
  POST = 'POST',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  TRACE = 'TRACE'
}

export enum ContentType {
  json='application/json; charset=utf-8'
}

export interface RouterOptions {
  corsWhiteList?: Array<string>;
  ampOrigins?: Array<string>;
  healthCheckHandler?: LambdaAlbRoute;
}

export interface LambdaAlbEvent extends ALBEvent {
  origin: string | null;
  host: string | null;
  payload: any;
}

export interface LambdaAlbResponse {
  isBase64Encoded: boolean;
  multiValueHeaders?: any;
  statusCode: number;
  statusDescription: string;
  body: string;
}

export interface LambdaAlbRoute {
  path: string;
  context: Map<string, any>;
  middleware: Array<RouteMiddlewareHandler>;
  cacheTtl: number;
  allowedMethods: Array<HttpMethod>;
  head?: RouteMethodHandler;
  options?: RouteMethodHandler;
  get?: RouteMethodHandler;
  post?: RouteMethodHandler;
  put?: RouteMethodHandler;
  patch?: RouteMethodHandler;
  delete?: RouteMethodHandler
}

export type EventContext = Map<string, any>;

export interface RouteHandlerOptions {
  context?: EventContext;
  middleware?: Array<RouteMiddlewareHandler>;
  cacheTtl?: number;
  allowedMethods: Array<HttpMethod>;
}

export interface RouteMethodHandler {
  (event: LambdaAlbEvent, context?: EventContext): Promise<LambdaAlbResponse>;
}

export interface RouteMiddlewareHandler {
  (event: any, context?: EventContext): Promise<LambdaAlbResponse | null>;
}

export const isLambdaAlbResponse = (object: any): object is LambdaAlbResponse => {
  return object &&
     (object as LambdaAlbResponse).isBase64Encoded !== undefined &&
     (object as LambdaAlbResponse).statusCode !== undefined &&
     (object as LambdaAlbResponse).statusDescription !== undefined;
}
