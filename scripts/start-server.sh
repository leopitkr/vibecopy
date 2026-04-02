#!/bin/bash

# VibeCopy 웹서버 실행 스크립트
# 사용법: ./scripts/start-server.sh [dev|build|start]

set -e

cd "$(dirname "$0")/.."

MODE="${1:-dev}"

case "$MODE" in
  dev)
    echo "🚀 개발 서버 시작..."
    npm run dev
    ;;
  build)
    echo "📦 프로덕션 빌드 중..."
    npm run build
    ;;
  start)
    echo "🌐 프로덕션 서버 시작..."
    npm run start
    ;;
  prod)
    echo "📦 빌드 후 프로덕션 서버 시작..."
    npm run build && npm run start
    ;;
  *)
    echo "사용법: $0 [dev|build|start|prod]"
    echo ""
    echo "옵션:"
    echo "  dev    - 개발 서버 시작 (기본값)"
    echo "  build  - 프로덕션 빌드"
    echo "  start  - 프로덕션 서버 시작"
    echo "  prod   - 빌드 후 프로덕션 서버 시작"
    exit 1
    ;;
esac
