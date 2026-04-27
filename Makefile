COMPOSE := docker compose
SERVICE := web

.PHONY: dev build test preview install

install:
	$(COMPOSE) run --rm $(SERVICE) npm install

dev:
	$(COMPOSE) run --rm --service-ports $(SERVICE) npm run dev -- --host 0.0.0.0

build:
	$(COMPOSE) run --rm $(SERVICE) npm run build

test:
	$(COMPOSE) run --rm $(SERVICE) npm run test

preview:
	$(COMPOSE) run --rm --service-ports $(SERVICE) npm run preview -- --host 0.0.0.0
