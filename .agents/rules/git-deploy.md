---
trigger: always_on
---

# Regla Fija: Git Add, Commit, Pull Request / Merge y Push para Vercel

Cada vez que se finalice una tanda de cambios solicitada por el usuario en el proyecto **Vinoteca La Recta**, debes ejecutar de forma automática y sin esperar a que el usuario lo vuelva a pedir:

1. `git add .` para preparar todos los cambios realizados.
2. `git commit -m "..."` con un mensaje claro describiendo los cambios.
3. Si se trabajó en una rama secundaria, hacer el Pull Request y el merge a `main`; o integrar directamente sobre `main` y ejecutar `git push origin main` para disparar el despliegue automático en **Vercel**.
