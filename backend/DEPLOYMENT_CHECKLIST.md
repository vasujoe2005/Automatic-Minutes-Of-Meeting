# Deployment Checklist

## Pre-Deployment

- [ ] All environment variables configured in `.env`
- [ ] `SECRET_KEY` generated with strong random value
- [ ] Database credentials secured
- [ ] SMTP credentials configured and tested
- [ ] OpenAI API key added
- [ ] SSL certificates obtained (for HTTPS)
- [ ] Domain name configured (if applicable)

## Database Setup

- [ ] PostgreSQL instance running
- [ ] Database created
- [ ] Alembic migrations applied: `alembic upgrade head`
- [ ] Database backups configured

## Security Checklist

- [ ] JWT secret key is strong and unique
- [ ] Password hashing enabled (bcrypt)
- [ ] Rate limiting configured in Nginx
- [ ] CORS settings reviewed
- [ ] Security headers enabled
- [ ] HTTPS enabled (production)
- [ ] Firewall rules configured
- [ ] Database access restricted

## Service Verification

- [ ] FastAPI server starts: `http://localhost:8000`
- [ ] Swagger UI accessible: `http://localhost:8000/docs`
- [ ] Database connection successful
- [ ] Redis connection successful
- [ ] Celery worker running
- [ ] Socket.IO WebSocket working: `ws://localhost/ws`
- [ ] Nginx reverse proxy working

## Testing

- [ ] All pytest tests passing: `pytest`
- [ ] Authentication flow tested
- [ ] Meeting creation tested
- [ ] Recording processing tested (end-to-end)
- [ ] Email notifications working
- [ ] WebSocket events tested

## Docker Deployment

- [ ] `docker-compose.yml` configured
- [ ] All services start: `docker compose up -d`
- [ ] Health checks passing
- [ ] Logs reviewed: `docker compose logs`
- [ ] Volumes configured for persistence
- [ ] Network connectivity verified

## Monitoring & Logging

- [ ] Application logs accessible
- [ ] Error tracking configured
- [ ] Performance monitoring setup
- [ ] Database query monitoring
- [ ] Celery task monitoring

## Backup & Recovery

- [ ] Database backup strategy defined
- [ ] Backup restoration tested
- [ ] Recording files backup configured
- [ ] Disaster recovery plan documented

## Performance

- [ ] Database indexes created
- [ ] Query performance optimized
- [ ] Celery worker count scaled appropriately
- [ ] Nginx caching configured (if needed)
- [ ] Connection pooling configured

## Documentation

- [ ] API documentation reviewed (`/docs`)
- [ ] README.md updated
- [ ] Environment variables documented
- [ ] Deployment guide created
- [ ] Troubleshooting guide available

## Post-Deployment

- [ ] Smoke tests completed
- [ ] User acceptance testing done
- [ ] Performance benchmarks met
- [ ] Monitoring alerts configured
- [ ] Team notified of deployment
