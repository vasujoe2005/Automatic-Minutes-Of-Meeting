# Online Meeting Web Application - Backend

Production-ready backend for an AI-powered Online Meeting Web Application with automated Minutes of Meeting (MoM) generation.

## 🚀 Features

- **User Authentication**: JWT-based secure authentication with password hashing
- **Meeting Management**: Create and join meetings with unique codes
- **Real-time Communication**: Socket.IO for WebRTC signaling and in-meeting chat
- **Server-side Recording**: Meeting recording capabilities
- **AI-Powered Transcription**: OpenAI Whisper for speech-to-text
- **Intelligent Summaries**: GPT-4 generates structured meeting summaries
- **Email Notifications**: Automated meeting invites and summary alerts
- **Background Processing**: Celery for async media processing
- **RESTful API**: FastAPI with auto-generated OpenAPI documentation

## 📋 Tech Stack

- **Framework**: FastAPI 0.104+
- **Database**: PostgreSQL 15 with SQLAlchemy ORM
- **Authentication**: JWT (python-jose) with bcrypt password hashing
- **Real-time**: Python-SocketIO
- **Task Queue**: Celery with Redis broker
- **AI Services**: OpenAI (Whisper + GPT-4)
- **Media Processing**: FFmpeg
- **Email**: FastAPI-Mail with SMTP
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: Nginx with rate limiting

## 📁 Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/
│   │       │   ├── auth.py          # Authentication endpoints
│   │       │   ├── meetings.py      # Meeting CRUD
│   │       │   ├── recordings.py    # Recording processing
│   │       │   └── users.py         # User endpoints
│   │       ├── api.py               # API router
│   │       └── dependencies.py      # Shared dependencies
│   ├── core/
│   │   ├── config.py                # Settings & configuration
│   │   ├── security.py              # JWT & password utilities
│   │   └── mail.py                  # Email helper
│   ├── db/
│   │   └── session.py               # Database session
│   ├── tasks/
│   │   └── media.py                 # Celery tasks for media processing
│   ├── models.py                    # SQLAlchemy ORM models
│   ├── schemas.py                   # Pydantic schemas
│   ├── celery_app.py                # Celery configuration
│   ├── socketio_app.py              # Socket.IO server
│   └── main.py                      # FastAPI application entry point
├── alembic/
│   ├── versions/                    # Database migrations
│   └── env.py                       # Alembic environment
├── tests/
│   ├── test_auth.py                 # Authentication tests
│   └── test_meetings.py             # Meeting tests
├── docker-compose.yml               # Multi-container orchestration
├── Dockerfile                       # Backend container image
├── nginx.conf                       # Nginx reverse proxy config
├── requirements.txt                 # Python dependencies
├── .env.example                     # Environment variables template
└── README.md                        # This file
```

## 🛠️ Setup & Installation

### Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Python 3.11+ (for local development)
- PostgreSQL 15+ (if running locally without Docker)
- Redis (if running locally without Docker)

### Quick Start with Docker (Recommended)

1. **Clone the repository**
   ```bash
   cd f:/MOM/backend
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set:
   - `POSTGRES_*` - Database credentials
   - `SECRET_KEY` - Long random string for JWT
   - `SMTP_*` - Email server credentials
   - `OPENAI_API_KEY` - Your OpenAI API key

3. **Start all services**
   ```bash
   docker compose up --build -d
   ```

4. **Run database migrations**
   ```bash
   docker compose exec api alembic upgrade head
   ```

5. **Verify services**
   - API: http://localhost
   - Swagger UI: http://localhost/docs
   - Health check: http://localhost/health

### Local Development Setup

1. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Start PostgreSQL and Redis**
   ```bash
   # Using Docker
   docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:15-alpine
   docker run -d -p 6379:6379 redis:7-alpine
   ```

3. **Run migrations**
   ```bash
   alembic upgrade head
   ```

