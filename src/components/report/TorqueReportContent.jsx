/**
 * TorqueReportContent
 * Each .report-page div is exactly one A4 page captured by html2canvas.
 * Table rows are chunked so they never overflow a page.
 */

const PHASE_OPTIONS = [
  { value: "L1",  label: "L1",  color: "#dc2626", bg: "#fef2f2", border: "#fca5a5" },
  { value: "L2",  label: "L2",  color: "#f59e0b", bg: "#fffbeb", border: "#fcd34d" },
  { value: "L3",  label: "L3",  color: "#2563eb", bg: "#eff6ff", border: "#93c5fd" },
  { value: "N",   label: "N",   color: "#6b7280", bg: "#f9fafb", border: "#d1d5db" },
  { value: "E",   label: "E",   color: "#16a34a", bg: "#f0fdf4", border: "#86efac" },
  { value: "PEN", label: "PEN", color: "#15803d", bg: "#f0fdf4", border: "#4ade80" },
];

const ROWS_ON_PAGE1 = 20;
const ROWS_PER_CONTINUATION = 25;

const PAGE_STYLE = {
  width: "210mm", boxSizing: "border-box",
  fontFamily: "system-ui, -apple-system, sans-serif",
  background: "#fff", padding: "12mm 15mm",
  display: "flex", flexDirection: "column",
};

const LABEL_STYLE = {
  fontSize: "8px", fontWeight: 700, color: "#64748b",
  textTransform: "uppercase", letterSpacing: "0.06em",
  marginBottom: "3px", display: "block",
};

const BOX_STYLE = {
  height: "26px", border: "1px solid #e2e8f0", borderRadius: "5px",
  background: "#f8fafc", padding: "0 8px",
  display: "flex", alignItems: "center", justifyContent: "flex-start",
  fontSize: "11px", lineHeight: 1,
};

