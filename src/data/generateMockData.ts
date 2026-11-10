/**
 * Deterministic (seeded) generator of a large, realistic KKL dataset.
 * Names of statuses / species / treatment types follow the real domains in the
 * Solution Design document (SubTenders, SubWorkUnits, SubWorkUnitStands, ClearingLicense,
 * RemovingLicense, TendersShippingCertificate, TendersDailyWorkLog, WorkLogWorkers/Equipment).
 */
import {
  Contract,
  ContractStatus,
  ContractorInfo,
  DeliveryNote,
  FellingLicense,
  Mano,
  RegionName,
  RemovingLicense,
  Stand,
  StandStatus,
  WorkLog,
} from '../types/forestry';

// ---------- seeded PRNG ----------
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20241109);
const rint = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];
const chance = (p: number) => rnd() < p;
const pad = (n: number, w = 2) => String(n).padStart(w, '0');
const r1 = (n: number) => Math.round(n * 10) / 10;

function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
const TODAY = '2025-02-04';

// ---------- reference data ----------
interface GeoRow {
  region: RegionName;
  district: string; // אזור
  forests: { name: string; block: number }[];
  lat: [number, number];
  lng: [number, number];
  forester: string;
}
const GEO: GeoRow[] = [
  {
    region: 'מרחב צפון',
    district: 'גליל עליון וגולן',
    forests: [
      { name: 'יער ביריה', block: 201 },
      { name: 'יער להבות הבשן', block: 214 },
      { name: 'יער אודם', block: 219 },
      { name: 'יער מירון', block: 207 },
    ],
    lat: [32.95, 33.2],
    lng: [35.4, 35.75],
    forester: 'פקיד יערות מרחב צפון',
  },
  {
    region: 'מרחב צפון',
    district: 'גליל תחתון ועמקים',
    forests: [
      { name: 'יער ציפורי', block: 112 },
      { name: 'יער הסחלבים (כרמל צפון)', block: 118 },
      { name: 'יער בלפוריה', block: 121 },
      { name: 'יער גבעת המורה', block: 124 },
    ],
    lat: [32.6, 32.85],
    lng: [35.1, 35.4],
    forester: 'פקיד יערות מרחב צפון',
  },
  {
    region: 'מרחב מרכז',
    district: 'שפלה והרי ירושלים',
    forests: [
      { name: 'יער בן שמן', block: 401 },
      { name: 'יער הכרמל מערב', block: 410 },
      { name: 'יער צובה', block: 412 },
      { name: 'יער עמינדב', block: 415 },
      { name: 'יער שורש', block: 418 },
    ],
    lat: [31.75, 32.05],
    lng: [34.85, 35.15],
    forester: 'פקיד יערות מרחב מרכז',
  },
  {
    region: 'מרחב מרכז',
    district: 'מנשה ושרון',
    forests: [
      { name: 'יער חדרה', block: 305 },
      { name: 'יער אלונה', block: 311 },
      { name: 'יער חורשת טל', block: 316 },
    ],
    lat: [32.3, 32.55],
    lng: [34.9, 35.1],
    forester: 'פקיד יערות מרחב מרכז',
  },
  {
    region: 'מרחב דרום',
    district: 'שפלת יהודה ולכיש',
    forests: [
      { name: 'יער לכיש', block: 501 },
      { name: 'יער עוצם', block: 505 },
      { name: 'יער שמשון', block: 508 },
      { name: 'יער אמציה', block: 512 },
    ],
    lat: [31.4, 31.65],
    lng: [34.7, 34.95],
    forester: 'פקיד יערות מרחב דרום',
  },
  {
    region: 'מרחב דרום',
    district: 'נגב מערבי',
    forests: [
      { name: 'יער פטיש', block: 601 },
      { name: 'יער גרר', block: 604 },
      { name: 'יער להב', block: 607 },
    ],
    lat: [31.15, 31.4],
    lng: [34.5, 34.8],
    forester: 'פקיד יערות מרחב דרום',
  },
];

