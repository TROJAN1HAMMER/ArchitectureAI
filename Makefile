.PHONY: dev backend frontend build lint typecheck docker-up docker-down

dev:
	pnpm dev

backend:
	pnpm backend

frontend:
	pnpm frontend

build:
	pnpm build

lint:
	pnpm lint

typecheck:
	pnpm typecheck

docker-up:
	docker compose up -d

docker-down:
	docker compose down
