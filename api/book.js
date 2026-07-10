const CLINIC_WHATSAPP = process.env.CLINIC_WHATSAPP_TO || "528182085411";
const CLINIC_EMAIL = process.env.CLINIC_EMAIL || "hola@tudd.mx";

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (digits.length === 10) return `52${digits}`;
  if (digits.length === 12 && digits.startsWith("52")) return digits;
  if (digits.length > 10) return digits;

  return "";
}

function buildMessage(booking) {
  return [
    "Hola, tu solicitud de cita en tüdd fue recibida.",
    "",
    `Doctora: ${booking.doctor}`,
    `Especialidad: ${booking.role}`,
    `Dia: ${booking.date}`,
    `Hora: ${booking.time}`,
    "",
    "Te contactaremos para confirmar disponibilidad final."
  ].join("\n");
}

async function sendWhatsApp(to, message) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId || !to) {
    return { channel: "whatsapp", skipped: true };
  }

  const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: {
        preview_url: false,
        body: message
      }
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error?.message || "No se pudo enviar WhatsApp");
  }

  return { channel: "whatsapp", skipped: false, data };
}

async function sendEmail(booking) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;

  if (!apiKey || !from || !booking.email) {
    return { channel: "email", skipped: true };
  }

  const subject = "Solicitud de cita recibida en tüdd";
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;color:#2e2318;line-height:1.55">
      <h1 style="font-family:Georgia,serif;font-weight:400">Solicitud de cita recibida</h1>
      <p>Hola ${booking.name}, recibimos tu solicitud en tüdd.</p>
      <p><strong>Doctora:</strong> ${booking.doctor}<br>
      <strong>Especialidad:</strong> ${booking.role}<br>
      <strong>Dia:</strong> ${booking.date}<br>
      <strong>Hora:</strong> ${booking.time}</p>
      <p>Te contactaremos para confirmar disponibilidad final.</p>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [booking.email],
      bcc: [CLINIC_EMAIL],
      subject,
      html
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || "No se pudo enviar correo");
  }

  return { channel: "email", skipped: false, data };
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    return sendJson(response, 405, { ok: false, error: "Metodo no permitido" });
  }

  try {
    const booking = typeof request.body === "string" ? JSON.parse(request.body) : request.body || {};
    const required = ["doctor", "role", "date", "time", "name", "email", "phone"];
    const missing = required.filter((field) => !String(booking[field] || "").trim());

    if (missing.length) {
      return sendJson(response, 400, { ok: false, error: "Faltan datos de la cita", missing });
    }

    const patientPhone = normalizePhone(booking.phone);

    if (!patientPhone) {
      return sendJson(response, 400, { ok: false, error: "Telefono no valido" });
    }

    const patientMessage = buildMessage(booking);
    const clinicMessage = [
      "Nueva solicitud de cita en tüdd",
      "",
      `Paciente: ${booking.name}`,
      `Telefono: +${patientPhone}`,
      `Correo: ${booking.email}`,
      `Doctora: ${booking.doctor}`,
      `Especialidad: ${booking.role}`,
      `Dia: ${booking.date}`,
      `Hora: ${booking.time}`
    ].join("\n");

    const jobs = [
      ["whatsapp_paciente", sendWhatsApp(patientPhone, patientMessage)],
      ["whatsapp_consultorio", sendWhatsApp(CLINIC_WHATSAPP, clinicMessage)],
      ["correo_paciente", sendEmail({ ...booking, phone: patientPhone })]
    ];

    const settled = await Promise.allSettled(jobs.map((job) => job[1]));
    const results = settled.map((result, index) => ({
      name: jobs[index][0],
      status: result.status,
      value: result.status === "fulfilled" ? result.value : null,
      error: result.status === "rejected" ? result.reason.message : null
    }));

    const sent = results.filter((result) => result.status === "fulfilled" && !result.value?.skipped);
    const skipped = results
      .filter((result) => result.status === "fulfilled" && result.value?.skipped)
      .map((result) => result.name);
    const errors = results
      .filter((result) => result.status === "rejected")
      .map((result) => `${result.name}: ${result.error}`);

    if (!sent.length) {
      return sendJson(response, 502, {
        ok: false,
        error: errors.length
          ? errors.join(" | ")
          : "No hay canales de confirmacion configurados en Vercel",
        skipped
      });
    }

    return sendJson(response, 200, {
      ok: true,
      sent: sent.map((result) => result.name),
      skipped,
      warnings: errors
    });
  } catch (error) {
    return sendJson(response, 500, { ok: false, error: error.message || "Error inesperado" });
  }
};
