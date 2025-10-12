#!/bin/bash

# Script de release para deploy en Vercel
# Uso: ./scripts/release.sh [patch|minor|major]

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Tipo de versión (por defecto: minor)
VERSION_TYPE=${1:-minor}

if [[ ! "$VERSION_TYPE" =~ ^(patch|minor|major)$ ]]; then
  echo -e "${RED}❌ Error: Tipo de versión inválido. Usa: patch, minor o major${NC}"
  exit 1
fi

echo -e "${BLUE}🚀 Iniciando proceso de release...${NC}\n"

# 1. Verificar que estamos en la rama correcta
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
if [ "$BRANCH" != "main" ] && [ "$BRANCH" != "master" ]; then
  echo -e "${YELLOW}⚠️  Advertencia: No estás en la rama main/master (estás en: $BRANCH)${NC}"
  read -p "¿Continuar? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# 2. Asegurar que no hay cambios sin commitear
if [[ -n $(git status -s) ]]; then
  echo -e "${RED}❌ Error: Hay cambios sin commitear${NC}"
  echo -e "${YELLOW}Commit tus cambios primero o usa git stash${NC}"
  git status -s
  exit 1
fi

# 3. Pull de cambios remotos
echo -e "${BLUE}📥 Sincronizando con remoto...${NC}"
git pull origin $BRANCH

# 4. Incrementar versión
echo -e "${BLUE}📦 Incrementando versión ($VERSION_TYPE)...${NC}"
npm run version:$VERSION_TYPE

# Obtener la nueva versión
NEW_VERSION=$(node -p "require('./package.json').version")
echo -e "${GREEN}✅ Nueva versión: v${NEW_VERSION}${NC}\n"

# 5. Confirmar release
echo -e "${YELLOW}¿Hacer release de v${NEW_VERSION}?${NC}"
echo -e "  - Se commitearán los cambios"
echo -e "  - Se creará el tag v${NEW_VERSION}"
echo -e "  - Se hará push a remoto"
echo -e "  - Vercel comenzará el deploy automáticamente"
echo ""
read -p "¿Continuar? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${RED}❌ Release cancelado${NC}"
  exit 1
fi

# 6. Commit
echo -e "${BLUE}💾 Creando commit...${NC}"
git add .
git commit -m "chore: release v${NEW_VERSION}"

# 7. Tag
echo -e "${BLUE}🏷️  Creando tag...${NC}"
git tag -a "v${NEW_VERSION}" -m "Release v${NEW_VERSION}"

# 8. Push
echo -e "${BLUE}📤 Haciendo push a remoto...${NC}"
git push origin $BRANCH
git push origin "v${NEW_VERSION}"

echo -e "\n${GREEN}✅ Release completado exitosamente!${NC}"
echo -e "\n${BLUE}📋 Próximos pasos:${NC}"
echo -e "  1. Vercel detectará el push y comenzará el deploy"
echo -e "  2. Monitorea el deploy en: https://vercel.com/[tu-proyecto]/deployments"
echo -e "  3. Los usuarios verán el modal de actualización en el dashboard"
echo -e "\n${BLUE}🔗 Links útiles:${NC}"
echo -e "  - Tag: https://github.com/[tu-repo]/releases/tag/v${NEW_VERSION}"
echo -e "  - Vercel: https://vercel.com/[tu-proyecto]"
echo -e ""

