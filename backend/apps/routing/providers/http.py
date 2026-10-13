import hashlib
import json
from urllib.error import URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from django.core.cache import cache


class ProviderError(Exception):
    pass


def get_json(url: str, params: dict, provider: str, ttl: int = 600):
    url = f"{url}?{urlencode(params)}"
    key = "provider:" + hashlib.sha256(url.encode()).hexdigest()
    cached = cache.get(key)
    if cached is not None:
        return cached
    request = Request(
        url,
        headers={
            "User-Agent": "SpotterAssessment/0.2 (https://github.com/Supriyo08/spotter_weather-risk)",
            "Accept": "application/json",
        },
    )
    try:
        with urlopen(request, timeout=12) as response:
            data = json.load(response)
    except (URLError, TimeoutError, OSError, ValueError) as error:
        raise ProviderError(f"{provider} is unavailable. Please try again shortly.") from error
    if isinstance(data, dict) and data.get("error"):
        raise ProviderError(f"{provider} could not complete this request.")
    cache.set(key, data, ttl)
    return data
