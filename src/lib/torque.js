import { supabase } from './supabase';

const TABLE = 'torque_certificates';

function fromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    created_date: row.created_at,
    updated_date: row.updated_at,
    status: row.status,
    certificateNumber: row.certificate_number,
    projectName: row.project_name,
    client: row.client,
    siteName: row.site_name,
    siteAddress: row.site_address,
    switchboardId: row.switchboard_id,
    location: row.location,
    workOrderNumber: row.work_order_number,
    drawingReference: row.drawing_reference,
    verificationDate: row.verification_date,
    technicianName: row.technician_name,
    licenceNumber: row.licence_number,
    companyName: row.company_name,
    companyAbn: row.company_abn,
    companyPhone: row.company_phone,
    companyAddress: row.company_address,
    companyLogoUrl: row.company_logo_url,
    notes: row.notes,
    toolType: row.tool_type,
    torqueWrenchManufacturer: row.torque_wrench_manufacturer,
    torqueWrenchModel: row.torque_wrench_model,
    toolSerialNumber: row.tool_serial_number,
    calibrationCertNumber: row.calibration_cert_number,
    calibrationDocUrl: row.calibration_doc_url,
    torqueUnits: row.torque_units || 'Nm',
    technicianSignature: row.technician_signature,
    supervisorName: row.supervisor_name,
    supervisorDate: row.supervisor_date,
    terminationRows: row.termination_rows || [],
  };
}

function toDb(data) {
  return {
    status: data.status,
    certificate_number: data.certificateNumber,
    project_name: data.projectName,
    client: data.client,
    site_name: data.siteName,
    site_address: data.siteAddress,
    switchboard_id: data.switchboardId,
    location: data.location,
    work_order_number: data.workOrderNumber,
    drawing_reference: data.drawingReference,
    verification_date: data.verificationDate,
    technician_name: data.technicianName,
    licence_number: data.licenceNumber,
    company_name: data.companyName,
    company_abn: data.companyAbn,
    company_phone: data.companyPhone,
    company_address: data.companyAddress,
    company_logo_url: data.companyLogoUrl,
    notes: data.notes,
    tool_type: data.toolType,
    torque_wrench_manufacturer: data.torqueWrenchManufacturer,
    torque_wrench_model: data.torqueWrenchModel,
    tool_serial_number: data.toolSerialNumber,
    calibration_cert_number: data.calibrationCertNumber,
    calibration_doc_url: data.calibrationDocUrl,
    torque_units: data.torqueUnits || 'Nm',
    technician_signature: data.technicianSignature,
    supervisor_name: data.supervisorName,
    supervisor_date: data.supervisorDate,
    termination_rows: data.terminationRows || [],
  };
}

export async function listTorqueRecords() {
  const { data, error } = await supabase.from(TABLE).select('*').order('updated_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(fromDb);
}

export async function getTorqueRecord(id) {
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single();
  if (error) throw error;
  return fromDb(data);
}

export async function createTorqueRecord(payload) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase.from(TABLE).insert({ ...toDb(payload), user_id: user.id }).select().single();
  if (error) throw error;
  return fromDb(data);
}

export async function updateTorqueRecord(id, payload) {
  const { data, error } = await supabase.from(TABLE).update(toDb(payload)).eq('id', id).select().single();
  if (error) throw error;
  return fromDb(data);
}

export async function deleteTorqueRecord(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}
