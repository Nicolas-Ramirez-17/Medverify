from datetime import date, datetime

from .models import RegistroEps

TIPO_LABEL = {
    'enfermedad_general': 'Enfermedad general',
    'licencia_maternidad': 'Licencia de maternidad',
    'licencia_paternidad': 'Licencia de paternidad',
}


def dias_entre(inicio: date, fin: date) -> int:
    return (fin - inicio).days + 1


def validar_contra_eps(
    documento: str,
    tipo: str,
    fecha_inicio: date,
    fecha_fin: date,
    eps: str,
    registro: RegistroEps | None,
    ahora: datetime,
) -> dict:
    """Regla oficial de validación documental contra la EPS simulada (docs/HANDOFF.md §4)."""
    if registro is None:
        return {
            'resultado': 'no_encontrada',
            'porcentaje': 0,
            'campos': [],
            'registro_eps_numero': None,
            'registro_eps_ips': None,
            'validado_en': ahora,
        }

    filas = [
        ('documento', 'Documento del empleado', documento, registro.documento),
        ('tipo', 'Tipo de incapacidad', TIPO_LABEL[tipo], TIPO_LABEL[registro.tipo]),
        ('fecha_inicio', 'Fecha de inicio', fecha_inicio.isoformat(), registro.fecha_inicio.isoformat()),
        ('fecha_fin', 'Fecha de finalización', fecha_fin.isoformat(), registro.fecha_fin.isoformat()),
        ('dias', 'Días de incapacidad', str(dias_entre(fecha_inicio, fecha_fin)), str(registro.dias)),
        ('eps', 'EPS', eps, registro.eps),
    ]
    norm = lambda v: v.strip().lower()
    campos = [
        {
            'campo': c,
            'etiqueta': e,
            'valor_radicado': r,
            'valor_eps': v,
            'coincide': norm(r) == norm(v),
        }
        for c, e, r, v in filas
    ]
    ok = sum(1 for item in campos if item['coincide'])
    return {
        'resultado': 'coincide' if ok == len(campos) else 'inconsistente',
        'porcentaje': round(ok / len(campos) * 100),
        'campos': campos,
        'registro_eps_numero': registro.numero,
        'registro_eps_ips': registro.ips,
        'validado_en': ahora,
    }
