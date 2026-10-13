# Deployment

## Railway

1. Create a Railway project from `Supriyo08/spotter_weather-risk`, branch `main`.
2. Keep the repository root as the service root. Railway uses the Dockerfile and `railway.json`.
3. Add a unique `DJANGO_SECRET_KEY` as a service variable and set `DJANGO_DEBUG=false`. Do not commit the secret.
4. Deploy, then generate a public domain under service networking.
5. Verify `/api/health/` and test the three scenarios at the public HTTPS URL.

The app uses Railway’s assigned `PORT`, trusts its HTTPS proxy when `RAILWAY_ENVIRONMENT_ID` is present, and includes `RAILWAY_PUBLIC_DOMAIN` in allowed hosts. The internal health-check hostname is also allowed. Only `/api/health/` is exempt from HTTPS redirects so internal startup checks can succeed.

See [Railway Dockerfiles](https://docs.railway.com/builds/dockerfiles) and [health checks](https://docs.railway.com/deployments/healthchecks).

## Render

The root `render.yaml` defines one free Docker web service. A multi-stage Docker build compiles React and runs Django under Gunicorn. WhiteNoise serves the frontend build from the same origin as `/api`, so no CORS configuration or separate frontend hosting is required.

## Publish

1. Push this project to a GitHub repository connected to your Render account.
2. In Render, choose **New > Blueprint** and select that repository.
3. Review the `spotter-weather-routing` service and its Free instance, then deploy.
4. Render generates `DJANGO_SECRET_KEY` and supplies the hostname and port. `DJANGO_DEBUG` is disabled.
5. Open the assigned HTTPS URL. Verify the page loads and all three scenario buttons return an assessment.

Keep the repository root as the Docker build context. Do not point Render's root directory at `backend` or `frontend`.

Health checks use `/api/health/`. A custom domain must also be added to `DJANGO_ALLOWED_HOSTS` as a comma-separated hostname list. The Render hostname is included automatically.

The app currently has no persistence requirement. Do not store future saved trips in the container's SQLite file; add a managed database when persistence is implemented.

## Local production verification

```sh
docker build -t spotter .
docker run --rm -p 8000:8000 \
  -e DJANGO_SECRET_KEY \
  -e DJANGO_SECURE_SSL_REDIRECT=false \
  spotter
```

Set a unique `DJANGO_SECRET_KEY` in your terminal environment first. The redirect override is for local HTTP only. Render uses HTTPS and trusted proxy headers.

## Deployment characteristics

Render Free services can sleep after inactivity, so the first visit may take longer to load. A paid instance can avoid sleeping, but this configuration does not request a paid plan. See [Render's free-service limits](https://render.com/docs/free).

The Docker context excludes `.env` files, local databases, virtual environments, and development dependencies. The runtime runs as a non-root user. Frontend assets and API endpoints share a process group and deploy together.

References: [Render Docker deployment](https://render.com/docs/docker), [Blueprint specification](https://render.com/docs/blueprint-spec), and [WhiteNoise configuration](https://whitenoise.readthedocs.io/en/stable/django.html).
