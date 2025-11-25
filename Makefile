.PHONY: help up down restart rebuild docker-rebuild docker-clean logs ps api-shell celery-shell beat-shell migrate makemigrations collectstatic createsuperuser shell recurring-payments test-recurring status

COMPOSE ?= docker compose
COMPOSE_FILE ?= docker-compose.yml

BLUE = \033[0;34m
YELLOW = \033[1;33m
GREEN = \033[0;32m
NC = \033[0m

help: ## Show this help message
	@echo "$(BLUE)MiniApp Expert – Docker workflow$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-18s$(NC) %s\n", $$1, $$2}'

up: ## Start all services (detached)
	$(COMPOSE) -f $(COMPOSE_FILE) up -d

down: ## Stop and remove all containers
	$(COMPOSE) -f $(COMPOSE_FILE) down

restart: ## Restart the entire stack
	$(COMPOSE) -f $(COMPOSE_FILE) down
	$(COMPOSE) -f $(COMPOSE_FILE) up -d

rebuild: ## Build/rebuild Docker images
	$(COMPOSE) -f $(COMPOSE_FILE) build

docker-rebuild: ## Full rebuild (down + build --no-cache + up)
	$(COMPOSE) -f $(COMPOSE_FILE) down --remove-orphans
	$(COMPOSE) -f $(COMPOSE_FILE) build --no-cache
	$(COMPOSE) -f $(COMPOSE_FILE) up -d

docker-clean: ## Aggressively prune Docker resources
	docker system prune -af

logs: ## Follow logs for all services
	$(COMPOSE) -f $(COMPOSE_FILE) logs -f

ps: ## Show container status
	$(COMPOSE) -f $(COMPOSE_FILE) ps

api-shell: ## Open shell inside the Django API container
	$(COMPOSE) -f $(COMPOSE_FILE) exec api /bin/sh

celery-shell: ## Open shell inside the Celery worker container
	$(COMPOSE) -f $(COMPOSE_FILE) exec celery /bin/sh

beat-shell: ## Open shell inside the Celery beat container
	$(COMPOSE) -f $(COMPOSE_FILE) exec celery-beat /bin/sh

migrate: ## Run Django migrations inside container
	$(COMPOSE) -f $(COMPOSE_FILE) run --rm api python manage.py migrate

makemigrations: ## Create Django migrations
	$(COMPOSE) -f $(COMPOSE_FILE) run --rm api python manage.py makemigrations

collectstatic: ## Collect static files
	$(COMPOSE) -f $(COMPOSE_FILE) run --rm api python manage.py collectstatic --noinput

createsuperuser: ## Create Django superuser
	$(COMPOSE) -f $(COMPOSE_FILE) run --rm api python manage.py createsuperuser

shell: ## Open Django shell
	$(COMPOSE) -f $(COMPOSE_FILE) run --rm api python manage.py shell

recurring-payments: ## Process recurring payments (manual run)
	@echo "$(GREEN)Running recurring payments processing...$(NC)"
	$(COMPOSE) -f $(COMPOSE_FILE) exec api python manage.py process_recurring_payments

test-recurring: ## Test recurring payments (dry-run)
	@echo "$(YELLOW)Running recurring payments test (dry-run)...$(NC)"
	$(COMPOSE) -f $(COMPOSE_FILE) exec api python manage.py process_recurring_payments --dry-run

status: ## Show celery and services status
	@echo "$(BLUE)=== Container Status ===$(NC)"
	$(COMPOSE) -f $(COMPOSE_FILE) ps
	@echo ""
	@echo "$(BLUE)=== Celery Worker Status ===$(NC)"
	$(COMPOSE) -f $(COMPOSE_FILE) exec celery-worker celery -A miniapp_api inspect active || echo "$(YELLOW)Celery worker not running$(NC)"
	@echo ""
	@echo "$(BLUE)=== Celery Beat Schedule ===$(NC)"
	$(COMPOSE) -f $(COMPOSE_FILE) exec celery-beat celery -A miniapp_api inspect scheduled || echo "$(YELLOW)Celery beat not running$(NC)"


