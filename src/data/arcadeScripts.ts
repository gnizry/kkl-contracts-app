/**
 * ArcGIS Experience Builder (ExB) - Core Arcade Data Expressions
 * KKL forestry contracts dashboard.
 *
 * הביטויים כתובים מול הסכמה האמיתית של השירות (לפי דו"ח "Solution Design"):
 *   SubTenders (התקשרות/תיחור) -> SubWorkUnits (מנות) -> SubWorkUnitStands (עומדים)
 *   ClearingLicense (רישיון כריתה) -> RemovingLicense (רישיון נטילה, Original_License_Id = License_Id)
 *   TendersShippingCertificate (תעודות משלוח) , TendersDailyWorkLog (יומני עבודה)
 *   WorkLogWorkers / WorkLogEquipment (עובדים וציוד, ילדים של יומן העבודה)
 *
 * שימו לב: בסכמה הקיימת STDistrictName = "מרחב" ו-STRegionName = "אזור" (כך הוגדרו בשכבה).
 */

export interface ArcadeScriptDef {
  id: string;
  title: string;
  hebrewTitle: string;
  description: string;
  code: string;
  outputSchemaDescription: string;
  useCaseExB: string;
}

export const ARCADE_EXPRESSION_PIVOT_TABLE = `// =========================================================================
// ARCADE DATA EXPRESSION 1: טבלה מרכזת לפי מרחב / אזור / גוש יער
// מקור: SubTenders + TendersShippingCertificate + ClearingLicense/RemovingLicense
// חובה: שדה OBJECTID מסוג esriFieldTypeOID - מאפשר Export to CSV מובנה ב-Table של ExB
// =========================================================================

// --- הגדרות: יש להחליף ל-Item ID ול-Layer ID בפועל (Data Expression > Add layers) ---
var portal = Portal('https://www.arcgis.com');
var ITEM_ID = 'REPLACE_WITH_FEATURE_SERVICE_ITEM_ID';
var L_SUBTENDERS = 0;   // SubTenders
var L_STANDS     = 2;   // SubWorkUnitStands  (לאמת מספר שכבה)
var L_CLEARING   = 9;   // ClearingLicense    (לאמת מספר שכבה)
var L_REMOVING   = 10;  // RemovingLicense    (לאמת מספר שכבה)
var L_SHIPPING   = 11;  // TendersShippingCertificate (לאמת מספר שכבה)

var tenders = FeatureSetByPortalItem(portal, ITEM_ID, L_SUBTENDERS,
    ['GlobalID','SubTenderName','STStageStatus','STDistrictName','STRegionName',
     'STForestRegionName','SubTenderYear','STEstimatedWorkVolumeCubicMeter'], false);
var stands = FeatureSetByPortalItem(portal, ITEM_ID, L_STANDS,
    ['StandSubTenderGID','LoggingLicense'], false);
var clearing = FeatureSetByPortalItem(portal, ITEM_ID, L_CLEARING,
    ['License_Id','LicenseNumber'], false);
var removingLow = Filter(FeatureSetByPortalItem(portal, ITEM_ID, L_REMOVING,
    ['Original_License_Id','BalanceMQ'], false), 'BalanceMQ > 0 AND BalanceMQ < 40');

// 1. כמות שפונתה לכל התקשרות (סכום ShippingQuantity לפי SubTenderGlobalID) - צבירה בצד השרת
var shipAgg = GroupBy(
    FeatureSetByPortalItem(portal, ITEM_ID, L_SHIPPING, ['SubTenderGlobalID','ShippingQuantity'], false),
    ['SubTenderGlobalID'],
    [{ name: 'Delivered', expression: 'ShippingQuantity', statistic: 'SUM' }]);
var deliveredByTender = {};
for (var sh in shipAgg) {
    deliveredByTender[Upper(Text(sh.SubTenderGlobalID))] = sh.Delivered;
}

// 2. רישיונות נטילה ביתרה < 40 מ"ק -> לפי רישיון כריתה -> לפי התקשרות (דרך LoggingLicense בעומדים)
var lowByClearingId = {};
for (var r in removingLow) { lowByClearingId[Text(r.Original_License_Id)] = 1; }
var clearingIdByNumber = {};
for (var c in clearing) { clearingIdByNumber[Text(c.LicenseNumber)] = Text(c.License_Id); }
var lowByTender = {};
var seen = {};
for (var s in stands) {
    var lic = Text(s.LoggingLicense);
    var tkey = Upper(Text(s.StandSubTenderGID));
    var pair = tkey + '|' + lic;
    if (!HasKey(seen, pair) && HasKey(clearingIdByNumber, lic) && HasKey(lowByClearingId, clearingIdByNumber[lic])) {
        seen[pair] = 1;
        lowByTender[tkey] = IIf(HasKey(lowByTender, tkey), lowByTender[tkey] + 1, 1);
    }
}

// 3. קיבוץ לפי מרחב | אזור | גוש
var groups = {};
var keys = [];
for (var t in tenders) {
    var district = DefaultValue(t.STDistrictName, 'ללא מרחב');   // מרחב
    var region   = DefaultValue(t.STRegionName, 'ללא אזור');     // אזור
    var block    = DefaultValue(t.STForestRegionName, 'ללא גוש'); // גוש יער
    var key = district + '|' + region + '|' + block;
    if (!HasKey(groups, key)) {
        groups[key] = { d: district, r: region, b: block, total: 0, active: 0, done: 0,
                        planned: 0, delivered: 0, low: 0 };
        Push(keys, key);
    }
    var g = groups[key];
    var gid = Upper(Text(t.GlobalID));
    g.total += 1;
    if (t.STStageStatus == 'בביצוע') { g.active += 1; }
    else if (t.STStageStatus == 'הסתיים') { g.done += 1; }
    g.planned += DefaultValue(t.STEstimatedWorkVolumeCubicMeter, 0);
    g.delivered += DefaultValue(deliveredByTender[gid], 0);
    g.low += DefaultValue(lowByTender[gid], 0);
    groups[key] = g;
}

// 4. בניית ה-FeatureSet (OBJECTID רץ)
var feats = [];
var oid = 1;
for (var i = 0; i < Count(keys); i++) {
    var x = groups[keys[i]];
    Push(feats, { attributes: {
        OBJECTID: oid,
        District: x.d, Region: x.r, ForestBlock: x.b,
        TotalContracts: x.total, ActiveContracts: x.active, CompletedContracts: x.done,
        EstimatedMQ: Round(x.planned, 1),
        DeliveredMQ: Round(x.delivered, 1),
        BalanceMQ: Round(x.planned - x.delivered, 1),
        ExecutionPercent: IIf(x.planned > 0, Round(x.delivered / x.planned * 100, 1), 0),
        LowBalanceLicenses: x.low
    }});
    oid += 1;
}

return FeatureSet(Text({
    fields: [
        { name: 'OBJECTID', type: 'esriFieldTypeOID', alias: 'מזהה' },
        { name: 'District', type: 'esriFieldTypeString', alias: 'מרחב' },
        { name: 'Region', type: 'esriFieldTypeString', alias: 'אזור' },
        { name: 'ForestBlock', type: 'esriFieldTypeString', alias: 'גוש' },
        { name: 'TotalContracts', type: 'esriFieldTypeInteger', alias: 'סה"כ התקשרויות' },
        { name: 'ActiveContracts', type: 'esriFieldTypeInteger', alias: 'בביצוע' },
        { name: 'CompletedContracts', type: 'esriFieldTypeInteger', alias: 'הסתיימו' },
        { name: 'EstimatedMQ', type: 'esriFieldTypeDouble', alias: 'כמות מוערכת (מ"ק)' },
        { name: 'DeliveredMQ', type: 'esriFieldTypeDouble', alias: 'שפונה (מ"ק)' },
        { name: 'BalanceMQ', type: 'esriFieldTypeDouble', alias: 'יתרה (מ"ק)' },
        { name: 'ExecutionPercent', type: 'esriFieldTypeDouble', alias: '% ביצוע' },
        { name: 'LowBalanceLicenses', type: 'esriFieldTypeInteger', alias: 'רישיונות ביתרה < 40' }
    ],
    geometryType: '',
    features: feats
}));`;

