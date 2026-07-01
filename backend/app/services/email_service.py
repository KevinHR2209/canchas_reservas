import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

GMAIL_USER = os.getenv("GMAIL_USER", "")
GMAIL_PASS = os.getenv("GMAIL_PASS", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

TIPO_DISPLAY = {
    "futbol6": "⚽ Fútbol 6",
    "padel": "🎸 Pádel",
}


def _html_confirmacion(datos: dict) -> str:
    cancel_url = f"{FRONTEND_URL}/cancelar/{datos['cancel_token']}"
    tipo_label = TIPO_DISPLAY.get(datos["cancha_tipo"], datos["cancha_tipo"])

    return f"""
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#f0fdf4;font-family:Inter,Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;padding:40px 0;">
        <tr><td align="center">
          <table width="560" cellpadding="0" cellspacing="0"
                 style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(5,150,105,0.1);">
            <tr>
              <td style="background:linear-gradient(135deg,#059669,#065f46);padding:32px 40px;text-align:center;">
                <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:900;">⚽ Canchas Reservas</h1>
                <p style="color:#a7f3d0;margin:6px 0 0;font-size:14px;">Confirmación de reserva</p>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 40px;">
                <h2 style="color:#065f46;font-size:20px;margin:0 0 8px;">¡Hola, {datos['cliente_nombre']}! 👋</h2>
                <p style="color:#6b7280;margin:0 0 28px;font-size:15px;">
                  Tu reserva ha sido confirmada. Aquí están los detalles:
                </p>
                <table width="100%" cellpadding="0" cellspacing="0"
                       style="background:#ecfdf5;border-radius:12px;">
                  <tr><td style="padding:14px 20px;border-bottom:1px solid #d1fae5;">
                    <span style="color:#6b7280;font-size:13px;display:block;margin-bottom:2px;">Cancha</span>
                    <strong style="color:#111827;font-size:15px;">{datos['cancha_nombre']}</strong>
                  </td></tr>
                  <tr><td style="padding:14px 20px;border-bottom:1px solid #d1fae5;">
                    <span style="color:#6b7280;font-size:13px;display:block;margin-bottom:2px;">Tipo</span>
                    <strong style="color:#111827;font-size:15px;">{tipo_label}</strong>
                  </td></tr>
                  <tr><td style="padding:14px 20px;border-bottom:1px solid #d1fae5;">
                    <span style="color:#6b7280;font-size:13px;display:block;margin-bottom:2px;">Fecha</span>
                    <strong style="color:#111827;font-size:15px;">{datos['fecha']}</strong>
                  </td></tr>
                  <tr><td style="padding:14px 20px;border-bottom:1px solid #d1fae5;">
                    <span style="color:#6b7280;font-size:13px;display:block;margin-bottom:2px;">Hora inicio</span>
                    <strong style="color:#111827;font-size:15px;">{datos['hora_inicio']}</strong>
                  </td></tr>
                  <tr><td style="padding:14px 20px;">
                    <span style="color:#6b7280;font-size:13px;display:block;margin-bottom:2px;">Hora fin</span>
                    <strong style="color:#111827;font-size:15px;">{datos['hora_fin']}</strong>
                  </td></tr>
                </table>
                <p style="color:#6b7280;font-size:14px;margin:28px 0 16px;">
                  ¿No puedes asistir? Cancela tu reserva aquí:
                </p>
                <div style="text-align:center;margin:0 0 28px;">
                  <a href="{cancel_url}"
                     style="display:inline-block;background:#dc2626;color:#ffffff;font-weight:700;
                            font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;">
                    ❌ Cancelar mi reserva
                  </a>
                </div>
                <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">
                  Si no hiciste esta reserva, ignora este correo.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#f9fafb;padding:20px 40px;text-align:center;
                         border-top:1px solid #e5e7eb;">
                <p style="color:#9ca3af;font-size:12px;margin:0;">© 2026 Canchas Reservas</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
    """


def enviar_confirmacion(destinatario: str, datos: dict):
    if not GMAIL_USER or not GMAIL_PASS:
        print(f"[EMAIL] Sin GMAIL_USER/GMAIL_PASS. Correo para {destinatario} NO enviado.")
        return

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "⚽ Confirmación de reserva — Canchas Reservas"
        msg["From"] = f"Canchas Reservas <{GMAIL_USER}>"
        msg["To"] = destinatario

        msg.attach(MIMEText(_html_confirmacion(datos), "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(GMAIL_USER, GMAIL_PASS)
            server.sendmail(GMAIL_USER, destinatario, msg.as_string())

        print(f"[EMAIL] Confirmación enviada a {destinatario}")

    except Exception as e:
        print(f"[EMAIL] Error al enviar: {e}")