const SPECIES = [
  'אורן ירושלים', 'אורן ברוטיה', 'אורן קנרי', 'ברוש מצוי', 'ברוש אריזוני', 'אקליפטוס המקור',
  'אקליפטוס גומפוצפלה', 'אלון תבור', 'אלון מצוי', 'חרוב', 'שיטה כחלחלה', 'אשל', 'מחטניים',
];
const TREATMENTS = [
  'דילול אחיד', 'דילול סלקטיבי', 'דילול כתמי', 'דילול סניטרי', 'גיזום גובה',
  'חישוף קווי אש', 'טיפול במינים פולשים (כריתה וריסוק)', 'דילול ליצירת קרחות שדה',
];
const WOOD_TYPES = [
  'בולי עץ לתעשייה', 'עץ להסקה', 'רסק עץ ושבבים', 'גזעים - עמודים', 'עץ לייצור לוחות', 'גזם וענפים לריסוק',
];
const YARDS = [
  'מפעל לוחות עץ כרמיאל', 'מתחם גפת ועץ קיבוץ מזרע', 'מנפטת עמק הירדן', 'מתחם עץ עומר',
  'מפעל פלטות חדרה', 'חצר עץ בית שמש', 'מתחם מיון עץ באר שבע', 'מנפטת קיבוץ חולית',
];
const FIRST = [
  'יוסי', 'מוחמד', 'דוד', 'איליה', 'סאלח', 'אחמד', 'אבי', 'רמי', 'עלי', 'שמעון', 'ניקולאי', 'חסן',
  'עומר', 'ויקטור', 'מיכאל', 'יעקב', 'נאסר', 'עמית', 'ברק', 'איבראהים', 'דמיטרי', 'סמיר', 'רועי', 'אלכס',
];
const LAST = [
  'כהן', 'לוי', 'חאג\' יחיא', 'רוזנברג', 'חטיב', 'בוטבול', 'זועבי', 'מרציאנו', 'אבו רומי', 'פרידמן',
  'דהאן', 'סעדי', 'קורמן', 'מלכה', 'אסדי', 'נחמיאס', 'שלבי', 'בן חיים', 'עיסא', 'וולקוב',
];
const SUPERVISORS = [
  'אייל גולן - יערן גוש', 'רוני בר-און - יערן ראשי גליל עליון', 'גיל מעוז - יערן גוש בן שמן',
  'ארז אלון - מנהל דרום יער יתיר', 'יהודה שמחון - יערן ראשי הרי יהודה', 'נועה פרלמן - יערנית גוש',
  'מאיר אזולאי - יערן גוש חדרה', 'תמר ששון - יערנית ראשית שפלה', 'עידן קרמר - יערן גוש לכיש',
];
const WEATHERS = ['בהיר וחם', 'מעונן חלקית', 'רוחות חזקות', 'יבש ונעים', 'גשום קלות', 'ערפילי בבוקר', 'חם מאוד (כבד)'];
const EQUIPMENT = [
  'בובקט S650', 'מסור שרשרת Stihl MS 661', 'מרסקת Bandit 1590XP', 'משאית מנוף וולוו', 'טרקטור יער Valtra',
  'מחפר שרשראות קטרפילר 320', 'פורוורדר John Deere 1110G', 'מרסקת Pezzolato', 'משאית פול-טריילר Man',
  'רכב שטח 4x4 צוות',
];
const LOG_COMMENTS = [
  'העבודה התנהלה כסדרה, נדרש לשפר סימון עצים להשארה.',
  'נמצאו עצים יבשים נוספים בחלקה, אושרה הרחבה בתיאום עם הפקיד.',
  'בוצע סיור מסכם, השטח נקי מגזם בצד הדרך.',
  'שיבוש קל בעבודה בשל רוחות חזקות; הופסקה פעילות מנוף לשעה.',
  'הקבלן עמד בלוח הזמנים, ללא הערות מיוחדות.',
  'נדרש תיקון חיתוך גדמים גבוהים בחלקה הצפונית.',
  'נתגלה קן ציפורים - סומן והושאר אזור חייץ של 20 מ\'.',
  'פינוי בולים מהרחבה התעכב עקב מחסור במשאיות.',
  'בוצעה הדרכת בטיחות בוקר, כל העובדים חתמו.',
  'נדרש חידוש סימון קווי אש בגבול החלקה.',
];

