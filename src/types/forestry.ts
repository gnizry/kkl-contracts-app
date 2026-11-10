/**
 * KKL Forestry Contracts Management Types (מערכת ניהול התקשרויות קק״ל)
 * Tailored for ArcGIS Experience Builder (ExB) & Esri Arcade Data Expressions
 */

export type ContractStatus = 'בתכנון' | 'אושר לביצוע' | 'בביצוע' | 'בדיקת שטח' | 'הסתיים' | 'מושהה' | 'בוטל';
export type StandStatus = 'טרם החל' | 'בביצוע' | 'בוצע' | 'מושהה';
export type RegionName = 'מרחב צפון' | 'מרחב מרכז' | 'מרחב דרום';

export interface Stand {
  Stand_ID: string; // e.g. "104-12"
  AreaDunam: number; // שטח בדונם
  DominantSpecies: string; // מין עיקרי (אורן ירושלים, ברוש מצוי, אלון תבור וכו')
  TreatmentType: string; // סוג טיפול (דילול ראשון, דילול סניטרי, חישוף קווי אש)
  Status: StandStatus;
  TreeDensity: string; // צפיפות עצים
  TargetVolumeMQ: number; // נפח יעד במ"ק
}

export interface Mano {
  Mano_ID: string; // e.g. "M-104-01"
  Mano_Name: string; // e.g. "מנה א' - שלוחת בלפוריה"
  Status: StandStatus;
  Stands: Stand[];
}

export interface DeliveryNote {
  Delivery_ID: string; // e.g. "DN-2024-9104"
  Date: string; // ISO or formatted datetime
  QuantityMQ: number; // נפח במ"ק
  WoodType: string; // סוג עץ (בולי עץ, רסק, עצים להסקה)
  Removing_License_ID: string; // רישיון נטילה מקושר
  DriverName: string; // שם הנהג
  TruckPlate: string; // מספר רישוי משאית
  WeighSlipNumber: string; // מספר תעודת שקילה
  DestinationYard: string; // אתר יעד / מנפטה / מפעל
  SupervisorSign: string; // אישור יערן
  Notes?: string;
}

export interface RemovingLicense {
  Removing_License_ID: string; // e.g. "LIC-NT-2024-089-A"
  Original_License_Id: string; // קישור לרישיון כריתה המקורי (LIC-KR-2024-089)
  License_Number: string; // מס' רישיון נטילה (רישיון נטילה 089/24-א)
  IssueDate: string;
  ExpiryDate: string;
  ApprovedMQ: number; // נפח מאושר במ"ק
  DeliveredMQ: number; // נפח שפונה בפועל
  BalanceMQ: number; // יתרה במ"ק (ApprovedMQ - DeliveredMQ)
  Destination: string; // יעד הפינוי
  Status: string;
  Notes?: string;
  Contract_ID: string;
}

export interface FellingLicense {
  Felling_License_ID: string; // e.g. "LIC-KR-2024-089"
  License_Number: string; // רישיון כריתה 089/24
  IssueDate: string;
  ExpiryDate: string;
  ForesterName: string; // פקיד יערות מנפיק
  ApprovedQuantityMQ: number; // סה"כ נפח מאושר לכריתה
  StandsList: string; // עומדים כלולים
  Removing_Licenses: RemovingLicense[];
  Contract_ID: string;
}

export interface WorkLog {
  Log_ID: string; // e.g. "WL-2024-110"
  Date: string;
  StartTime: string;
  EndTime: string;
  Contract_ID: string;
  SupervisorComments: string;
  Weather: string;
  StandsWorked: string; // עומדים שעבדו בהם
  // Workers & Equipment stored as flattened / concatenated strings in parent record (as specified in KKL ExB requirements)
  Workers: string; // e.g. "יוסי כהן (מנהל עבודה), מחמוד זועבי (גוזם מוסמך)..."
  Equipment: string; // e.g. "בובקט (מס' 55-12), מסור שרשרת Stihl MS 661..."
  SafetyIncident: boolean;
  SafetyNotes?: string;
}

export interface Contract {
  Contract_ID: string; // Key ID
  Contract_Number: string; // e.g. "CNT-2024-014"
  Contract_Name: string;
  Region: RegionName; // מרחב
  District: string; // אזור
  Block: string; // גוש / יער
  Contractor: string; // קבלן מבצע
  ContractorContact?: string;
  Status: ContractStatus;
  Year: number;
  StartDate: string;
  EndDate: string;
  TotalApprovedMQ: number; // סה"כ נפח מאושר במ"ק
  TotalDeliveredMQ: number; // סה"כ נפח שפונה במ"ק
  BalanceMQ: number; // יתרה מ"ק
  ExecutionPercent: number; // אחוז ביצוע
  Description: string;
  Supervisor: string; // יערן אחראי
  Manot: Mano[];
  Felling_Licenses: FellingLicense[];
  DeliveryNotes: DeliveryNote[];
  WorkLogs: WorkLog[];
  Coordinates?: { lat: number; lng: number }; // For GIS map simulation
}

export interface ContractorInfo {
  Contractor_ID: string;
  Name: string;
  RegNumber: string;
  Phone: string;
  Email: string;
  ActiveContractsCount: number;
  TotalDeliveredMQ: number;
  Rating: number;
  FleetSummary: string;
}

export interface FilterState {
  region: string;
  district: string;
  block: string;
  status: string;
  year: string;
  lowBalanceOnly: boolean; // יתרה מתחת ל-40 מ"ק
  searchTerm: string;
}
