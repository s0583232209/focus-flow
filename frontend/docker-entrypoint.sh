#!/bin/sh
# רץ בכל הפעלה של הקונטיינר (תמונת nginx מריצה כל סקריפט שב-/docker-entrypoint.d/).
# כותב את config.js לפי משתנה הסביבה API_URL – כך אותה תמונה עובדת מקומית ובענן.
# ${API_URL-ברירת_מחדל} עם "-" בלי ":" שומר ערך ריק כריק: בענן API_URL="" פירושו אותו דומיין.
# (עם ":-" ערך ריק היה מוחלף ב-localhost, והאתר בענן היה שבור.)
# cat > קובץ <<EOF ... EOF כותב לקובץ את כל השורות עד EOF, ומחליף בהן את המשתנים
cat > /usr/share/nginx/html/config.js <<EOF
window.__APP_CONFIG__ = { API_URL: "${API_URL-http://localhost:8000}" };
EOF
