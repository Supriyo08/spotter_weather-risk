from .http import ProviderError, get_json


def search_locations(query: str) -> list[dict]:
    data = get_json(
        "https://geocoding-api.open-meteo.com/v1/search",
        {
            "name": query,
            "count": 6,
            "language": "en",
            "format": "json",
        },
        "Location search",
        ttl=86400,
    )
    try:
        return [
            {
                "name": ", ".join(
                    dict.fromkeys(
                        filter(
                            None,
                            [
                                item["name"],
                                item.get("admin1"),
                                item.get("country"),
                            ],
                        )
                    )
                ),
                "latitude": item["latitude"],
                "longitude": item["longitude"],
            }
            for item in data.get("results", [])
        ]
    except (KeyError, TypeError, AttributeError) as error:
        raise ProviderError("Location search returned an invalid response.") from error