// ---------- contractors ----------
const CONTRACTOR_NAMES = [
  'יער ירוק הובלות והשקעות בע"מ', 'שחר עצים וגיזום בע"מ', 'אחים מרציאנו - עבודות יער', 'כרמל פורסט שירותי יערנות',
  'אופק עבודות עפר ויער', 'בית הכרם לעבודות גיזום', 'נגב ירוק שירותי הובלה', 'הדר יער ופיתוח נופי',
  'אלון הגליל קבלני כריתה', 'אבו רומי לעבודות יער ועפר', 'דהאן שירותי יער והובלות', 'עץ אדיר בע"מ',
  'מעיינות יער ופיתוח', 'שורשים - קבלני יער מוסמכים', 'ג.ט. כריתה וגיזום מקצועי', 'הרים וגבעות עבודות יער',
  'אורן הנגב לעבודות יער', 'חורש תבור קבלני יער', 'משק הכרמל עבודות עפר', 'ים סוף עצים וגיזום',
  'ברוש הצפון בע"מ', 'אלה הארץ שירותי יער', 'מסור ושבבים בע"מ', 'עמק הירדן הובלות עץ',
  'בן חיים פרויקטי יער בע"מ',
];
const CONTRACTOR_FLEET = [
  '3 משאיות מנוף, 2 בובקט, 6 מסורי שרשרת, מרסקת ניידת',
  '2 פורוורדרים, טרקטור יער, 4 מסורי שרשרת, צוות גיזום מוסמך',
  '4 משאיות פול-טריילר, שופל, מחפר עם ראש קוצץ',
  '2 משאיות סל מנוף, מרסקת תעשייתית, צוות סנפלינג',
  '5 רכבי שטח, 2 משאיות הייבר, בובקט חישוף, צנרת כיבוי מים ניידת',
];

export function generateContractors(): ContractorInfo[] {
  return CONTRACTOR_NAMES.map((name, i) => {
    const regNo = 2000 + i * 137 + rint(0, 90);
    const ph = `0${pick([50, 52, 53, 54])}-${rint(1000000, 9999999)}`;
    return {
      Contractor_ID: `CONTR-${regNo}`,
      Name: name,
      RegNumber: `קבלן רשום מס' ${regNo}`,
      Phone: ph,
      Email: `office${i + 1}@${['forest', 'trees', 'yaar', 'kkl-partner'][i % 4]}-contractors.co.il`,
      ActiveContractsCount: 0,
      TotalDeliveredMQ: 0,
      Rating: r1(3.9 + rnd() * 1.0),
      FleetSummary: pick(CONTRACTOR_FLEET),
    };
  });
}

// ---------- contracts ----------
const STATUS_PLAN: ContractStatus[] = [
  'בביצוע', 'בביצוע', 'בביצוע', 'בביצוע', 'בביצוע', 'בביצוע', 'בביצוע', 'בביצוע', 'בביצוע', 'בביצוע',
  'הסתיים', 'הסתיים', 'הסתיים', 'הסתיים', 'הסתיים',
  'בדיקת שטח', 'בדיקת שטח', 'אושר לביצוע', 'אושר לביצוע', 'בתכנון', 'בתכנון', 'בתכנון', 'מושהה', 'מושהה',
];

function standStatusFor(c: ContractStatus, manoIdx: number, manot: number): StandStatus {
  if (c === 'הסתיים' || c === 'בדיקת שטח') return 'בוצע';
  if (c === 'מושהה') return manoIdx === 0 ? 'בוצע' : 'מושהה';
  if (c === 'בביצוע') return manoIdx < manot / 2 - 0.5 ? 'בוצע' : manoIdx === Math.floor(manot / 2) ? 'בביצוע' : 'טרם החל';
  return 'טרם החל';
}

