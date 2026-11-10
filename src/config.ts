/** הגדרות ברירת מחדל – ניתן לשנות גם בזמן ריצה דרך חלון "חיבור ל-ArcGIS". */
export const ARCGIS_JS_URL = 'https://js.arcgis.com/4.31/';
export const DEFAULT_PORTAL_URL = 'https://kkl.maps.arcgis.com';
export const DEFAULT_WEBMAP_ID = '6a3bf8b155e04b049b0835a3a0d5ace4'; // מפת "דיווח ביצוע"
export const BASEMAP = 'gray-vector'; // Light Gray Canvas (למצב דמו)

// קישורים כמו בפופאפ ה-Arcade של ההתקשרות
export const EXB_APP_ID = '04dfe5002cb44c109e2afa91804fa0e5';
export const EXB_DETAILS_DS_ID = 'dataSource_5';
export const SURVEY_ITEM_ID = 'e1eaf2c4849c435d950b99ec228bc20e';

// שמות השכבות/טבלאות במפה (Title) כפי שהן מופיעות ב-FeatureSetByName בביטוי
export const LAYER_TITLES = {
  manot: 'מנות',
  stands: 'סטטוס עומדים',
  certs: 'תעודות משלוח',
  remLics: 'רישיונות נטילה',
  cutLics: 'רישיונות כריתה',
  logs: 'יומני עבודה',
  logsEquip: 'יומני עבודה - ציוד',
};
