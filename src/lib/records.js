import { supabase } from './supabase';
const TABLE = 'test_records';
function toDb(form) {
  return {
    status: form.status, date: form.date, address_location: form.addressLocation,
    switchboard_number: form.switchboardNumber, contractor_name: form.contractorName,
    contractor_number: form.contractorNumber, worker_name: form.workerName,
    licence_number: form.licenceNumber, client_email: form.clientEmail,
    psc_at_main_switch: form.pscAtMainSwitch, live_parts_screened: form.livePartsScreened,
    main_link_neutral_reconnected: form.mainLinkNeutralReconnected,
    msb_men_compliant: form.msbMenCompliant, msb_max_demand: form.msbMaxDemand,
    msb_main_switch_current_rating: form.msbMainSwitchCurrentRating,
    msb_main_switch_psc_rating: form.msbMainSwitchPscRating, msb_conductor_ccc: form.msbConductorCcc,
    msb_conductor_size: form.msbConductorSize, msb_earth_cont_main: form.msbEarthContMain,
    msb_earth_cont_eq: form.msbEarthContEq, msb_polarity: form.msbPolarity,
    msb_ins_res_ae: form.msbInsResAE, msb_ins_res_an: form.msbInsResAN,
    msb_ins_res_ne: form.msbInsResNE, msb_ins_res_pp: form.msbInsResPP,
    msb_circuit_length: form.msbCircuitLength, msb_comments: form.msbComments,
    test_equip1_type: form.testEquip1Type, test_equip1_serial: form.testEquip1Serial,
    test_equip1_cal_date: form.testEquip1CalDate, test_equip2_type: form.testEquip2Type,
    test_equip2_serial: form.testEquip2Serial, test_equip2_cal_date: form.testEquip2CalDate,
    test_equip3_type: form.testEquip3Type, test_equip3_serial: form.testEquip3Serial,
    test_equip3_cal_date: form.testEquip3CalDate, test_equip4_type: form.testEquip4Type,
    test_equip4_serial: form.testEquip4Serial, test_equip4_cal_date: form.testEquip4CalDate,
    company_name: form.companyName, company_abn: form.companyAbn, company_phone: form.companyPhone,
    company_address: form.companyAddress, signature_data: form.signatureData, notes: form.notes,
    share_token: form.share_token, mains_circuits: form.mainsCircuits || [], sub_circuits: form.subCircuits || [],
  };
}
function fromDb(row) {
  if (!row) return null;
  return {
    id: row.id, created_at: row.created_at, updated_at: row.updated_at,
    status: row.status, date: row.date, addressLocation: row.address_location,
    switchboardNumber: row.switchboard_number, contractorName: row.contractor_name,
    contractorNumber: row.contractor_number, workerName: row.worker_name,
    licenceNumber: row.licence_number, clientEmail: row.client_email,
    pscAtMainSwitch: row.psc_at_main_switch, livePartsScreened: row.live_parts_screened,
    mainLinkNeutralReconnected: row.main_link_neutral_reconnected,
    msbMenCompliant: row.msb_men_compliant, msbMaxDemand: row.msb_max_demand,
    msbMainSwitchCurrentRating: row.msb_main_switch_current_rating,
    msbMainSwitchPscRating: row.msb_main_switch_psc_rating, msbConductorCcc: row.msb_conductor_ccc,
    msbConductorSize: row.msb_conductor_size, msbEarthContMain: row.msb_earth_cont_main,
    msbEarthContEq: row.msb_earth_cont_eq, msbPolarity: row.msb_polarity,
    msbInsResAE: row.msb_ins_res_ae, msbInsResAN: row.msb_ins_res_an,
    msbInsResNE: row.msb_ins_res_ne, msbInsResPP: row.msb_ins_res_pp,
    msbCircuitLength: row.msb_circuit_length, msbComments: row.msb_comments,
    testEquip1Type: row.test_equip1_type, testEquip1Serial: row.test_equip1_serial,
    testEquip1CalDate: row.test_equip1_cal_date, testEquip2Type: row.test_equip2_type,
    testEquip2Serial: row.test_equip2_serial, testEquip2CalDate: row.test_equip2_cal_date,
    testEquip3Type: row.test_equip3_type, testEquip3Serial: row.test_equip3_serial,
    testEquip3CalDate: row.test_equip3_cal_date, testEquip4Type: row.test_equip4_type,
    testEquip4Serial: row.test_equip4_serial, testEquip4CalDate: row.test_equip4_cal_date,
    companyName: row.company_name, companyAbn: row.company_abn, companyPhone: row.company_phone,
    companyAddress: row.company_address, signatureData: row.signature_data, notes: row.notes,
    share_token: row.share_token, mainsCircuits: row.mains_circuits || [], subCircuits: row.sub_circuits || [],
  };
}
export async function listRecords() {
  const { data, error } = await supabase.from(TABLE).select('*').order('updated_at', { ascending: false }).limit(200);
  if (error) throw error;
  return data.map(fromDb);
}
export async function getRecord(id) {
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single();
  if (error) throw error;
  return fromDb(data);
}
export async function getRecordByShareToken(token) {
  const { data, error } = await supabase.from(TABLE).select('*').eq('share_token', token).single();
  if (error) throw error;
  return fromDb(data);
}
export async function createRecord(payload) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase.from(TABLE).insert({ ...toDb(payload), user_id: user.id }).select().single();
  if (error) throw error;
  return fromDb(data);
}
export async function updateRecord(id, payload) {
  const { data, error } = await supabase.from(TABLE).update(toDb(payload)).eq('id', id).select().single();
  if (error) throw error;
  return fromDb(data);
}
export async function deleteRecord(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}