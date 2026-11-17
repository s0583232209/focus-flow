// הגדרות זמן ריצה לפיתוח מקומי (npm run dev). בקונטיינר הקובץ הזה נכתב מחדש על ידי docker-entrypoint.sh
// לפי משתנה הסביבה API_URL (בענן – מחרוזת ריקה = אותו דומיין).
window.__APP_CONFIG__ = { API_URL: "http://localhost:8000" };
