#!/bin/sh
# רץ בכל הפעלה של הקונטיינר (תמונת nginx מריצה כל סקריפט שב-/docker-entrypoint.d/).
# כותב את config.js לפי משתנה הסביבה API_URL – כך אותה תמונה עובדת מקומית ובענן.
# ${API_URL-ברירת_מחדל} עם "-" בלי ":" שומר ערך ריק כריק: בענן API_URL="" פירושו אותו דומיין.
# (עם ":-" ערך ריק היה מוחלף ב-localhost, והאתר בענן היה שבור.)
# cat > קובץ <<EOF ... EOF כותב לקובץ את כל השורות עד EOF, ומחליף בהן את המשתנים
cat > /usr/share/nginx/html/config.js <<EOF
window.__APP_CONFIG__ = { API_URL: "${API_URL-http://localhost:8000}" };
EOF

# ── הוספת מקור ה-API ל-connect-src ב-CSP ──
# ב-security-headers.conf יש טוקן __API_ORIGIN__ בתוך connect-src. מחליפים אותו כאן:
# - API_URL ריק (ענן, אותו דומיין) או לא http(s) → מוחקים את הטוקן, נשאר 'self' blob:
# - API_URL מלא → לוקחים רק את ה-origin (סכמה+host+פורט, בלי path) ומוסיפים אותו
# האימות בביטוי רגולרי מונע הזרקה של רווח / ; / מרכאות לתוך כותרת ה-CSP.
CSP_FILE=/etc/nginx/snippets/security-headers.conf
APP_API_URL="${API_URL-http://localhost:8000}"
API_ORIGIN=""
case "$APP_API_URL" in
  http://*|https://*)
    API_ORIGIN=$(printf '%s' "$APP_API_URL" | sed -E 's#^(https?://[^/?#]*).*$#\1#')
    if ! printf '%s' "$API_ORIGIN" | grep -Eq '^https?://[A-Za-z0-9.-]+(:[0-9]{1,5})?$'; then
      echo "40-app-config: API_URL origin is invalid, not adding it to the CSP" >&2
      API_ORIGIN=""
    fi
    ;;
esac
if [ -n "$API_ORIGIN" ]; then
  sed -i "s|__API_ORIGIN__|$API_ORIGIN|" "$CSP_FILE"
else
  sed -i "s| __API_ORIGIN__||" "$CSP_FILE"
fi
