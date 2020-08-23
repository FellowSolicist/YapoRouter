import {LambdaAlbEvent, LambdaAlbResponse} from './router/models';

export const mapToJsonObject = (map: Map<string, any>) => {
  const obj: any = {};
  map.forEach((value: string, key: string) => {
    obj[key] = value;
  });
  return obj;
};

export const getRequestQueryParameter = (
   event: LambdaAlbEvent,
   queryParam: string,
   defaultValue?: string
): string | null => {
  if (event.multiValueQueryStringParameters) {
    return event.multiValueQueryStringParameters[queryParam]
       ? event.multiValueQueryStringParameters[queryParam][0] : (defaultValue ? defaultValue : null);
  } else {
    return event.queryStringParameters && event.queryStringParameters[queryParam]
       ? event.queryStringParameters[queryParam] : (defaultValue ? defaultValue : null);
  }
}

export const getRequestHeader = (event: LambdaAlbEvent, headerName: string): string | null => {
  if (event.multiValueHeaders) {
    const headers = event.multiValueHeaders;
    return headers && headers[headerName] ? headers[headerName][0] : null;
  } else {
    const headers = event.headers;
    return headers ? headers[headerName] : null;
  }
}

export const getResponseHeader = (response: LambdaAlbResponse, headerName: string) => {
  const headers = response.multiValueHeaders;
  return headers[headerName] ? headers[headerName][0] : null;
};

export const isErrorStatusCode = (statusCode: number): boolean => {
  return (Math.trunc(statusCode / 100) > 3);
}