export const ARCADE_EXPRESSION_CONTRACT_360 = `// =========================================================================
// ARCADE DATA EXPRESSION 2: כרטיס התקשרות 360° (עץ מקונן ב-JSON)
// SubTenders -> SubWorkUnits -> SubWorkUnitStands
//            -> ClearingLicense -> RemovingLicense (Original_License_Id = License_Id)
//            -> TendersShippingCertificate (חדש->ישן)
//            -> TendersDailyWorkLog (+ עובדים וציוד כמחרוזות משוטחות)
// =========================================================================
// הערות:
//  * קשרי הגלובל-איידי לפי טבלת ה-Relationships בדו"ח: SubTenders.GlobalID -> SubWorkUnits.SubWorkUnitParentGlobalID,
//    SubWorkUnits.GlobalID -> SubWorkUnitStands.ManaParentGlobalID.
//  * שיוך רישיון כריתה לעומד נעשה לפי SubWorkUnitStands.LoggingLicense = ClearingLicense.LicenseNumber.
//  * עובדים/ציוד: משתמשים בשדות המשוטחים WorkersList / EquipmentList של יומן העבודה;
//    אם ריקים - נופלים לטבלאות WorkLogWorkers / WorkLogEquipment.
//  * לביצועים: להוסיף Filter על SubTenders (לפי הבחירה ב-ExB) לפני הלולאה - ראו שורת WHERE.
// =========================================================================

var portal = Portal('https://www.arcgis.com');
var ITEM_ID = 'REPLACE_WITH_FEATURE_SERVICE_ITEM_ID';

var tenders  = Filter(FeatureSetByPortalItem(portal, ITEM_ID, 0, ['*'], false), '1=1'); // WHERE לסינון לפי הצורך
var swu      = FeatureSetByPortalItem(portal, ITEM_ID, 1,  ['*'], false); // SubWorkUnits
var stands   = FeatureSetByPortalItem(portal, ITEM_ID, 2,  ['*'], false); // SubWorkUnitStands
var clearing = FeatureSetByPortalItem(portal, ITEM_ID, 9,  ['*'], false); // ClearingLicense
var removing = FeatureSetByPortalItem(portal, ITEM_ID, 10, ['*'], false); // RemovingLicense
var shipping = FeatureSetByPortalItem(portal, ITEM_ID, 11, ['*'], false); // TendersShippingCertificate
var workLogs = FeatureSetByPortalItem(portal, ITEM_ID, 12, ['*'], false); // TendersDailyWorkLog
var workers  = FeatureSetByPortalItem(portal, ITEM_ID, 13, ['*'], false); // WorkLogWorkers
var equip    = FeatureSetByPortalItem(portal, ITEM_ID, 14, ['*'], false); // WorkLogEquipment

function flattenWorkers(logGid) {
    var parts = [];
    for (var w in Filter(workers, 'WorkersParentGlobalID = @logGid')) {
        Push(parts, DefaultValue(w.FullName, Trim(DefaultValue(w.FirstName, '') + ' ' + DefaultValue(w.FamilyName, ''))));
    }
    return Concatenate(parts, ', ');
}
function flattenEquipment(logGid) {
    var parts = [];
    for (var e in Filter(equip, 'EquipmentParentGlobalID = @logGid')) {
        Push(parts, Trim(DefaultValue(e.EquipmentType, '') + ' ' + DefaultValue(e.EquipmentLicenseText, '')));
    }
    return Concatenate(parts, ', ');
}

var out = [];
var oid = 1;

for (var t in tenders) {
    var tGid = t.GlobalID;

    // א. מנות ועומדים
    var manot = [];
    var licenseNumbers = {};
    for (var m in Filter(swu, 'SubWorkUnitParentGlobalID = @tGid')) {
        var mGid = m.GlobalID;
        var standsArr = [];
        for (var s in Filter(stands, 'ManaParentGlobalID = @mGid')) {
            Push(standsArr, {
                Stand: s.HelkaAndStand,                 // חלקה-עומד
                Forest: s.StandForestname,
                Status: s.StandStatus,                  // בתכנון / לפני ביצוע / בביצוע / בוצע ...
                WorkType: s.StandWorkType,
                AreaDunam: s.EstimatedWorkAreaDunam,
                EstimatedMQ: s.EstimatedWorkVolumeCubicMeter,
                LoggingLicense: s.LoggingLicense
            });
            if (!IsEmpty(s.LoggingLicense)) { licenseNumbers[Text(s.LoggingLicense)] = 1; }
        }
        Push(manot, { Mana: m.SWUID, Status: m.SWUStatus, Stands: standsArr });
    }

    // ב. רישיונות כריתה -> רישיונות נטילה (קינון לפי Original_License_Id) + התראת יתרה < 40
    var licenses = [];
    var hasLow = false;
    for (var num in licenseNumbers) {
        for (var cl in Filter(clearing, 'LicenseNumber = @num')) {
            var clId = cl.License_Id;
            var rems = [];
            for (var rm in Filter(removing, 'Original_License_Id = @clId')) {
                var bal = DefaultValue(rm.BalanceMQ, 0);
                var low = bal > 0 && bal < 40;
                if (low) { hasLow = true; }
                Push(rems, {
                    RemovingNumber: rm.LicenseNumber,
                    From: Text(rm.FromDate, 'YYYY-MM-DD'), To: Text(rm.ToDate, 'YYYY-MM-DD'),
                    ApprovedMQ: rm.RemovingQuantityMQ,
                    BalanceMQ: bal,
                    LowBalanceAlert: low            // true => להציג באדום עם ⚠
                });
            }
            Push(licenses, {
                ClearingNumber: cl.LicenseNumber,
                From: Text(cl.From_Date, 'YYYY-MM-DD'), To: Text(cl.To_Date, 'YYYY-MM-DD'),
                ClearingBalance: cl.Clearing_Balance, RemovingBalance: cl.Removing_Balance,
                Removing: rems
            });
        }
    }

    // ג. תעודות משלוח - חדש לישן
    var notes = [];
    for (var sc in OrderBy(Filter(shipping, 'SubTenderGlobalID = @tGid'), 'IssueDate DESC')) {
        Push(notes, {
            CertificateID: sc.CertificateID,
            Date: Text(sc.IssueDate, 'YYYY-MM-DD HH:mm'),
            QuantityMQ: sc.ShippingQuantity,
            Units: sc.UnitName,
            RemovingLicense: sc.RemovingLicenseNum,
            Driver: sc.DriverName, Plate: sc.LicensePlate,
            WeighingNo: sc.WeighingLicense,
            Status: sc.Status
        });
    }

    // ד. יומני עבודה (+ עובדים וציוד משוטחים)
    var logs = [];
    for (var wl in OrderBy(Filter(workLogs, 'SubTenderGlobalID = @tGid'), 'CreationDate DESC')) {
        var lGid = wl.GlobalID;
        Push(logs, {
            LogID: wl.WorkLogID,
            Date: wl.Date,
            Start: wl.StartTimeText, End: wl.EndTimeText,
            SupervisorComments: wl.SupervisorComments,
            Workers: IIf(IsEmpty(wl.WorkersList), flattenWorkers(lGid), wl.WorkersList),
            Equipment: IIf(IsEmpty(wl.EquipmentList), flattenEquipment(lGid), wl.EquipmentList)
        });
    }

    var payload = {
        Name: t.SubTenderName, Code: t.SubTenderID, Status: t.STStageStatus,
        District: t.STDistrictName, Region: t.STRegionName, ForestBlock: t.STForestRegionName,
        Contractor: t.STSelectedContractor,
        Start: Text(t.STWorkStartDate, 'YYYY-MM-DD'), End: Text(t.STWorkEndDate, 'YYYY-MM-DD'),
        Manot: manot, Licenses: licenses, DeliveryNotes: notes, WorkLogs: logs
    };

    Push(out, { attributes: {
        OBJECTID: oid,
        SubTenderGlobalID: Text(tGid),
        SubTenderName: t.SubTenderName,
        Status: t.STStageStatus,
        District: t.STDistrictName,
        Region: t.STRegionName,
        HasLowBalance: IIf(hasLow, 1, 0),
        ManotCount: Count(manot), LicensesCount: Count(licenses),
        NotesCount: Count(notes), LogsCount: Count(logs),
        JSON_Data: Text(payload)
    }});
    oid += 1;
}

return FeatureSet(Text({
    fields: [
        { name: 'OBJECTID', type: 'esriFieldTypeOID', alias: 'מזהה' },
        { name: 'SubTenderGlobalID', type: 'esriFieldTypeString', alias: 'GlobalID התקשרות', length: 50 },
        { name: 'SubTenderName', type: 'esriFieldTypeString', alias: 'שם התקשרות', length: 256 },
        { name: 'Status', type: 'esriFieldTypeString', alias: 'סטטוס', length: 50 },
        { name: 'District', type: 'esriFieldTypeString', alias: 'מרחב', length: 50 },
        { name: 'Region', type: 'esriFieldTypeString', alias: 'אזור', length: 50 },
        { name: 'HasLowBalance', type: 'esriFieldTypeInteger', alias: 'יתרה < 40 מ"ק' },
        { name: 'ManotCount', type: 'esriFieldTypeInteger', alias: 'מנות' },
        { name: 'LicensesCount', type: 'esriFieldTypeInteger', alias: 'רישיונות כריתה' },
        { name: 'NotesCount', type: 'esriFieldTypeInteger', alias: 'תעודות משלוח' },
        { name: 'LogsCount', type: 'esriFieldTypeInteger', alias: 'יומני עבודה' },
        { name: 'JSON_Data', type: 'esriFieldTypeString', alias: 'עץ 360 (JSON)', length: 1000000 }
    ],
    geometryType: '',
    features: out
}));`;

