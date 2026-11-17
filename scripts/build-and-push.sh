#!/usr/bin/env bash
# Build the FocusFlow images for linux/amd64 and push them to Docker Hub.
#
# The Docker Hub repositories must be PUBLIC (the grader pulls them with no login),
# and the images must never contain secrets.
#
# Usage: DOCKER_USER=<user> [TAG=v1] scripts/build-and-push.sh
# Default TAG is the short git hash.
#
# בונה את תמונות השרת והלקוח לארכיטקטורה linux/amd64 ודוחף אותן ל-Docker Hub.
# המאגרים חייבים להיות ציבוריים, ובתמונות אסור שיהיו סודות.

set -euo pipefail  # עצירה בכל שגיאה

: "${DOCKER_USER:?Set DOCKER_USER to your Docker Hub username}"  # חובה
TAG="${TAG:-$(git rev-parse --short HEAD)}"  # אם TAG לא הוגדר – ה-hash הקצר של ה-commit הנוכחי

cd "$(git rev-parse --show-toplevel)"  # שורש הריפו

pushed=()  # מערך ריק – נאסוף בו את שמות התמונות שנדחפו
for name in backend frontend; do  # פעם לשרת ופעם ללקוח
  if [ ! -f "$name/Dockerfile" ]; then  # אם עוד אין Dockerfile – מדלגים
    echo "Skipping $name: $name/Dockerfile does not exist yet."
    continue
  fi
  image="$DOCKER_USER/focusflow-$name:$TAG"  # למשל user/focusflow-backend:v1
  # EXTRA_BUILD_ARGS is for a local network that needs its own base images, see scripts/README.md.
  # --platform linux/amd64: חובה – אחרת Mac עם שבב Apple בונה תמונה שלא רצה אצל הבודק ובענן
  # --push: דוחף ל-Docker Hub מיד בסוף הבנייה
  # shellcheck disable=SC2086
  docker buildx build --platform linux/amd64 ${EXTRA_BUILD_ARGS:-} -t "$image" --push "./$name"
  pushed+=("$image")  # מוסיפים לרשימה
done

echo
echo "Pushed:"
printf '  %s\n' "${pushed[@]}"  # כל תמונה בשורה נפרדת
