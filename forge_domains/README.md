# Forge Domains

The `forge_domains` package provides tooling to automate DNS record management for AT Protocol domain handles. It currently includes a skeleton `DomainAgent` that integrates with the Namecheap API for creating and verifying `_atproto` TXT records.

## Usage

Set the following environment variables:

- `NAMECHEAP_API_USER` – Namecheap API username
- `NAMECHEAP_API_KEY` – Namecheap API key
- `NAMECHEAP_CLIENT_IP` – The whitelisted client IP for Namecheap API access
- `NAMECHEAP_USERNAME` – (optional) Namecheap account username if different from `NAMECHEAP_API_USER`

```bash
python forge_domains/domain_agent.py yourdomain.com did:plc:example
```

This will attempt to create or update the `_atproto` TXT record for `yourdomain.com` with the specified DID and poll DNS until the record is visible.
