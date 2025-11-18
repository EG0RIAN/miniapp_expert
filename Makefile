.PHONY: help install setup-db start-db stop-db start-backend start-frontend start-all stop-all clean test migrate shell logs

# Variables
PYTHON = python3
PIP = pip3
VENV = api-django/venv
DJANGO_DIR = api-django
SITE_DIR = site
DOCKER_COMPOSE = docker-compose

# Colors for output
RED = \033[0;31m
GREEN = \033[0;32m
YELLOW = \033[1;33m
BLUE = \033[0;34m
NC = \033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)MiniApp Expert - Local Development$(NC)"
	@echo ""
	@echo "$(GREEN)Available commands:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(BLUE)Quick start:$(NC)"
	@echo "  make install        # Install all dependencies"
	@echo "  make start-all      # Start all services"
	@echo ""

install: ## Install all dependencies (Docker, Python, Node.js)
	@echo "$(GREEN)Installing dependencies...$(NC)"
	@echo "$(YELLOW)1. Installing Docker containers...$(NC)"
	$(DOCKER_COMPOSE) up -d postgres pocketbase
	@echo "$(YELLOW)2. Setting up Python environment...$(NC)"
	cd $(DJANGO_DIR) && $(PYTHON) -m venv venv
	cd $(DJANGO_DIR) && . venv/bin/activate && $(PIP) install -r requirements.txt
	@echo "$(YELLOW)3. Installing Node.js dependencies for site...$(NC)"
	cd $(SITE_DIR) && npm install
	@echo "$(GREEN)✓ All dependencies installed$(NC)"

setup-env: ## Setup .env files from templates
	@echo "$(YELLOW)Setting up environment files...$(NC)"
	@if [ ! -f $(DJANGO_DIR)/.env ]; then \
		echo "$(RED)Creating .env for Django...$(NC)"; \
		echo "SECRET_KEY=$$($(PYTHON) -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')" > $(DJANGO_DIR)/.env; \
		echo "DEBUG=True" >> $(DJANGO_DIR)/.env; \
		echo "ALLOWED_HOSTS=localhost,127.0.0.1" >> $(DJANGO_DIR)/.env; \
		echo "DATABASE_URL=postgresql://miniuser:minipass@localhost:5432/miniapp" >> $(DJANGO_DIR)/.env; \
		echo "DB_HOST=localhost" >> $(DJANGO_DIR)/.env; \
		echo "DB_PORT=5432" >> $(DJANGO_DIR)/.env; \
		echo "DB_DATABASE=miniapp" >> $(DJANGO_DIR)/.env; \
		echo "DB_USER=miniuser" >> $(DJANGO_DIR)/.env; \
		echo "DB_PASSWORD=minipass" >> $(DJANGO_DIR)/.env; \
		echo "TBANK_TERMINAL_KEY=1760898345975" >> $(DJANGO_DIR)/.env; \
		echo "TBANK_PASSWORD=6dhspXy8F7ql\$$PgJ" >> $(DJANGO_DIR)/.env; \
		echo "TBANK_API_URL=https://securepay.tinkoff.ru/v2" >> $(DJANGO_DIR)/.env; \
		echo "APP_BASE_URL=http://localhost:8000" >> $(DJANGO_DIR)/.env; \
		echo "FRONTEND_BASE_URL=http://localhost:1234" >> $(DJANGO_DIR)/.env; \
		echo "API_BASE_URL=http://localhost:8000" >> $(DJANGO_DIR)/.env; \
		echo "MAGIC_SECRET=$$($(PYTHON) -c 'import secrets; print(secrets.token_urlsafe(32))')" >> $(DJANGO_DIR)/.env; \
		echo "CORS_ALLOWED_ORIGINS=http://localhost:1234,http://127.0.0.1:1234" >> $(DJANGO_DIR)/.env; \
		echo "SMTP_HOST=smtp.mail.ru" >> $(DJANGO_DIR)/.env; \
		echo "SMTP_PORT=465" >> $(DJANGO_DIR)/.env; \
		echo "SMTP_USE_TLS=False" >> $(DJANGO_DIR)/.env; \
		echo "SMTP_USE_SSL=True" >> $(DJANGO_DIR)/.env; \
		echo "SMTP_USER=no-reply@miniapp.expert" >> $(DJANGO_DIR)/.env; \
		echo "SMTP_PASS=YOUR_SMTP_PASSWORD" >> $(DJANGO_DIR)/.env; \
		echo "MAIL_FROM=MiniAppExpert <no-reply@miniapp.expert>" >> $(DJANGO_DIR)/.env; \
		echo "CELERY_BROKER_URL=redis://localhost:6379/0" >> $(DJANGO_DIR)/.env; \
		echo "CELERY_RESULT_BACKEND=redis://localhost:6379/0" >> $(DJANGO_DIR)/.env; \
		echo "$(GREEN)✓ Django .env created$(NC)"; \
	else \
		echo "$(GREEN)✓ Django .env already exists$(NC)"; \
	fi

setup-db: install ## Setup database (run migrations)
	@echo "$(YELLOW)Setting up database...$(NC)"
	@sleep 3  # Wait for PostgreSQL to be ready
	cd $(DJANGO_DIR) && . venv/bin/activate && $(PYTHON) manage.py migrate
	@echo "$(GREEN)✓ Database migrations applied$(NC)"

start-db: ## Start PostgreSQL and PocketBase containers
	@echo "$(GREEN)Starting database services...$(NC)"
	$(DOCKER_COMPOSE) up -d postgres pocketbase
	@echo "$(GREEN)✓ PostgreSQL and PocketBase started$(NC)"
	@echo "  $(BLUE)PostgreSQL:$(NC) localhost:5432"
	@echo "  $(BLUE)PocketBase:$(NC) http://localhost:8090"

stop-db: ## Stop database containers
	@echo "$(YELLOW)Stopping database services...$(NC)"
	$(DOCKER_COMPOSE) stop postgres pocketbase
	@echo "$(GREEN)✓ Database services stopped$(NC)"

start-redis: ## Start Redis (for Celery)
	@echo "$(GREEN)Starting Redis...$(NC)"
	@if ! docker ps | grep -q redis; then \
		docker run -d --name miniapp_redis -p 6379:6379 redis:7-alpine; \
		echo "$(GREEN)✓ Redis started on localhost:6379$(NC)"; \
	else \
		echo "$(GREEN)✓ Redis already running$(NC)"; \
	fi

stop-redis: ## Stop Redis
	@echo "$(YELLOW)Stopping Redis...$(NC)"
	@docker stop miniapp_redis 2>/dev/null || true
	@docker rm miniapp_redis 2>/dev/null || true
	@echo "$(GREEN)✓ Redis stopped$(NC)"

start-celery: start-redis ## Start Celery worker and beat
	@echo "$(GREEN)Starting Celery worker and beat...$(NC)"
	cd $(DJANGO_DIR) && . venv/bin/activate && celery -A miniapp_api worker --loglevel=info --detach --pidfile=/tmp/celery-worker.pid
	cd $(DJANGO_DIR) && . venv/bin/activate && celery -A miniapp_api beat --loglevel=info --detach --pidfile=/tmp/celery-beat.pid
	@echo "$(GREEN)✓ Celery started$(NC)"

stop-celery: ## Stop Celery worker and beat
	@echo "$(YELLOW)Stopping Celery...$(NC)"
	@pkill -f "celery.*miniapp_api" || true
	@rm -f /tmp/celery-worker.pid /tmp/celery-beat.pid
	@echo "$(GREEN)✓ Celery stopped$(NC)"

start-backend: start-db start-redis ## Start Django backend (Gunicorn on port 8000)
	@echo "$(GREEN)Starting Django backend...$(NC)"
	cd $(DJANGO_DIR) && . venv/bin/activate && gunicorn miniapp_api.wsgi:application --bind 127.0.0.1:8000 --workers 2 --timeout 120 --daemon --access-logfile logs/access.log --error-logfile logs/error.log --pid /tmp/gunicorn.pid
	@echo "$(GREEN)✓ Django backend started on http://localhost:8000$(NC)"
	@echo "  $(BLUE)Admin:$(NC) http://localhost:8000/admin/"
	@echo "  $(BLUE)API:$(NC) http://localhost:8000/api/"

stop-backend: ## Stop Django backend
	@echo "$(YELLOW)Stopping Django backend...$(NC)"
	@if [ -f /tmp/gunicorn.pid ]; then \
		kill $$(cat /tmp/gunicorn.pid) || true; \
		rm -f /tmp/gunicorn.pid; \
	fi
	@pkill -f "gunicorn.*miniapp_api" || true
	@echo "$(GREEN)✓ Django backend stopped$(NC)"

start-frontend: ## Start frontend (static site on port 1234)
	@echo "$(GREEN)Starting frontend server...$(NC)"
	cd $(SITE_DIR) && $(PYTHON) -m http.server 1234 &
	@echo "$(GREEN)✓ Frontend started on http://localhost:1234$(NC)"
	@echo "  $(BLUE)Site:$(NC) http://localhost:1234/index.html"
	@echo "  $(BLUE)Cabinet:$(NC) http://localhost:1234/cabinet.html"

stop-frontend: ## Stop frontend server
	@echo "$(YELLOW)Stopping frontend server...$(NC)"
	@pkill -f "http.server 1234" || true
	@echo "$(GREEN)✓ Frontend stopped$(NC)"

start-all: setup-env start-db start-redis start-backend start-celery start-frontend ## Start all services (DB, Redis, Backend, Celery, Frontend)
	@echo ""
	@echo "$(GREEN)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo "$(GREEN)✓ All services started successfully!$(NC)"
	@echo "$(GREEN)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo ""
	@echo "$(BLUE)Services running:$(NC)"
	@echo "  $(YELLOW)Frontend:$(NC)     http://localhost:1234"
	@echo "  $(YELLOW)Django API:$(NC)   http://localhost:8000"
	@echo "  $(YELLOW)Admin Panel:$(NC)  http://localhost:8000/admin/"
	@echo "  $(YELLOW)PostgreSQL:$(NC)   localhost:5432"
	@echo "  $(YELLOW)PocketBase:$(NC)   http://localhost:8090"
	@echo "  $(YELLOW)Redis:$(NC)        localhost:6379"
	@echo ""
	@echo "$(BLUE)Logs:$(NC)"
	@echo "  $(YELLOW)Backend:$(NC)      tail -f $(DJANGO_DIR)/logs/error.log"
	@echo "  $(YELLOW)Access:$(NC)       tail -f $(DJANGO_DIR)/logs/access.log"
	@echo ""

stop-all: stop-frontend stop-celery stop-backend stop-redis stop-db ## Stop all services
	@echo "$(GREEN)✓ All services stopped$(NC)"

restart-all: stop-all start-all ## Restart all services

logs-backend: ## Show Django backend logs
	@tail -f $(DJANGO_DIR)/logs/error.log

logs-access: ## Show Django access logs
	@tail -f $(DJANGO_DIR)/logs/access.log

logs-celery: ## Show Celery logs
	@tail -f $(DJANGO_DIR)/logs/celery*.log 2>/dev/null || echo "No Celery logs found"

migrate: ## Run Django migrations
	@echo "$(YELLOW)Running migrations...$(NC)"
	cd $(DJANGO_DIR) && . venv/bin/activate && $(PYTHON) manage.py migrate
	@echo "$(GREEN)✓ Migrations applied$(NC)"

makemigrations: ## Create new Django migrations
	@echo "$(YELLOW)Creating migrations...$(NC)"
	cd $(DJANGO_DIR) && . venv/bin/activate && $(PYTHON) manage.py makemigrations
	@echo "$(GREEN)✓ Migrations created$(NC)"

shell: ## Open Django shell
	cd $(DJANGO_DIR) && . venv/bin/activate && $(PYTHON) manage.py shell

createsuperuser: ## Create Django superuser
	cd $(DJANGO_DIR) && . venv/bin/activate && $(PYTHON) manage.py createsuperuser

collectstatic: ## Collect static files
	@echo "$(YELLOW)Collecting static files...$(NC)"
	cd $(DJANGO_DIR) && . venv/bin/activate && $(PYTHON) manage.py collectstatic --noinput
	@echo "$(GREEN)✓ Static files collected$(NC)"

test: ## Run tests
	@echo "$(YELLOW)Running tests...$(NC)"
	cd $(DJANGO_DIR) && . venv/bin/activate && $(PYTHON) manage.py test
	@echo "$(GREEN)✓ Tests completed$(NC)"

clean: stop-all ## Clean up temporary files and stop all services
	@echo "$(YELLOW)Cleaning up...$(NC)"
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@find . -type f -name "*.pyo" -delete 2>/dev/null || true
	@find . -type f -name "*.log" -delete 2>/dev/null || true
	@rm -f /tmp/celery*.pid /tmp/gunicorn.pid
	@echo "$(GREEN)✓ Cleanup complete$(NC)"

reset-db: ## Reset database (WARNING: deletes all data)
	@echo "$(RED)⚠️  WARNING: This will delete all data!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		echo "$(YELLOW)Stopping services...$(NC)"; \
		$(DOCKER_COMPOSE) down -v; \
		echo "$(YELLOW)Starting fresh database...$(NC)"; \
		$(DOCKER_COMPOSE) up -d postgres pocketbase; \
		sleep 3; \
		echo "$(YELLOW)Running migrations...$(NC)"; \
		cd $(DJANGO_DIR) && . venv/bin/activate && $(PYTHON) manage.py migrate; \
		echo "$(GREEN)✓ Database reset complete$(NC)"; \
	else \
		echo "$(GREEN)Cancelled$(NC)"; \
	fi

status: ## Show status of all services
	@echo "$(BLUE)Service Status:$(NC)"
	@echo ""
	@echo "$(YELLOW)Docker Containers:$(NC)"
	@$(DOCKER_COMPOSE) ps
	@echo ""
	@echo "$(YELLOW)Backend (Gunicorn):$(NC)"
	@if [ -f /tmp/gunicorn.pid ] && ps -p $$(cat /tmp/gunicorn.pid) > /dev/null 2>&1; then \
		echo "  $(GREEN)✓ Running (PID: $$(cat /tmp/gunicorn.pid))$(NC)"; \
	else \
		echo "  $(RED)✗ Not running$(NC)"; \
	fi
	@echo ""
	@echo "$(YELLOW)Celery Worker:$(NC)"
	@if pgrep -f "celery.*worker.*miniapp_api" > /dev/null; then \
		echo "  $(GREEN)✓ Running$(NC)"; \
	else \
		echo "  $(RED)✗ Not running$(NC)"; \
	fi
	@echo ""
	@echo "$(YELLOW)Celery Beat:$(NC)"
	@if pgrep -f "celery.*beat.*miniapp_api" > /dev/null; then \
		echo "  $(GREEN)✓ Running$(NC)"; \
	else \
		echo "  $(RED)✗ Not running$(NC)"; \
	fi
	@echo ""
	@echo "$(YELLOW)Frontend:$(NC)"
	@if pgrep -f "http.server 1234" > /dev/null; then \
		echo "  $(GREEN)✓ Running$(NC)"; \
	else \
		echo "  $(RED)✗ Not running$(NC)"; \
	fi

build-css: ## Build Tailwind CSS for site
	@echo "$(YELLOW)Building Tailwind CSS...$(NC)"
	cd $(SITE_DIR) && npm run build:css
	@echo "$(GREEN)✓ CSS built$(NC)"

dev: start-all ## Alias for start-all (development mode)

prod: ## Production build (not implemented yet)
	@echo "$(RED)Production build not implemented yet$(NC)"
	@echo "Use deployment scripts in deploy-configs/ for production"

