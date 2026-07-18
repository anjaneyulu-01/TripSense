# TripSense — Backend

FastAPI + MongoDB (async) backend for the TripSense AI travel platform.
Clean architecture: `routes → services → repositories → database`, with a
provider-agnostic AI layer that fails over **Grok → Gemini** seamlessly.

## Quick start

```bash
cd backend
py -3.12 -m venv .venv
.venv\Scripts\activate        # Windows PowerShell
pip install -r requirements.txt

copy .env.example .env         # then fill in your keys
python run.py                  # http://localhost:8000/docs
```

Fill these in `.env` (never commit it):

| Var           | Purpose                              |
| ------------- | ------------------------------------ |
| `MONGODB_URI` | MongoDB Atlas connection string      |
| `JWT_SECRET`  | Long random string for signing JWTs  |
| `GROK_API_KEY`| Primary AI model (xAI)               |
| `GEMINI_API_KEY`| Fallback AI model (Google)         |

The app **boots without any keys** (degraded mode): DB/auth endpoints return
`503`, and the AI endpoint returns a graceful "temporarily unavailable" until a
provider key is present. This lets the frontend be developed in parallel.

## Architecture

```
app/
  config/         # pydantic-settings, reads .env
  database/       # Motor async client + indexes
  models/         # domain documents (Mongo shape)
  schemas/        # request/response DTOs (API contract)
  repositories/   # data access (repository pattern)
  services/
    auth_service.py
    consultant_service.py     # one turn of the agentic consultant
    extraction.py             # heuristic fact extraction (agent memory)
    ai/                       # provider abstraction + fallback orchestrator
      grok_provider.py        #   primary
      gemini_provider.py      #   fallback
      service.py              #   AIService.chat() = Grok -> Gemini
  prompts/        # system prompt + prompt builder
  api/
    deps.py       # dependency injection + auth guard
    routes/       # health, auth, consult
  main.py         # app factory, lifespan, CORS, error handlers
```

## Key endpoints (prefix `/api/v1`)

| Method | Path             | Auth | Purpose                          |
| ------ | ---------------- | ---- | -------------------------------- |
| GET    | `/health`        | no   | Liveness + DB/AI status          |
| POST   | `/auth/register` | no   | Create account, returns tokens   |
| POST   | `/auth/login`    | no   | Login, returns access+refresh    |
| POST   | `/auth/refresh`  | no   | Exchange refresh for new tokens  |
| GET    | `/auth/me`       | yes  | Current user                     |
| POST   | `/consult`       | yes  | One agentic consultant turn      |

## The Grok → Gemini fallback

`AIService.chat()` walks an ordered provider chain. A provider raising a
retryable `ProviderError` (timeout, 429, 5xx, network, malformed) triggers the
next provider. Only if **all** configured providers fail does the caller get a
`ServiceUnavailableError` — surfaced to the user as a friendly message, never a
stack trace or a mention of which model failed.
```
