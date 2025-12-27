.PHONY: install dev build preview deploy clean help

help:
	@echo "Available commands:"
	@echo "  make install  - Install dependencies"
	@echo "  make dev      - Start development server"
	@echo "  make build    - Build for production"
	@echo "  make preview  - Preview production build"
	@echo "  make deploy   - Deploy to GitHub Pages"
	@echo "  make clean    - Remove dist folder"

install:
	npm install

dev:
	npm run dev

build:
	npm run build

preview:
	npm run preview

deploy:
	npm run deploy

clean:
	rm -rf dist