export const ARCADE_SCRIPTS: ArcadeScriptDef[] = [
  {
    id: 'arcade-pivot-table',
    title: 'Arcade Data Expression 1 (Aggregated Pivot Table)',
    hebrewTitle: 'סקריפט Arcade 1: טבלה מרכזת וייצוא CSV (OBJECTID מסוג esriFieldTypeOID)',
    description:
      'מקבץ את שכבת SubTenders לפי מרחב / אזור / גוש יער, מצרף כמויות שפונו מתעודות המשלוח (GroupBy על SubTenderGlobalID) וסופר רישיונות נטילה ביתרה < 40 מ"ק. כולל OBJECTID לייצוא CSV מובנה.',
    code: ARCADE_EXPRESSION_PIVOT_TABLE,
    outputSchemaDescription:
      'FeatureSet ללא גיאומטריה: OBJECTID, District (מרחב), Region (אזור), ForestBlock, TotalContracts, ActiveContracts, CompletedContracts, EstimatedMQ, DeliveredMQ, BalanceMQ, ExecutionPercent, LowBalanceLicenses.',
    useCaseExB:
      'מקור נתונים לווידג\'ט Table / Chart ב-Experience Builder, עם סינון דינמי וייצוא CSV.',
  },
  {
    id: 'arcade-contract-360',
    title: 'Arcade Data Expression 2 (Contract 360° Nested Tree)',
    hebrewTitle: 'סקריפט Arcade 2: כרטיס התקשרות 360° היררכי (Master-Detail JSON)',
    description:
      'בונה עץ מקונן: התקשרות -> מנות -> עומדים -> רישיונות כריתה -> רישיונות נטילה (Original_License_Id) -> תעודות משלוח (חדש לישן) -> יומני עבודה עם עובדים וציוד כמחרוזות משוטחות. מסמן יתרה < 40 מ"ק.',
    code: ARCADE_EXPRESSION_CONTRACT_360,
    outputSchemaDescription:
      'FeatureSet עם שדות סיכום ו-JSON_Data המכיל את כל העץ ההיררכי.',
    useCaseExB:
      'מקור נתונים לווידג\'ט List / Card ב-Experience Builder, המגיב לבחירת התקשרות בטבלה או במפה.',
  },
];
