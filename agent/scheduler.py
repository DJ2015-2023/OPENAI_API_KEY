"""Calendario de publicaciones: próximos horarios libres y temas del día."""
from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo


def slots_on(calendar: list[dict], day: date, tz: ZoneInfo) -> list[tuple[datetime, dict]]:
    """Horarios del calendario para un día concreto, en hora local, ordenados."""
    out = []
    for slot in calendar:
        if slot["weekday"] == day.weekday():
            h, m = map(int, slot["time"].split(":"))
            out.append((datetime.combine(day, time(h, m), tzinfo=tz), slot))
    return sorted(out, key=lambda x: x[0])


def next_free_slot(calendar: list[dict], tz: ZoneInfo, now: datetime,
                   taken: set[datetime]) -> datetime:
    """Primer horario del calendario posterior a `now` que no esté ocupado (en UTC)."""
    local_now = now.astimezone(tz)
    for offset in range(0, 60):
        for dt, _ in slots_on(calendar, local_now.date() + timedelta(days=offset), tz):
            utc = dt.astimezone(timezone.utc)
            if dt > local_now and utc not in taken:
                return utc
    return now + timedelta(hours=1)  # calendario vacío o lleno


def next_pillar(calendar: list[dict], tz: ZoneInfo, now: datetime, default: str) -> str:
    """Rubrica del próximo horario (para clasificar una foto sin etiqueta)."""
    local_now = now.astimezone(tz)
    for offset in range(0, 8):
        for dt, slot in slots_on(calendar, local_now.date() + timedelta(days=offset), tz):
            if dt > local_now:
                return slot["pillar"]
    return default