function PageHeader({ r }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "3px solid #0f2044", paddingBottom: "8px", marginBottom: "12px", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: "#0f2044", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#F59E0B", fontSize: "12px", fontWeight: 900 }}>⚡</span>
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: "13px", color: "#0f2044", lineHeight: 1.1 }}>{r.projectName || r.certificateNumber || "Torque Certificate"}</div>
          <div style={{ fontSize: "8px", color: "#64748b" }}>Termination Torque Verification Certificate</div>
        </div>
      </div>
      {r.companyName && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", textAlign: "right" }}>
          {r.companyLogoUrl && <img src={r.companyLogoUrl} alt="Logo" style={{ height: "28px", maxWidth: "100px", objectFit: "contain" }} />}
          <div>
            <div style={{ fontWeight: 700, fontSize: "10px", color: "#0f2044" }}>{r.companyName}</div>
            {r.companyAbn && <div style={{ fontSize: "8px", color: "#64748b" }}>ABN: {r.companyAbn}</div>}
            {r.companyPhone && <div style={{ fontSize: "8px", color: "#64748b" }}>{r.companyPhone}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

function PageFooter({ certNumber, pageNum, totalPages }) {
  return (
    <div style={{ borderTop: "2px solid #0f2044", paddingTop: "6px", marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "8px", color: "#94a3b8", flexShrink: 0 }}>
      <span>TestSheet — testsheet.com.au</span>
      {certNumber && <span style={{ fontFamily: "monospace", color: "#64748b" }}>{certNumber}</span>}
      <span>Generated {new Date().toLocaleDateString("en-AU")} · Page {pageNum} of {totalPages}</span>
    </div>
  );
}

function SectionHeader({ title, color = "#0f2044" }) {
  return <div style={{ background: color, color: "#fff", padding: "6px 12px", fontWeight: 700, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</div>;
}

function FieldBox({ label, value, wide, cols = 1 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gridColumn: wide ? `span ${cols}` : undefined }}>
      <span style={LABEL_STYLE}>{label}</span>
      <div style={{ ...BOX_STYLE, color: value ? "#0f172a" : "#94a3b8" }}>{value || "—"}</div>
    </div>
  );
}

function TextAreaBox({ label, value, cols = 4 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gridColumn: `span ${cols}` }}>
      <span style={LABEL_STYLE}>{label}</span>
      <div style={{ minHeight: "34px", border: "1px solid #e2e8f0", borderRadius: "5px", background: "#f8fafc", padding: "5px 8px", fontSize: "11px", color: value ? "#0f172a" : "#94a3b8", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{value || "—"}</div>
    </div>
  );
}

function Card({ children, style }) {
  return <div style={{ background: "#fff", borderRadius: "7px", border: "1px solid #e2e8f0", overflow: "hidden", marginBottom: "8px", ...style }}>{children}</div>;
}

function TableChunk({ rows, units, showLegend, startIndex }) {
  const cellBase = { border: "1px solid #e2e8f0", padding: "3px 5px", verticalAlign: "middle" };
  return (
    <div style={{ flex: 1 }}>
      {showLegend && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "3px 10px", background: "#fff", borderBottom: "1px solid #f1f5f9", flexWrap: "wrap" }}>
          <span style={{ fontSize: "8px", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>Phase:</span>
          {PHASE_OPTIONS.map(p => (
            <span key={p.value} style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "8px", fontWeight: 700, color: p.color }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: p.color, display: "inline-block" }} />{p.label}
            </span>
          ))}
        </div>
      )}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9.5px" }}>
        <thead>
          <tr style={{ background: "#0f2044", color: "#fff" }}>
            {["#", "Switchboard", "Protection Device", "Phase", `Req.(${units})`, `Actual(${units})`, "Result", "Comments"].map((h, i) => (
              <th key={i} style={{ border: "1px solid #1e4080", padding: "4px 5px", textAlign: i === 0 ? "center" : i <= 2 ? "left" : "center", fontSize: "7.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", verticalAlign: "middle", width: i === 0 ? "22px" : i === 6 ? "54px" : undefined }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const i = startIndex + idx;
            const phaseOpt = PHASE_OPTIONS.find(p => p.value === row.phase);
            const rowBg = row.result === "Pass" ? "rgba(220,252,231,0.35)" : row.result === "Fail" ? "rgba(254,242,242,0.5)" : idx % 2 === 0 ? "#fff" : "rgba(248,250,252,0.6)";
            const actualNum = parseFloat(row.actualTorque);
            const reqNum    = parseFloat(row.requiredTorque);
            const actualColor = row.actualTorque && row.requiredTorque ? actualNum >= reqNum ? "#15803d" : "#dc2626" : "#0f172a";
            return (
              <tr key={i} style={{ background: rowBg }}>
                <td style={{ ...cellBase, textAlign: "center" }}>
                  <span style={{ width: "15px", height: "15px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "7px", fontWeight: 700, background: phaseOpt ? phaseOpt.bg : "#f1f5f9", color: phaseOpt ? phaseOpt.color : "#94a3b8", border: phaseOpt ? `1px solid ${phaseOpt.border}` : "1px solid #e2e8f0" }}>{i + 1}</span>
                </td>
                <td style={{ ...cellBase, color: "#334155" }}>{row.switchboard || ""}</td>
                <td style={{ ...cellBase, color: "#334155", fontWeight: 500 }}>{row.deviceDescription || ""}</td>
                <td style={{ ...cellBase, textAlign: "center", padding: "2px 3px" }}>
                  {phaseOpt ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "2px 0", borderRadius: "3px", background: phaseOpt.color, color: "#fff", fontWeight: 900, fontSize: "9px" }}>{phaseOpt.label}</span> : <span style={{ color: "#cbd5e1" }}>—</span>}
                </td>
                <td style={{ ...cellBase, textAlign: "center", fontFamily: "monospace", color: "#334155" }}>{row.requiredTorque || <span style={{ color: "#cbd5e1" }}>—</span>}</td>
                <td style={{ ...cellBase, textAlign: "center", fontFamily: "monospace", fontWeight: 600, color: actualColor }}>{row.actualTorque || <span style={{ color: "#cbd5e1", fontWeight: 400 }}>—</span>}</td>
                <td style={{ ...cellBase, textAlign: "center" }}>
                  {row.result ? <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "1px 5px", borderRadius: "3px", fontSize: "8px", fontWeight: 700, background: row.result === "Pass" ? "#dcfce7" : row.result === "Fail" ? "#fef2f2" : "#f1f5f9", color: row.result === "Pass" ? "#15803d" : row.result === "Fail" ? "#dc2626" : "#64748b", border: `1px solid ${row.result === "Pass" ? "#86efac" : row.result === "Fail" ? "#fca5a5" : "#cbd5e1"}` }}>{row.result}</span> : <span style={{ color: "#cbd5e1" }}>—</span>}
                </td>
                <td style={{ ...cellBase, color: "#64748b", fontSize: "8.5px" }}>{row.comments || ""}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function TorqueReportContent({ record }) {
  const r = record || {};
  const rows = r.terminationRows || [];
  const filledRows = rows.filter(x => x.deviceDescription || x.switchboard || x.phase);
  const passed = filledRows.filter(x => x.result === "Pass").length;
  const failed = filledRows.filter(x => x.result === "Fail").length;
  const units = r.torqueUnits || "Nm";
  const certNum = r.certificateNumber;

  const statusBg    = r.status === "Complete" ? "#dcfce7" : r.status === "Requires Rectification" ? "#fef2f2" : "#fef3c7";
  const statusColor = r.status === "Complete" ? "#15803d" : r.status === "Requires Rectification" ? "#dc2626" : "#b45309";
  const statusIcon  = r.status === "Complete" ? "✓" : r.status === "Requires Rectification" ? "✗" : "●";

  const page1Rows = rows.slice(0, ROWS_ON_PAGE1);
  const remainingRows = rows.slice(ROWS_ON_PAGE1);
  const continuationChunks = [];
  for (let i = 0; i < remainingRows.length; i += ROWS_PER_CONTINUATION) {
    continuationChunks.push(remainingRows.slice(i, i + ROWS_PER_CONTINUATION));
  }
  const totalPages = 1 + continuationChunks.length + 1;

  return (
    <div>
      <div className="report-page" style={PAGE_STYLE}>
        <PageHeader r={r} />
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", flexShrink: 0 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 10px", borderRadius: "999px", fontSize: "10px", fontWeight: 700, background: statusBg, color: statusColor }}>{statusIcon} {r.status || "Draft"}</span>
          {certNum && <span style={{ fontSize: "9px", color: "#94a3b8", fontFamily: "monospace" }}>{certNum}</span>}
        </div>
        <Card>
          <SectionHeader title="Certificate & Project Information" />
          <div style={{ padding: "10px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
            <FieldBox label="Certificate Number" value={r.certificateNumber} />
            <FieldBox label="Project Name" value={r.projectName} wide cols={2} />
            <FieldBox label="Client" value={r.client} />
            <FieldBox label="Site Address" value={r.siteAddress} wide cols={2} />
            <FieldBox label="Date of Verification" value={r.verificationDate} />
            <FieldBox label="Technician Name" value={r.technicianName} wide cols={2} />
            <FieldBox label="Licence Number" value={r.licenceNumber} />
            <FieldBox label="Job Number" value={r.workOrderNumber} />
            {r.notes && <TextAreaBox label="Notes / Scope" value={r.notes} cols={4} />}
          </div>
        </Card>
        <Card>
          <SectionHeader title="Torque Tool & Calibration" color="#475569" />
          <div style={{ padding: "10px", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" }}>
            <FieldBox label="Tool Type" value={r.toolType} />
            <FieldBox label="Manufacturer" value={r.torqueWrenchManufacturer} />
            <FieldBox label="Model" value={r.torqueWrenchModel} />
            <FieldBox label="Serial Number" value={r.toolSerialNumber} />
            <FieldBox label="Cal. Certificate No." value={r.calibrationCertNumber} />
            {r.calibrationDocUrl && (
              <div style={{ gridColumn: "span 5" }}>
                <span style={LABEL_STYLE}>Calibration Certificate</span>
                <img src={r.calibrationDocUrl} alt="Calibration certificate" style={{ height: "64px", maxWidth: "180px", objectFit: "contain", border: "1px solid #e2e8f0", borderRadius: "5px", background: "#fff", padding: "3px" }} />
              </div>
            )}
          </div>
        </Card>
        <Card style={{ flex: 1, display: "flex", flexDirection: "column", marginBottom: "0" }}>
          <SectionHeader title="Termination Verification Records" color="#1e4080" />
          {filledRows.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "4px 10px", background: "#f8fafc", borderBottom: "1px solid #f1f5f9", fontSize: "9.5px", fontWeight: 600 }}>
              <span style={{ color: "#64748b" }}>Total: <strong style={{ color: "#0f172a" }}>{filledRows.length}</strong></span>
              {passed > 0 && <span style={{ color: "#15803d" }}>✓ Pass: {passed}</span>}
              {failed > 0 && <span style={{ color: "#dc2626" }}>⚠ Fail: {failed}</span>}
            </div>
          )}
          <TableChunk rows={page1Rows} units={units} showLegend={true} startIndex={0} />
          <div style={{ padding: "5px 10px", background: "#f8fafc", borderTop: "1px solid #f1f5f9", fontSize: "8.5px", color: "#94a3b8" }}>Torque units: <strong style={{ color: "#334155" }}>{units}</strong></div>
        </Card>
        <PageFooter certNumber={certNum} pageNum={1} totalPages={totalPages} />
      </div>

      {continuationChunks.map((chunk, chunkIdx) => (
        <div key={chunkIdx} className="report-page" style={PAGE_STYLE}>
          <PageHeader r={r} />
          <Card style={{ flex: 1, display: "flex", flexDirection: "column", marginBottom: "0" }}>
            <SectionHeader title="Termination Verification Records (continued)" color="#1e4080" />
            <TableChunk rows={chunk} units={units} showLegend={false} startIndex={ROWS_ON_PAGE1 + chunkIdx * ROWS_PER_CONTINUATION} />
            <div style={{ padding: "5px 10px", background: "#f8fafc", borderTop: "1px solid #f1f5f9", fontSize: "8.5px", color: "#94a3b8" }}>Torque units: <strong style={{ color: "#334155" }}>{units}</strong></div>
          </Card>
          <PageFooter certNumber={certNum} pageNum={2 + chunkIdx} totalPages={totalPages} />
        </div>
      ))}

      <div className="report-page" style={PAGE_STYLE}>
        <PageHeader r={r} />
        <Card>
          <SectionHeader title="Declaration & Sign-Off" color="#475569" />
          <div style={{ padding: "14px" }}>
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "7px", padding: "9px 12px", marginBottom: "14px", fontSize: "11px", color: "#475569", lineHeight: 1.6 }}>
              I certify that the electrical terminations recorded in this certificate were checked and/or tightened using the identified torque tool and verified against manufacturer torque requirements or approved project documentation.
            </div>
            <div style={{ marginBottom: "12px" }}>
              <span style={LABEL_STYLE}>Technician Signature</span>
              <div style={{ border: "2px dashed #cbd5e1", borderRadius: "10px", background: "#f8fafc", height: "80px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {r.technicianSignature && <img src={r.technicianSignature} alt="Signature" style={{ maxHeight: "72px", maxWidth: "100%", objectFit: "contain" }} />}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
              <FieldBox label="Technician Name" value={r.supervisorName} />
              <FieldBox label="Date" value={r.supervisorDate} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "9px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>Final Status:</span>
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "4px 14px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, background: statusBg, color: statusColor }}>{statusIcon} {r.status || "Draft"}</span>
            </div>
          </div>
        </Card>
        <PageFooter certNumber={certNum} pageNum={1 + continuationChunks.length + 1} totalPages={totalPages} />
      </div>
    </div>
  );
}