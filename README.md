# soxy

> notice: soxy had some big changes, see [here](#update)

soxy is a simple proxy that allows you to forward requests.

## usage

### hosting

soxy is a cloudflare worker, so you can host it yourself (recommended).
you can optionally use the public instance for development, but please do host it yourself for production.

[![deploy to cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/dragsbruh/soxy)

### basic usage

using soxy is as simple as this:

to send a get request to `https://example.com/hello-world`, you would need to go to:

```
https://soxy.dragsbruh.workers.dev/example.com/hello-world
```

or alternatively, you can use the `x-forward-to` header:

```
x-forward-to: example.com
```

```
https://soxy.dragsbruh.workers.dev/hello-world
```

### advanced usage

- soxy strips these following headers from your request for obvious reasons:

  ```ts
  constructedheaders.delete('sorigin');
  constructedheaders.delete('x-forward-to');
  constructedheaders.delete('x-redirect-behavior');
  ```

- soxy will also add additional headers to the response:

  ```ts
  responseheaders.set('x-resolved', url.tostring());
  responseheaders.set('x-resolved-method', request.method);
  responseheaders.set('x-resolved-url', response?.url ?? url.tostring());

  // redirect prevention
  responseheaders.set('cache-control', 'no-cache, no-store, must-revalidate');
  responseheaders.set('pragma', 'no-cache');
  responseheaders.set('expires', '0');
  ```

  you can use these headers for debugging or for other purposes.

  soxy will not be sending these headers if there was no attempt by soxy to fetch from the origin server, it will even send these if origin server didnt connect.

- soxy will add an `x-forwarded-for` header with a randomly generated ip.

- soxy will convert all status codes from 300 to 400 to 307.

- soxy will perform all redirections automatically (from `fetch()` api)

  you can customize this behavior by setting the `x-redirect-behavior` header or the `soxy-redirects` query parameter to either `manual`, `follow` or `error`.

## faq

### can i use the public instance for my personal tools?

yeah, but you shouldnt. the public instance is... public and may exceed the free tier rate limits. please host it yourself. its free, takes a few clicks and is easy to use.

### does it cache responses?

no, soxy is a proxy, not a cache. it will not cache responses.

### will this be constantly updated?

not really, i will occasionally make changes to the code. please fork it or contribute to it if you want to make changes.

## todo

- add optional authorization (will be disabled on public instance)
- customize the `/docs` redirect

## update

soxy had a decently sized rewrite, and it's pretty more flexible now.

- soxy now supports using `x-forward-to` header.

  if you are still using `sorigin` header, it will be removed in the future, please use `x-forward-to` instead.

- a domain can also be specified in path itself, eg: `/example.com/docs` will forward to `example.com/docs`

  note that if a valid domain was already specified in the headers, that will take precedence.

  this is useful when you want to add links as they cause a `get` request.

## extra

i ran [lcase](https://github.com/dragsbruh/lcase) on this file, great tool to lowercase your files!

> _**@notclavilux**, please host it yourself!_ >:o
