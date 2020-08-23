import TestRouteHandler from './TestRouteHandler';
import {EventContext, HttpMethod, RouteHandler} from '../../../src/lib';

const allowedMethods = [
  HttpMethod.HEAD,
  HttpMethod.GET,
  HttpMethod.POST,
  HttpMethod.PUT,
  HttpMethod.PATCH,
  HttpMethod.DELETE
];

export = [
  new TestRouteHandler(
     '/tests',
     {
       allowedMethods
     }
  ),
  new TestRouteHandler(
     '/tests/custom-context',
     {
       context: new Map<string, any>().set('customContextTest', true),
       allowedMethods
     }
  ),
  new TestRouteHandler(
     '/tests/:param/subPath/:param2',
     {
       allowedMethods
     }
  ),
  new TestRouteHandler(
     '/tests/middleware',
     {
       middleware: [
         async (event: any, context?: EventContext) => {
           if (!context) {
             context = new Map<string, any>();
           }
           context.set('middlewareTest', true);
           return null;
         }
       ],
       allowedMethods
     }
  ),
  new TestRouteHandler(
     '/tests/middleware-response',
     {
       middleware: [
         async (event: any, context?: EventContext) => {
           return RouteHandler.response('response from middleware');
         }
       ],
       allowedMethods
     }
  ),
  new TestRouteHandler(
     '/tests/cache-ttl',
     {
       cacheTtl: 300,
       allowedMethods
     }
  ),
  new TestRouteHandler(
     '/tests/cache-ttl-error',
     {
       cacheTtl: 300,
       middleware: [
         async (event: any, context?: EventContext) => {
           return RouteHandler.InternalServerError('Middleware should throw error response with no cache-ttl');
         }
       ],
       allowedMethods
     }
  ),
];
