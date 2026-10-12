# Deploy on Render

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
