import axios from 'axios';

/**
 * DomainAgent integrates with Namecheap's API to manage DNS records.
 * This class handles creating and verifying _atproto TXT records for
 * automating handle verification via the AT Protocol.
 */
export default class DomainAgent {
  /**
   * @param {object} options
   * @param {string} options.apiUser - Namecheap ApiUser
   * @param {string} options.apiKey - Namecheap ApiKey
   * @param {string} options.clientIp - Authorized client IP for requests
   * @param {string} [options.baseUrl] - Base URL for Namecheap API
   */
  constructor({ apiUser, apiKey, clientIp, baseUrl = 'https://api.namecheap.com/xml.response' }) {
    this.apiUser = apiUser;
    this.apiKey = apiKey;
    this.clientIp = clientIp;
    this.baseUrl = baseUrl;
  }

  /**
   * Internal helper to send requests to Namecheap's API.
   */
  async _request(params) {
    const searchParams = new URLSearchParams({
      ApiUser: this.apiUser,
      ApiKey: this.apiKey,
      UserName: this.apiUser,
      ClientIp: this.clientIp,
      ...params,
    });
    const url = `${this.baseUrl}?${searchParams.toString()}`;
    const res = await axios.get(url, { responseType: 'text' });
    return res.data;
  }

  /**
   * Fetch existing DNS host records for a domain.
   */
  async getHosts(domain) {
    const [SLD, TLD] = domain.split('.');
    const xml = await this._request({ Command: 'namecheap.domains.dns.getHosts', SLD, TLD });
    return xml;
  }

  /**
   * Set all DNS host records for a domain.
   * `records` should be an array of objects like:
   * { HostName, RecordType, Address, TTL }
   */
  async setHosts(domain, records) {
    const [SLD, TLD] = domain.split('.');
    const base = {
      Command: 'namecheap.domains.dns.setHosts',
      SLD,
      TLD,
    };
    records.forEach((rec, i) => {
      base[`HostName${i + 1}`] = rec.HostName;
      base[`RecordType${i + 1}`] = rec.RecordType;
      base[`Address${i + 1}`] = rec.Address;
      base[`TTL${i + 1}`] = rec.TTL || '60';
    });
    const xml = await this._request(base);
    return xml;
  }

  /**
   * Convenience to add a TXT record.
   */
  async addTxtRecord(domain, host, value, ttl = 60) {
    const current = await this.getHosts(domain);
    // Minimal XML parsing to extract hosts is omitted for brevity.
    // In real code you would parse XML to objects. Here we expect caller
    // to provide full records list.
    throw new Error('addTxtRecord requires existing host parsing not implemented');
  }

  /**
   * Configure the _atproto TXT record for the provided DID.
   */
  async configureHandle(domain, did) {
    const record = {
      HostName: '_atproto',
      RecordType: 'TXT',
      Address: `did=${did}`,
      TTL: '60',
    };
    // For simplicity we replace all existing records with this single record.
    await this.setHosts(domain, [record]);
  }
}

import dns from 'dns/promises';

/**
 * Poll DNS for _atproto TXT record to verify propagation.
 * @param {string} domain
 * @param {string} did
 * @param {number} [retries=10]
 * @param {number} [delay=30000] milliseconds between polls
 */
export async function verifyRecord(domain, did, retries = 10, delay = 30000) {
  const expected = `did=${did}`;
  for (let i = 0; i < retries; i++) {
    try {
      const records = await dns.resolveTxt(`_atproto.${domain}`);
      const flat = records.flat().join('');
      if (flat.includes(expected)) return true;
    } catch (err) {
      // ignore DNS errors
    }
    await new Promise(r => setTimeout(r, delay));
  }
  return false;
}
