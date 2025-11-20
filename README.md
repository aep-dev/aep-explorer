# AEP Explorer

AEP Explorer is a web interface for exploring and interacting with [AEP-compliant](https://aep.dev) APIs.

AEP Explorer:

- Provides a way to view the resources exposed by an API described by an OpenAPI document.
- Enables exploration of the objects stored within a collection, including filtering.

## Differences from Swagger UI
[Swagger UI](https://swagger.io/tools/swagger-ui/) is designed for creating API calls
by allowing users to create request messages and view their responses.

AEP Explorer is resource-oriented. The UI does not assume that users have any familiarity
with the underlying APIs, what the requests/responses look like, or even what APIs need
to be called. Instead, it focuses on allowing users to interact with resources and 
makes the proper AEP-compliant API calls under-the-hood.

## Live Demo

AEP Explorer is available at [ui.aep.dev](https://ui.aep.dev).

## User Guide

The [online demo](https://ui.aep.dev) is the easiest way to try the project. 
Simply use the form to enter the URL of an AEP-compliant.

### Running Locally

For advanced users, the project can be deployed locally depending on
[CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS) settings.

```bash
npm install
npm run dev
```
