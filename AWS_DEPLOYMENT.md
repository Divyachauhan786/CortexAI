# AWS EC2 Ubuntu Deployment Guide

This guide describes how to deploy the AI Workspace / CortexAI project to an AWS EC2 instance running Ubuntu 22.04 or 24.04.

## 1. Initial Server Setup

SSH into your newly provisioned Ubuntu EC2 instance and install Docker and Git.

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to the docker group so you don't need sudo for docker commands
sudo usermod -aG docker ubuntu
```
*(Log out and log back in for the group change to take effect).*

## 2. Clone the Repository

```bash
git clone https://github.com/your-username/your-ai-workspace.git
cd your-ai-workspace
```

## 3. Environment Configuration

The repository is designed to be secure. Credentials and secrets are intentionally excluded from version control. You must create the environment files manually.

```bash
cp .env.example .env
nano .env
```
Ensure you populate the required secrets:
* `MONGODB_URI`
* `JWT_SECRET`
* `GROQ_API_KEY`
* `TAVILY_API_KEY`
* `GOOGLE_API_KEY`
* `VITE_FIREBASE_API_KEY` (and other Firebase envs)

**Important for AWS**: Ensure `VITE_API_GATEWAY_URL` and `FRONTEND_URL` in `.env` point to your EC2 instance's Public IP or Domain Name, not `localhost`.
* Example: `VITE_API_GATEWAY_URL=http://<YOUR_EC2_PUBLIC_IP>:8080`
* Example: `FRONTEND_URL=http://<YOUR_EC2_PUBLIC_IP>:5174`

## 4. Firebase Admin SDK Setup

The Auth Service relies on the Firebase Admin SDK. You must securely upload this to the server.

```bash
# Create the credentials directory
mkdir -p services/auth-service/credentials

# Use nano to paste the contents of your downloaded Firebase service account JSON
nano services/auth-service/credentials/cortexai-12345-firebase-adminsdk-abcde.json
```

## 5. Build and Run the Stack

Execute Docker Compose to build and start the entire stack in detached mode.

```bash
# Build all images
docker compose build

# Start the stack
docker compose up -d
```

## 6. Verify Deployment

Use `docker compose ps` to ensure all 7 containers are marked as `(healthy)`.

```bash
docker compose ps
```

**Testing Access:**
* **Frontend**: Open `http://<YOUR_EC2_PUBLIC_IP>:5174` in your browser.
* **Gateway Health**: Check `http://<YOUR_EC2_PUBLIC_IP>:8080/health`.

*Note: Ensure your AWS Security Group has inbound rules allowing traffic on TCP ports `5174` (Frontend) and `8080` (API Gateway).*

## 7. Operational Commands

**View logs across all services:**
```bash
docker compose logs -f
```

**Restart a specific service (e.g., gateway):**
```bash
docker compose restart gateway
```

**Update and rebuild after pulling new code:**
```bash
git pull origin master
docker compose up -d --build
```
