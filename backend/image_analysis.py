"""
Image analysis — stub only.

Zone-of-inhibition measurement is now performed entirely on the
frontend via the manual overlay tool (6 mm reference disc + pinch
ring).  This module is kept so existing imports do not break, but
the /api/analyze endpoint has been removed from server.py.
"""


def analyze_plate(image_b64: str) -> dict:  # pragma: no cover
    """Not used in manual-measurement mode."""
    raise NotImplementedError(
        "Auto-detection has been removed. "
        "Zone measurement is now performed manually on the device."
    )
