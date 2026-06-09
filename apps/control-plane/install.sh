#!/usr/bin/env bash
# VisaLark control-plane one-line installer.
# Self-host on an Oracle Cloud Always Free VM (or any Linux box with Docker).
#
#   curl -fsSL https://raw.githubusercontent.com/<you>/visa-lark/main/apps/control-plane/install.sh | bash
#
# This plane holds ZERO visa credentials and never talks to usvisa-info.
# It only relays notifications and stores availability history you push to it.
#
# Recommended ingress is Cloudflare Tunnel (no inbound ports). See docker-compose.yml.
set -euo pipefail

REPO_URL="${VISALARK_REPO:-https://github.com/appleweiping/visa-lark.git}"
INSTALL_DIR="${VISALARK_DIR:-$HOME/visa-lark}"
APP_DIR="$INSTALL_DIR/apps/control-plane"

say() { printf '\033[1;36m[visalark]\033[0m %s\n' "$1"; }
err() { printf '\033[1;31m[visalark]\033[0m %s\n' "$1" >&2; }

# --- 1. Ensure Docker is installed -------------------------------------------
if ! command -v docker >/dev/null 2>&1; then
  say "Docker not found — installing via get.docker.com (needs sudo)…"
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker "$USER" || true
  say "Docker installed. You may need to log out/in for group changes to apply."
fi

# `docker compose` (v2) vs legacy `docker-compose`
if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  err "Docker Compose not available. Install Docker Desktop or the compose plugin."
  exit 1
fi

# --- 2. Fetch the repo -------------------------------------------------------
if [ ! -d "$INSTALL_DIR/.git" ]; then
  say "Cloning $REPO_URL → $INSTALL_DIR"
  git clone --depth 1 "$REPO_URL" "$INSTALL_DIR"
else
  say "Updating existing checkout at $INSTALL_DIR"
  git -C "$INSTALL_DIR" pull --ff-only || true
fi

cd "$APP_DIR"

# --- 3. Configure ------------------------------------------------------------
if [ ! -f .env ]; then
  cp .env.example .env
fi

# Prompt for the dashboard token if it's still the placeholder.
CURRENT_TOKEN="$(grep -E '^DASHBOARD_TOKEN=' .env | cut -d= -f2- || true)"
if [ -z "$CURRENT_TOKEN" ] || [ "$CURRENT_TOKEN" = "change-me-to-a-long-random-string" ]; then
  if [ -t 0 ]; then
    read -r -p "Enter a DASHBOARD_TOKEN (blank = generate a random one): " INPUT_TOKEN || true
  else
    INPUT_TOKEN=""
  fi
  if [ -z "${INPUT_TOKEN:-}" ]; then
    INPUT_TOKEN="$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | xxd -p | tr -d '\n')"
    say "Generated DASHBOARD_TOKEN: $INPUT_TOKEN"
    say "Save this — you'll paste it into the extension/agent and the dashboard."
  fi
  # Portable in-place edit (GNU + BSD sed).
  if sed --version >/dev/null 2>&1; then
    sed -i "s|^DASHBOARD_TOKEN=.*|DASHBOARD_TOKEN=$INPUT_TOKEN|" .env
  else
    sed -i '' "s|^DASHBOARD_TOKEN=.*|DASHBOARD_TOKEN=$INPUT_TOKEN|" .env
  fi
fi

# --- 4. Build + run ----------------------------------------------------------
say "Building and starting the control plane…"
$COMPOSE up -d --build

PORT="$(grep -E '^PORT=' .env | cut -d= -f2- || echo 8787)"
PORT="${PORT:-8787}"

say "Waiting for health…"
for _ in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:${PORT}/api/health" >/dev/null 2>&1; then
    say "Healthy! Control plane is running."
    break
  fi
  sleep 2
done

PUBLIC_IP="$(curl -fsS https://api.ipify.org 2>/dev/null || echo "<your-server-ip>")"
echo
say "Local URL:  http://127.0.0.1:${PORT}/api/health"
say "Public URL: http://${PUBLIC_IP}:${PORT}/api/health   (only if the port is open)"
say "RECOMMENDED: front this with a Cloudflare Tunnel instead of opening ${PORT}."
say "See docker-compose.yml for the cloudflared service template."