4. **Start the API server**
   ```bash
   uvicorn app.main:app --reload
   ```

5. **Start Celery worker** (in separate terminal)
   ```bash
   celery -A app.celery_app.celery_app worker --loglevel=info
   ```

## 🧪 Testing

Run the test suite:

```bash
# Using Docker
docker compose exec api pytest

# Local
pytest
```

Run with coverage:

```bash
pytest --cov=app --cov-report=html
```

## 📚 API Documentation

Once the server is running, visit:

- **Swagger UI**: http://localhost/docs
- **ReDoc**: http://localhost/redoc

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login and get JWT token |
| GET | `/api/v1/users/me` | Get current user info |
| POST | `/api/v1/meetings/meetings` | Create new meeting |
| GET | `/api/v1/meetings/meetings/{code}` | Get meeting by code |
| POST | `/api/v1/recordings/{id}/process` | Trigger AI processing |

### WebSocket Events

Connect to `ws://localhost/ws` with Socket.IO client:

| Event | Direction | Data | Description |
|-------|-----------|------|-------------|
| `connect` | → Server | - | Initial connection |
| `welcome` | ← Server | `{msg}` | Connection confirmation |
| `join_meeting` | → Server | `{meeting_code}` | Join meeting room |
| `joined` | ← Server | `{msg}` | Join confirmation |
| `send_message` | → Server | `{meeting_code, message}` | Send chat message |
| `new_message` | ← Server | `{sid, message}` | Receive chat message |
| `webrtc_signal` | ↔ Both | `{signal, target_sid}` | WebRTC signaling |

## 🔄 Background Processing Pipeline

When a recording is processed (`POST /recordings/{id}/process`):

1. **Extract Audio**: FFmpeg extracts audio from video → `.wav` file
2. **Transcribe**: OpenAI Whisper converts speech → text
3. **Summarize**: GPT-4 generates structured summary:
   - Overview paragraph
   - Key discussion points
   - Action items with owners
   - Decisions made
4. **Persist**: Save transcript and summary to database
5. **Notify**: Email meeting host with summary

## 🔐 Security Features

- **JWT Authentication**: Secure token-based auth with expiration
- **Password Hashing**: bcrypt with salt
- **Rate Limiting**: Nginx-level protection against abuse
- **CORS**: Configurable cross-origin policies
- **Security Headers**: X-Frame-Options, X-Content-Type-Options, etc.
- **Input Validation**: Pydantic schemas for all requests

## 🚢 Production Deployment

### Environment Variables (Production)

```env
# Database
POSTGRES_USER=prod_user
POSTGRES_PASSWORD=<strong-password>
POSTGRES_SERVER=db
POSTGRES_DB=mom_production

# Security
SECRET_KEY=<generate-with-openssl-rand-hex-32>

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=<app-specific-password>

# OpenAI
OPENAI_API_KEY=sk-...
```

### HTTPS Setup

1. Obtain SSL certificates (Let's Encrypt recommended)
2. Uncomment HTTPS block in `nginx.conf`
3. Mount certificates in `docker-compose.yml`:
   ```yaml
   nginx:
     volumes:
       - ./ssl:/etc/nginx/ssl:ro
   ```

### Scaling

- **Horizontal**: Add more Celery workers
  ```bash
  docker compose up --scale worker=3
  ```
- **Database**: Use managed PostgreSQL (AWS RDS, Google Cloud SQL)
- **Redis**: Use managed Redis (AWS ElastiCache, Redis Cloud)

## 🐛 Troubleshooting

**Database connection errors**:
```bash
docker compose logs db
docker compose exec api alembic current
```

**Celery tasks not running**:
```bash
docker compose logs worker
docker compose exec worker celery -A app.celery_app.celery_app inspect active
```

**Email not sending**:
- Check SMTP credentials in `.env`
- For Gmail, use App Password (not regular password)
- Verify firewall allows outbound SMTP (port 587)

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review API docs at `/docs`
