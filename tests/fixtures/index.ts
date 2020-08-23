import {HttpMethod} from '../../src/lib';

const event = {
  'requestContext': {
    'elb': {
      'targetGroupArn': 'arn:aws:elasticloadbalancing:us-east-1:XXXXXXXXXXX:targetgroup/sample/6d0ecf831eec9f09'
    }
  },
  'httpMethod': 'GET',
  'path': '/monica/v1',
  'queryStringParameters': {},
  'headers': {
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'accept-encoding': 'gzip',
    'accept-language': 'en-US,en;q=0.5',
    'connection': 'keep-alive',
    'cookie': 'name=value',
    'host': 'membership.latimes.com',
    'upgrade-insecure-requests': '1',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.11; rv:60.0) Gecko/20100101 Firefox/60.0',
    'x-amzn-trace-id': 'Root=1-5bdb40ca-556d8b0c50dc66f0511bf520',
    'x-forwarded-for': '192.0.2.1',
    'x-forwarded-port': '80',
    'x-forwarded-proto': 'http'
  },
  'body': '',
  'isBase64Encoded': false
};

const multiValueHeadersEvent = {
  'requestContext': {
    'elb': {
      'targetGroupArn': 'arn:aws:elasticloadbalancing:region:123456789012:targetgroup/my-target-group/6d0ecf831eec9f09'
    }
  },
  'httpMethod': 'GET',
  'path': '/monica/v1',
  'multiValueQueryStringParameters': {},
  'multiValueHeaders': {
    'accept': ['text/html,application/xhtml+xml'],
    'accept-language': ['en-US,en;q=0.8'],
    'content-type': ['application/json; charset=utf-8'],
    'host': ['membership.latimes.com'],
    'user-agent': ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6)'],
    'x-amzn-trace-id': ['Root=1-5bdb40ca-556d8b0c50dc66f0511bf520'],
    'x-forwarded-for': ['72.21.198.66'],
    'x-forwarded-port': ['443'],
    'x-forwarded-proto': ['https'],
    'origin': ['https://membership.latimes-test-dss.caltimes.io']
  },
  'body': '',
  'isBase64Encoded': false
};

export const corsWhitelist = [
  'http://local.youareplayerone.com',
  'https://local.youareplayerone.com',
  'http://stage.youareplayerone.com',
  'https://stage.youareplayerone.com',
];

export const ampOriginDomains = [
  'ampproject.org',
  'amp.cloudflare.com',
  'bing-amp.com'
];

export const restrictedAmpOrigins = [
  'https://stage.youareplayerone.com.amp.cloudflare.com',
  'https://stage.youareplayerone.com.bing-amp.com',
  'https://stage.youareplayerone.com.cdn.ampproject.org'
];

const newEvent = (httpMethod: HttpMethod = HttpMethod.GET, path: string = '/tests') => {
  const e = JSON.parse(JSON.stringify(event));
  return Object.assign({},
     e,
     {
       httpMethod,
       path
     }
  );
};

const newMultiValueHeadersEvent = (httpMethod: HttpMethod = HttpMethod.GET, path: string = '/tests') => {
  const mvhe = JSON.parse(JSON.stringify(multiValueHeadersEvent));
  return Object.assign({},
     mvhe,
     {
       httpMethod,
       path
     }
  );
};

export {
  newEvent,
  newMultiValueHeadersEvent
};
