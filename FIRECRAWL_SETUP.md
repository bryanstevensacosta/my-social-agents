# Firecrawl Setup

Firecrawl is used as an external service for web scraping capabilities. It runs as a separate Docker stack.

## Quick Setup

### 1. Clone Firecrawl Repository

```bash
# Clone in a separate directory (outside this project)
cd ~/projects  # or wherever you keep your projects
git clone https://github.com/mendableai/firecrawl.git
cd firecrawl
```

### 2. Start Firecrawl Services

```bash
# Start all Firecrawl services
docker-compose up -d

# Verify services are running
docker-compose ps

# Check API health
curl http://localhost:3002/health
```

### 3. Configure Backend

In `apps/backend/.env`:

```env
# Firecrawl Configuration
FIRECRAWL_API_URL=http://localhost:3002
FIRECRAWL_TIMEOUT=30000
FIRECRAWL_MAX_RETRIES=3
```

### 4. Test Integration

```bash
# Test scraping
curl -X POST http://localhost:3002/v2/scrape \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://example.com", "formats": ["markdown"]}'
```

## Updating Firecrawl

To update to the latest version:

```bash
cd ~/projects/firecrawl

# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

## Architecture

```
┌─────────────────────────────────────────┐
│  My Social Agents Backend               │
│  (apps/backend)                         │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  FirecrawlAdapter               │   │
│  │  (HTTP Client)                  │   │
│  └──────────────┬──────────────────┘   │
└─────────────────┼────────────────────────┘
                  │ HTTP
                  │ http://localhost:3002
                  ▼
┌─────────────────────────────────────────┐
│  Firecrawl (Separate Repository)       │
│  ~/projects/firecrawl                   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Firecrawl API :3002            │   │
│  │  Playwright Service :3000       │   │
│  │  Redis :6379                    │   │
│  │  RabbitMQ :5672                 │   │
│  │  PostgreSQL :5432               │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

## Benefits of Separate Repository

1. **Simplicity**: No git submodule complexity
2. **Easy Updates**: Simple `git pull` to update
3. **Clean Separation**: Clear boundary between services
4. **Independent Deployment**: Firecrawl can be deployed separately
5. **No Build Overhead**: Use official Docker images

## Troubleshooting

### Firecrawl API Not Accessible

```bash
# Check if services are running
cd ~/projects/firecrawl
docker-compose ps

# Check logs
docker-compose logs firecrawl-api

# Restart services
docker-compose restart
```

### Port Conflicts

If port 3002 is already in use, modify Firecrawl's `.env`:

```env
PORT=3003
```

Then update backend `.env`:

```env
FIRECRAWL_API_URL=http://localhost:3003
```

## Alternative: Using Firecrawl Cloud

Instead of self-hosting, you can use Firecrawl Cloud:

1. Sign up at https://firecrawl.dev
2. Get your API key
3. Update backend `.env`:

```env
FIRECRAWL_API_URL=https://api.firecrawl.dev
FIRECRAWL_API_KEY=your-api-key-here
```

## Related Files

- `apps/backend/src/ingestion/source/infra/adapters/firecrawl-adapter.ts` - Firecrawl integration
- `apps/backend/.env.example` - Environment configuration
