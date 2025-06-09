# @forge/domains

Domain management utilities for the æForge onboarding agent. This package
implements a `DomainAgent` class that integrates with Namecheap's API to
programmatically manage DNS records.

## Usage

```js
import DomainAgent from '@forge/domains/DomainAgent.js';

const agent = new DomainAgent({
  apiUser: 'ncuser',
  apiKey: 'apikey',
  clientIp: '1.2.3.4'
});

await agent.configureHandle('example.com', 'did:plc:12345');
```

`configureHandle` will create a `_atproto` TXT record with the DID value and set
a low TTL so the AT Protocol handle can be verified quickly.
