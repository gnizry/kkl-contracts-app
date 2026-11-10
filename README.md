# קק"ל – מערכת ניהול התקשרויות (מוקאפ + חיבור חי ל-ArcGIS Online)

אפליקציית React/Vite בעברית (RTL). ללא חיבור: נתוני דמו סינתטיים. עם חיבור: קוראת את שכבות ההתקשרויות מ-ArcGIS Online.

## הרצה מקומית
`npm install` ואז `npm run dev` (פורט 3000).

## פרסום (GitHub Pages)
כל דחיפה ל-`main` בונה ומפרסמת אוטומטית (`.github/workflows/pages.yml`).
הפעלה חד-פעמית: Settings → Pages → Source: **GitHub Actions**.
הכתובת: `https://<משתמש>.github.io/kkl-contracts-app/`

## כללי אבטחה
- אין בקוד סיסמאות, טוקנים או מפתחות. הטוקן נשמר רק ב-sessionStorage של הלשונית.
- נתוני אמת (`src/data/real*.json`) ב-`.gitignore` – האתר המפורסם מציג נתוני דמו בלבד; נתונים חיים נטענים מ-AGOL אחרי התחברות.
- אתר ב-Pages ציבורי בכתובת, גם כשהמאגר פרטי; לכן אסור לשים בו נתונים.

## הלאה
- החלפת התחברות שם משתמש/סיסמה ב-OAuth 2.0 (דורש רישום Application ב-AGOL; ה-client ID אינו סוד).

## אבטחת חיבור ל-ArcGIS Online
- התחברות בשם משתמש וסיסמה; הסיסמה נשלחת רק לפורטל ואינה נשמרת. הטוקן ב-`sessionStorage` בלבד.
- בגרסה המפורסמת (`VITE_LOCK_PORTAL=1` ב-workflow) כתובת הפורטל נעולה ל-`DEFAULT_PORTAL_URL`; בהרצה מקומית (`npm run dev`) אפשר לשנות אותה.
- ניתוק אוטומטי אחרי `IDLE_LOGOUT_MINUTES` (ברירת מחדל 30) דקות ללא פעילות, מוגדר ב-`src/config.ts`.
