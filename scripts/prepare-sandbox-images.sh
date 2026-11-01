#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GO_IMAGE="${SANDBOX_GO_IMAGE:-elevatesde/sandbox-go:1.23}"

for image in node:20-alpine python:3.12-alpine gcc:13 eclipse-temurin:21-jdk-alpine golang:1.23-alpine; do
  docker pull "$image"
done

docker build -t "$GO_IMAGE" "$REPO_ROOT/docker/sandbox/go"

echo "Sandbox images ready. Go submissions use $GO_IMAGE."
