from datetime import datetime, date, time
from data_contracts.models import FreshnessSLA
from data_contracts.validator import _freshness_check


def _today_at(hour: int, minute: int = 0) -> datetime:
    return datetime.combine(date.today(), time(hour, minute))


def test_refreshed_before_deadline_is_fresh():
    sla = FreshnessSLA(schedule="daily", by_time="06:00")
    last_refreshed = _today_at(5)  # 05:00 today
    assert _freshness_check(last_refreshed, sla) is False


def test_refreshed_after_deadline_is_violation():
    sla = FreshnessSLA(schedule="daily", by_time="06:00")
    last_refreshed = _today_at(7)  # 07:00 today
    assert _freshness_check(last_refreshed, sla) is True


def test_refreshed_exactly_at_deadline_is_fresh():
    sla = FreshnessSLA(schedule="daily", by_time="06:00")
    last_refreshed = _today_at(6)  # exactly 06:00
    assert _freshness_check(last_refreshed, sla) is False  # at deadline = fresh


def test_different_by_time_parsed_correctly():
    sla = FreshnessSLA(schedule="daily", by_time="08:30")
    assert _freshness_check(_today_at(8, 29), sla) is False  # before 08:30
    assert _freshness_check(_today_at(8, 31), sla) is True   # after 08:30
