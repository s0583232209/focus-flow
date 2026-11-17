# בנייה בשני שלבים (multi-stage): שלב 1 בונה את האתר עם Node, שלב 2 מגיש את התוצאה עם nginx.
# התמונה הסופית מכילה רק את nginx ואת הקבצים הבנויים – בלי Node ובלי node_modules, ולכן היא קטנה.

# ── שלב 1: בנייה ──
FROM node:20-alpine AS build
WORKDIR /app
# קודם רק קבצי החבילות, כדי ששכבת ההתקנה תילקח מה-cache כשרק הקוד משתנה
COPY package.json package-lock.json ./
# npm ci מתקין בדיוק את הגרסאות שב-package-lock.json
RUN npm ci
# עכשיו כל הקוד (חוץ ממה שב-.dockerignore)
COPY . .
# בנייה → התוצאה בתיקייה dist
RUN npm run build

# ── שלב 2: הגשה ──
FROM nginx:alpine
# מעתיקים מהשלב הקודם רק את התיקייה הבנויה
COPY --from=build /app/dist /usr/share/nginx/html
# הגדרות השרת שלנו במקום ברירת המחדל
COPY nginx.conf /etc/nginx/conf.d/default.conf
# כותרות האבטחה, שכל location כולל
COPY security-headers.conf /etc/nginx/snippets/security-headers.conf
# סקריפטים בתיקייה /docker-entrypoint.d/ רצים אוטומטית לפני ש-nginx עולה – כאן נכתב config.js
COPY docker-entrypoint.sh /docker-entrypoint.d/40-app-config.sh
# הרשאת הרצה לסקריפט
RUN chmod +x /docker-entrypoint.d/40-app-config.sh
# תיעוד: nginx מאזין בפורט 3000
EXPOSE 3000
