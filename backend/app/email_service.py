from email.message import EmailMessage
import smtplib
from sqlalchemy.orm import Session

from .config import settings
from .models import Correo, Historial, Solicitud, ahora_utc
from .validation import TIPO_LABEL


def enviar_smtp(para: str, asunto: str, texto: str, html: str | None = None) -> None:
    msg = EmailMessage()
    msg['From'] = settings.smtp_from
    msg['To'] = para
    msg['Subject'] = asunto
    msg.set_content(texto)
    if html:
        msg.add_alternative(html, subtype='html')

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=5) as smtp:
        smtp.send_message(msg)


def notificar_correo_radicacion(
    db: Session,
    *,
    solicitud: Solicitud,
    empleado_nombre: str,
    para: str,
    resultado_validacion: str,
    porcentaje: int,
) -> None:
    asunto = f'Nueva incapacidad radicada · {solicitud.radicado}'
    enlace = f'{settings.frontend_url.rstrip("/")}/solicitudes/{solicitud.id}'
    tipo_txt = TIPO_LABEL.get(solicitud.tipo, solicitud.tipo)
    validacion_txt = {
        'coincide': f'Coincide con la EPS ({porcentaje} %)',
        'inconsistente': f'Con inconsistencias ({porcentaje} %)',
        'no_encontrada': 'No encontrada en la EPS',
    }.get(resultado_validacion, resultado_validacion)

    texto = (
        f'Hola, equipo de Talento Humano.\n\n'
        f'Se radicó una nueva incapacidad para revisión:\n'
        f'- Radicado: {solicitud.radicado}\n'
        f'- Empleado: {empleado_nombre}\n'
        f'- Tipo: {tipo_txt}\n'
        f'- Periodo: {solicitud.fecha_inicio.isoformat()} a {solicitud.fecha_fin.isoformat()} ({solicitud.dias} días)\n'
        f'- Validación EPS: {validacion_txt}\n\n'
        f'Revisa el detalle y el soporte PDF aquí: {enlace}\n\n'
        f'Este es un mensaje automático. No responda a este correo.'
    )
    html = (
        f'<p>Hola, equipo de Talento Humano.</p>'
        f'<p>Se radicó una nueva incapacidad para revisión:</p>'
        f'<ul>'
        f'<li><b>Radicado:</b> {solicitud.radicado}</li>'
        f'<li><b>Empleado:</b> {empleado_nombre}</li>'
        f'<li><b>Tipo:</b> {tipo_txt}</li>'
        f'<li><b>Periodo:</b> {solicitud.fecha_inicio.isoformat()} a {solicitud.fecha_fin.isoformat()} ({solicitud.dias} días)</li>'
        f'<li><b>Validación EPS:</b> {validacion_txt}</li>'
        f'</ul>'
        f'<p><a href="{enlace}">Abrir solicitud en Medverify</a></p>'
        f'<p><small>Este es un mensaje automático. No responda a este correo.</small></p>'
    )

    estado = 'enviado'
    error: str | None = None
    try:
        enviar_smtp(para, asunto, texto, html)
    except Exception as exc:  # noqa: BLE001
        estado = 'fallido'
        error = str(exc)

    db.add(
        Correo(
            solicitud_id=solicitud.id,
            para=para,
            asunto=asunto,
            enviado_en=ahora_utc(),
            estado=estado,
            error=error,
        )
    )
    if estado == 'enviado':
        db.add(
            Historial(
                solicitud_id=solicitud.id,
                fecha=ahora_utc(),
                actor='Sistema',
                accion='Notificación por correo enviada',
                detalle=f'A {para}',
            )
        )
    db.commit()


def enviar_correo_bienvenida_usuario(para: str, nombre: str, temporal: str) -> None:
    asunto = 'Tu cuenta en Medverify ha sido creada'
    enlace = f'{settings.frontend_url.rstrip("/")}/login'
    texto = (
        f'Hola {nombre},\n\n'
        f'Se creó tu cuenta en Medverify.\n'
        f'Ingresa en {enlace} con tu correo y la contraseña temporal: {temporal}\n'
        f'Te recomendamos cambiar tu contraseña al iniciar sesión.\n\n'
        f'Este es un mensaje automático. No responda a este correo.'
    )
    try:
        enviar_smtp(para, asunto, texto)
    except Exception:  # noqa: BLE001
        pass
