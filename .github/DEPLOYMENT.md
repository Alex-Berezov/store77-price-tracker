# GitHub Actions CI/CD Configuration

This document describes how to configure GitHub Actions for the Store77 Price
Tracker project.

## Workflows

### CI Workflow (`ci.yml`)

Runs on every push and pull request to `main` and `develop` branches.

**Jobs:**

- **Lint** - ESLint and Prettier checks
- **TypeScript** - Type checking for API and Web
- **Build** - Build both applications
- **Test** - Run unit tests with PostgreSQL and Redis services

### Deploy Workflow (`deploy.yml`)

Runs on push to `main` branch or manual trigger.

**Jobs:**

- **Build & Push** - Build Docker images and push to GitHub Container Registry
- **Deploy** - Deploy to server via SSH
- **Health Check** - Verify deployment is successful

## Required Configuration

### GitHub Secrets

Configure these secrets in your repository settings
(`Settings > Secrets and variables > Actions > Secrets`):

| Secret            | Description                       | Example                                  |
| ----------------- | --------------------------------- | ---------------------------------------- |
| `SSH_PRIVATE_KEY` | Private SSH key for server access | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `SERVER_HOST`     | Server IP address or hostname     | `192.168.1.100` or `server.example.com`  |
| `SERVER_USER`     | SSH username for deployment       | `deploy`                                 |
| `DB_USER`         | PostgreSQL username               | `postgres`                               |
| `DB_PASSWORD`     | PostgreSQL password               | `secure_password_here`                   |
| `DB_NAME`         | PostgreSQL database name          | `store_scraper`                          |
| `REDIS_PASSWORD`  | Redis password (optional)         | `redis_password_here`                    |

### GitHub Variables

Configure these variables in your repository settings
(`Settings > Secrets and variables > Actions > Variables`):

| Variable  | Description               | Example                   |
| --------- | ------------------------- | ------------------------- |
| `API_URL` | Public URL of the API     | `https://api.example.com` |
| `APP_URL` | Public URL of the web app | `https://example.com`     |

### Environment Setup

1. Create a `production` environment in `Settings > Environments`
2. Add any required reviewers or wait timers if needed
3. Configure environment-specific secrets/variables if different from repository
   level

## Server Prerequisites

Before deploying, ensure your server has:

1. **Docker** installed and running
2. **Docker Compose** v2+ installed
3. **SSH access** configured with the key from `SSH_PRIVATE_KEY`
4. **Ports open**: 80, 443 (if using HTTPS), 8080 (API), 3000 (Web)

### Quick Server Setup (Ubuntu/Debian)

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose plugin
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Create deployment user (optional)
sudo adduser deploy
sudo usermod -aG docker deploy

# Setup SSH key authentication
mkdir -p ~/.ssh
echo "YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

## Manual Deployment

You can trigger a deployment manually:

1. Go to `Actions` tab in GitHub
2. Select `Deploy` workflow
3. Click `Run workflow`
4. Choose the environment and click `Run workflow`

## Troubleshooting

### Deployment Failed

1. Check the workflow logs in GitHub Actions
2. SSH to the server and check container logs:
   ```bash
   cd ~/store77-price-tracker
   docker-compose logs -f
   ```

### Health Check Failed

1. Verify services are running:
   ```bash
   docker-compose ps
   ```
2. Check if ports are accessible:
   ```bash
   curl http://localhost:8080/health
   curl http://localhost:3000
   ```

### Container Not Starting

1. Check container logs:
   ```bash
   docker-compose logs api
   docker-compose logs web
   ```
2. Verify environment variables in `.env` file
3. Check database connection:
   ```bash
   docker-compose exec postgres psql -U postgres -d store_scraper -c "SELECT 1"
   ```

## Image Registry

Docker images are pushed to GitHub Container Registry (ghcr.io):

- **API**: `ghcr.io/<owner>/store77-price-tracker/api`
- **Web**: `ghcr.io/<owner>/store77-price-tracker/web`

Images are tagged with:

- `latest` - Latest build from main branch
- `YYYYMMDD-<sha>` - Version with date and commit SHA
- `sha-<sha>` - Commit SHA only