export function generateContracts(contractors: ContractorInfo[]): Contract[] {
  const out: Contract[] = [];
  const usedBlocks = new Set<string>();
  let dnSeq = 9200;
  let wsSeq = 100200;

  STATUS_PLAN.forEach((status, idx) => {
    const geo = GEO[idx % GEO.length];
    const forest = geo.forests[(idx * 3 + Math.floor(idx / GEO.length)) % geo.forests.length];
    const year = status === 'הסתיים' ? pick([2023, 2023, 2024]) : status === 'בתכנון' || status === 'אושר לביצוע' ? 2025 : pick([2024, 2024, 2025]);
    const contractNo = 110 + idx;
    const regionShort = geo.region === 'מרחב צפון' ? 'צפ' : geo.region === 'מרחב מרכז' ? 'מר' : 'דר';
    const Contract_ID = `CNT-${year}-${pad(contractNo, 3)}`;
    const Contract_Number = `${year}-${regionShort}-${pad(contractNo, 3)}`;
    const contractor = contractors[idx % (contractors.length - 1)];
    const supervisor = SUPERVISORS[idx % SUPERVISORS.length];
    const op = pick(['דילול מנוהל', 'דילול סניטרי', 'חישוף קווי אש', 'טיפול במינים פולשים', 'ממשק יערני', 'גיזום גובה ודילול']);
    const name = `${op} ${forest.name}`;
    const blockLabel = `${forest.name} (גוש ${forest.block})`;
    usedBlocks.add(blockLabel);

    const startDate =
      status === 'בתכנון' || status === 'אושר לביצוע'
        ? addDays('2025-03-01', rint(0, 60))
        : status === 'הסתיים'
        ? `${year}-0${rint(1, 5)}-${pad(rint(1, 27))}`
        : status === 'בביצוע' || status === 'בדיקת שטח' || status === 'מושהה'
        ? year === 2025
          ? `2025-01-${pad(rint(2, 20))}`
          : `2024-0${rint(2, 9)}-${pad(rint(1, 27))}`
        : '2025-03-01';
    const endDate = addDays(startDate, rint(150, 280));

    // --- manot & stands ---
    const manotCount = rint(2, 4);
    const manot: Mano[] = [];
    const standIds: string[] = [];
    for (let m = 0; m < manotCount; m++) {
      const sCount = rint(2, 3);
      const stands: Stand[] = [];
      const manoStatus = standStatusFor(status, m, manotCount);
      for (let s = 0; s < sCount; s++) {
        const sid = `${forest.block}-${pad(rint(1, 40))}`;
        standIds.push(sid);
        stands.push({
          Stand_ID: sid,
          AreaDunam: r1(rint(180, 900) / 10),
          DominantSpecies: pick(SPECIES),
          TreatmentType: pick(TREATMENTS),
          Status: manoStatus,
          TreeDensity: `${rint(220, 480)} עצים/דונם`,
          TargetVolumeMQ: rint(120, 520),
        });
      }
      manot.push({
        Mano_ID: `M-${forest.block}-${pad(m + 1)}`,
        Mano_Name: `מנה ${['א', 'ב', 'ג', 'ד'][m]}' - ${pick(['שלוחה צפונית', 'מדרון מערבי', 'גבעה מרכזית', 'ואדי', 'רכס', 'חלקת גבול'])} ${forest.name.replace('יער ', '')}`,
        Status: manoStatus,
        Stands: stands,
      });
    }

    // --- licenses ---
    const executing = status === 'בביצוע' || status === 'הסתיים' || status === 'בדיקת שטח' || status === 'מושהה';
    const fellCount = rint(4, 6);
    const felling: FellingLicense[] = [];
    let totalApproved = 0;
    let totalDelivered = 0;
    const removingAll: RemovingLicense[] = [];
    for (let f = 0; f < fellCount; f++) {
      const num = 20 + idx * 7 + f;
      const shortYear = String(year).slice(2);
      const flId = `LIC-KR-${year}-${pad(num, 3)}`;
      const fApproved = rint(4, 14) * 50;
      const issue = addDays(startDate, -rint(5, 25));
      const expiry = addDays(issue, rint(240, 330));
      const rCount = rint(1, 3);
      const removing: RemovingLicense[] = [];
      let remLeft = fApproved;
      for (let r = 0; r < rCount; r++) {
        const rApproved = r === rCount - 1 ? remLeft : Math.max(100, Math.round((remLeft / (rCount - r)) / 10) * 10);
        remLeft = Math.max(0, remLeft - rApproved);
        let delivered = 0;
        if (executing) {
          if (status === 'הסתיים') delivered = rApproved;
          else if (status === 'בביצוע' && chance(0.07)) delivered = Math.max(0, rApproved - rint(8, 38)); // low-balance alert
          else delivered = Math.round(rApproved * (0.2 + rnd() * 0.65));
        }
        const balance = Math.max(0, rApproved - delivered);
        const low = balance > 0 && balance < 40;
        const suffix = ['א', 'ב', 'ג'][r];
        const rIssue = addDays(issue, rint(5, 40));
        removing.push({
          Removing_License_ID: `LIC-NT-${year}-${pad(num, 3)}-${suffix}`,
          Original_License_Id: flId,
          License_Number: `רישיון נטילה ${pad(num, 3)}/${shortYear}-${suffix}`,
          IssueDate: rIssue,
          ExpiryDate: addDays(rIssue, rint(120, 200)),
          ApprovedMQ: rApproved,
          DeliveredMQ: delivered,
          BalanceMQ: balance,
          Destination: pick(YARDS),
          Status: low
            ? 'פעיל - התראה קריטית: יתרה נמוכה'
            : !executing
            ? 'בתכנון'
            : status === 'הסתיים' || balance === 0
            ? 'מוצה'
            : 'פעיל בתוקף',
          Notes: low ? `נותרו ${balance} מ"ק בלבד. נדרשת הגשת בקשה לרישיון נטילה נוסף.` : undefined,
          Contract_ID,
        });
        totalDelivered += delivered;
      }
      removingAll.push(...removing);
      totalApproved += fApproved;
      const ownStands = standIds.filter((_, i) => i % fellCount === f % fellCount).slice(0, 4);
      felling.push({
        Felling_License_ID: flId,
        License_Number: `רישיון כריתה ${pad(num, 3)}/${shortYear}`,
        IssueDate: issue,
        ExpiryDate: expiry,
        ForesterName: `${pick(FIRST)} ${pick(LAST)} - ${geo.forester}`,
        ApprovedQuantityMQ: fApproved,
        StandsList: (ownStands.length ? ownStands : [standIds[0]]).join(', '),
        Removing_Licenses: removing,
        Contract_ID,
      });
    }

    // --- delivery notes ---
    const notes: DeliveryNote[] = [];
    const nCount = status === 'הסתיים' ? rint(7, 10) : status === 'בביצוע' ? rint(8, 11) : status === 'בדיקת שטח' ? rint(4, 6) : status === 'מושהה' ? rint(2, 4) : 0;
    const activeRemovals = removingAll.filter((r) => r.DeliveredMQ > 0);
    for (let n = 0; n < nCount && activeRemovals.length; n++) {
      const rl = pick(activeRemovals);
      const daysBack = rint(1, 110);
      const dateBase = status === 'הסתיים' ? addDays(endDate, -daysBack) : addDays(TODAY, -daysBack);
      dnSeq += rint(7, 60);
      wsSeq += rint(5, 80);
      notes.push({
        Delivery_ID: `DN-${dateBase.slice(0, 4)}-${dnSeq}`,
        Date: `${dateBase} ${pad(rint(6, 17))}:${pad(rint(0, 59))}`,
        QuantityMQ: r1(rint(180, 520) / 10),
        WoodType: `${pick(SPECIES)} - ${pick(WOOD_TYPES)}`,
        Removing_License_ID: rl.Removing_License_ID,
        DriverName: `${pick(FIRST)} ${pick(LAST)}`,
        TruckPlate: `${rint(100, 899)}-${rint(10, 99)}-${rint(100, 899)}`,
        WeighSlipNumber: `WS-${wsSeq}`,
        DestinationYard: rl.Destination,
        SupervisorSign: `מאושר ע״י ${supervisor.split(' - ')[0]}`,
        Notes: chance(0.25) ? 'שקילה מאוזנת במשקל גשר, ללא חריגת משקל.' : undefined,
      });
    }
    notes.sort((a, b) => b.Date.localeCompare(a.Date));

    // --- work logs ---
    const logs: WorkLog[] = [];
    const lCount = status === 'בביצוע' ? rint(7, 10) : status === 'הסתיים' ? rint(6, 8) : status === 'בדיקת שטח' ? rint(5, 7) : status === 'מושהה' ? rint(3, 4) : 0;
    for (let l = 0; l < lCount; l++) {
      const day = status === 'הסתיים' ? addDays(endDate, -rint(1, 120)) : addDays(TODAY, -rint(0, 90));
      const startH = rint(6, 7);
      const endH = rint(14, 17);
      const wCount = rint(3, 6);
      const workers: string[] = [];
      for (let w = 0; w < wCount; w++) {
        workers.push(`${pick(FIRST)} ${pick(LAST)} (${w === 0 ? 'מנהל עבודה' : pick(['גוזם מוסמך', 'נהג משאית', 'פועל יער', 'מפעיל מרסקת'])})`);
      }
      const eqCount = rint(2, 4);
      const eq: string[] = [];
      for (let e = 0; e < eqCount; e++) eq.push(`${pick(EQUIPMENT)} (מס' ${rint(10, 99)}-${rint(100, 999)})`);
      const incident = chance(0.06);
      logs.push({
        Log_ID: `WL-${day.slice(0, 4)}-${200 + idx * 12 + l}`,
        Date: day,
        StartTime: `${pad(startH)}:${pad(pick([0, 15, 30]))}`,
        EndTime: `${pad(endH)}:${pad(pick([0, 30]))}`,
        Contract_ID,
        SupervisorComments: pick(LOG_COMMENTS),
        Weather: pick(WEATHERS),
        StandsWorked: pick(standIds),
        Workers: workers.join(', '),
        Equipment: Array.from(new Set(eq)).join(', '),
        SafetyIncident: incident,
        SafetyNotes: incident ? 'אירוע כמעט-ופגע: ענף נפל סמוך לעובד, בוצע תחקיר ונסגר.' : undefined,
      });
    }
    logs.sort((a, b) => b.Date.localeCompare(a.Date));

    const balanceMQ = Math.max(0, totalApproved - totalDelivered);
    const execPct = totalApproved > 0 ? r1((totalDelivered / totalApproved) * 100) : 0;

    out.push({
      Contract_ID,
      Contract_Number,
      Contract_Name: name,
      Region: geo.region,
      District: geo.district,
      Block: blockLabel,
      Contractor: contractor.Name,
      ContractorContact: contractor.Phone,
      Status: status,
      Year: year,
      StartDate: startDate,
      EndDate: endDate,
      TotalApprovedMQ: totalApproved,
      TotalDeliveredMQ: totalDelivered,
      BalanceMQ: balanceMQ,
      ExecutionPercent: execPct,
      Description: `${op} בחלקות ${pick(SPECIES)} ו${pick(SPECIES)} ב${forest.name}, בהתאם לתוכנית העבודה השנתית של ${geo.region}.`,
      Supervisor: supervisor,
      Manot: manot,
      Felling_Licenses: felling,
      DeliveryNotes: notes,
      WorkLogs: logs,
      Coordinates: {
        lat: r1(geo.lat[0] * 1000 + rnd() * (geo.lat[1] - geo.lat[0]) * 1000) / 1000,
        lng: r1(geo.lng[0] * 1000 + rnd() * (geo.lng[1] - geo.lng[0]) * 1000) / 1000,
      },
    });
  });
  return out;
}

/** Recompute per-contractor KPIs from the full contracts list. */
export function syncContractorStats(contractors: ContractorInfo[], contracts: Contract[]): ContractorInfo[] {
  return contractors.map((ci) => {
    const mine = contracts.filter((c) => c.Contractor === ci.Name);
    return {
      ...ci,
      ActiveContractsCount: mine.filter((c) => c.Status === 'בביצוע').length,
      TotalDeliveredMQ: mine.reduce((a, c) => a + c.TotalDeliveredMQ, 0),
    };
  });
}
