# Reglas Fijas del Proyecto - Vinoteca La Recta

## Flujo Automático de Git y Despliegue en Vercel
- **Regla obligatoria tras cada tanda de cambios**:
  1. Ejecutar `git add` de todos los archivos modificados.
  2. Realizar `git commit -m "<mensaje descriptivo>"` con un resumen claro de los cambios realizados.
  3. Hacer el flujo de rama / Pull Request / Merge hacia `main` y ejecutar `git push origin main` para que **Vercel** despliegue automáticamente los cambios en producción.
