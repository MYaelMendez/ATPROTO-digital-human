import os
import requests
import time
import dns.resolver
from urllib.parse import urlencode

class DomainAgent:
    NAMECHEAP_API_URL = "https://api.namecheap.com/xml.response"

    def __init__(self, api_user=None, api_key=None, client_ip=None, username=None):
        self.api_user = api_user or os.getenv("NAMECHEAP_API_USER")
        self.api_key = api_key or os.getenv("NAMECHEAP_API_KEY")
        self.client_ip = client_ip or os.getenv("NAMECHEAP_CLIENT_IP")
        self.username = username or os.getenv("NAMECHEAP_USERNAME", self.api_user)
        if not all([self.api_user, self.api_key, self.client_ip]):
            raise ValueError("Missing Namecheap API credentials")

    def _request(self, command, params):
        query = {
            "ApiUser": self.api_user,
            "ApiKey": self.api_key,
            "UserName": self.username,
            "ClientIp": self.client_ip,
            "Command": command,
            **params,
        }
        response = requests.get(self.NAMECHEAP_API_URL, params=query)
        response.raise_for_status()
        return response.text

    def set_txt_record(self, domain, host, value, ttl=60):
        return self._request(
            "namecheap.domains.dns.setHosts",
            {
                "SLD": domain.split(".")[0],
                "TLD": domain.split(".")[1],
                "HostName1": host,
                "RecordType1": "TXT",
                "Address1": value,
                "TTL1": ttl,
            },
        )

    def verify_dns(self, fqdn, expected_value, timeout=300):
        end_time = time.time() + timeout
        while time.time() < end_time:
            try:
                answers = dns.resolver.resolve(fqdn, "TXT")
                for rdata in answers:
                    if expected_value in str(rdata.strings[0], "utf-8"):
                        return True
            except Exception:
                pass
            time.sleep(30)
        return False

if __name__ == "__main__":
    import sys

    if len(sys.argv) != 3:
        print("Usage: domain_agent.py <domain> <did>")
        sys.exit(1)

    domain, did = sys.argv[1], sys.argv[2]
    agent = DomainAgent()
    agent.set_txt_record(domain, "_atproto", f"did={did}")
    fqdn = f"_atproto.{domain}"
    if agent.verify_dns(fqdn, f"did={did}"):
        print(f"{domain} verified for {did}")
    else:
        print("Verification timed out")
        sys.exit(1)
