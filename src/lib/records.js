import { supabase } from './supabase';

const TABLE = 'test_records';

function toDb(data) {
  return {
    status: data.status,
    date: data.date,
    address_location: data.addressLocation,
    switchboard_number: data.switchboardNumber,
    contractor_name: data.contractorName,
    contractor_number: data.contractorNumber,
    worker_name: data.workerName,
    licence_number: data.licenceNumber,
    client_email: data.clientEmail,
    psc_at_main_switch: data.pscAtMainSwitch,
    live_parts_screened: data.livePartsScreened,
    main_link_neutral_reconnected: data.mainLinkNeutralReconnected,
    signature_data: data.signatureData,
    test_equip1_type: data.testEquip1Type,
    test_equip1_serial: data.testEquip1Serial,
    test_equip1_cal_date: data.testEquip1CalDate,
    test_equip2_type: data.testEquip2Type,
    test_equip2_serial: data.testEquip2Serial,
    test_equip2_cal_date: data.testEquip2CalDate,
    test_equip3_type: data.testEquip3Type,
    test_equip3_serial: data.testEquip3Serial,
    test_equip3_cal_date: data.testEquip3CalDate,
    test_equip4_type: data.testEquip4Type,
    test_equip4_serial: data.testEquip4Serial,
    test_equip4_cal_date: data.testEquip4CalDate,
    msb_men_compliant: data.msbMenCompliant,
    msb_max_demand: data.msbMaxDemand,
    msb_main_switch_current_rating: data.msbMainSwitchCurrentRating,
    msb_main_switch_psc_rating: data.msbMainSwitchPscRating,
    msb_conductor_ccc: data.msbConductorCcc,
    msb_conductor_size: data.msbConductorSize,
    msb_earth_cont_main: data.msbEarthContMain,
    msb_earth_cont_eq: data.msbEarthContEq,
    msb_polarity: data.msbPolarity,
    msb_ins_res_ae: data.msbInsResAE,
    msb_ins_res_an: data.msbInsResAN,
    msb_ins_res_ne: data.msbInsResNE,
    msb_ins_res_pp: data.msbInsResPP,
    msb_circuit_length: data.msbCircuitLength,
    msb_comments: data.msbComments,
    psc_at_main_switch: data.pscAtMainSwitch,
    mains_circuits: data.mainsCircuits,
    sub_circuits: data.subCircuits,
    company_name: data.companyName,
    company_abn: data.companyAbn,
    company_phone: data.companyPhone,
    company_address: data.companyAddress,
    company_logo_url: data.companyLogoUrl,
    notes: data.notes,
    share_token: data.share_token,
  };
}

function fromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    created_date: row.created_at,
    updated_date: row.updated_at,
    status: row.status,
    date: row.date,
    addressLocation: row.address_location,
    switchboardNumber: row.switchboard_number,
    contractorName: row.contractor_name,
    contractorNumber: row.contractor_number,
    workerName: row.worker_name,
    licenceNumber: row.licence_number,
    clientEmail: row.client_email,
    pscAtMainSwitch: row.psc_at_main_switch,
    livePartsScreened: row.live_parts_screened,
    mainLinkNeutralReconnected: row.main_link_neutral_reconnected,
    signatureData: row.signature_data,
    testEquip1Type: row.test_equip1_type,
    testEquip1Serial: row.test_equip1_serial,
    testEquip1CalDate: row.test_equip1_cal_date,
    testEquip2Type: row.test_equip2_type,
    testEquip2Serial: row.test_equip2_serial,
    testEquip2CalDate: row.test_equip2_cal_date,
    testEquip3Type: row.test_equip3_type,
    testEquip3Serial: row.test_equip3_serial,
    testEquip3CalDate: row.test_equip3_cal_date,
    testEquip4Type: row.test_equip4_type,
    testEquip4Serial: row.test_equip4_serial,
    testEquip4CalDate: row.test_equip4_cal_date,
    msbMenCompliant: row.msb_men_compliant,
    msbMaxDemand: row.msb_max_demand,
    msbMainSwitchCurrentRating: row.msb_main_switch_current_rating,
    msbMainSwitchPscRating: row.msb_main_switch_psc_rating,
    msbConductorCcc: row.msb_conductor_ccc,
    msbConductorSize: row.msb_conductor_size,
    msbEarthContMain: row.msb_earth_cont_main,
    msbEarthContEq: row.msb_earth_cont_eq,
    msbPolarity: row.msb_polarity,
    msbInsResAE: row.msb_ins_res_ae,
    msbInsResAN: row.msb_ins_res_an,
    msbInsResNE: row.msb_ins_res_ne,
    msbInsResPP: row.msb_ins_res_pp,
    msbCircuitLength: row.msb_circuit_length,
    msbComments: row.msb_comments,
    mainsCircuits: row.mains_circuits || [],
    subCircuits: row.sub_circuits || [],
    companyName: row.company_name,
    companyAbn: row.company_abn,
    companyPhone: row.company_phone,
    companyAddress: row.company_address,
    companyLogoUrl: row.company_logo_url,
    notes: row.notes,
    share_token: row.share_token,
  };
}

export async function listRecords() {
  // RLS on the table ensures users only see their own records
  const { data, error } = await supabase.from(TABLE).select('*').order('updated_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(fromDb);
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
