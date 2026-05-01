"""
Himalayan AI — Reverse ETL: Push Insights to CRM
==================================================
Simulates a Reverse ETL job that reads cleaned customer-lead data from the
data warehouse and pushes it to a CRM (Salesforce / HubSpot) via mock API
POST requests.

This allows sales teams to use enriched trekking data to offer personalised
trek recommendations.

Run:
    pip install requests pandas
    python reverse_etl/push_to_crm.py
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Any

import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("reverse_etl")


# ---------------------------------------------------------------------------
# 1. Mock warehouse data — cleaned customer leads
# ---------------------------------------------------------------------------

def load_customer_leads() -> pd.DataFrame:
    """Simulate reading a 'cleaned_customer_leads' table from the warehouse."""
    data = [
        {
            "lead_id": "LEAD-001",
            "name": "Aarav Sharma",
            "email": "aarav@example.com",
            "phone": "+977-9801234567",
            "interest": "Everest Base Camp Trek",
            "budget_usd": 2500,
            "preferred_season": "post-monsoon",
            "lead_score": 92,
            "source": "website_chatbot",
            "last_interaction": "2024-10-15T14:30:00",
        },
        {
            "lead_id": "LEAD-002",
            "name": "Emily Chen",
            "email": "emily.chen@example.com",
            "phone": "+1-415-555-0123",
            "interest": "Annapurna Circuit",
            "budget_usd": 3200,
            "preferred_season": "pre-monsoon",
            "lead_score": 87,
            "source": "referral",
            "last_interaction": "2024-10-18T09:15:00",
        },
        {
            "lead_id": "LEAD-003",
            "name": "Kenji Tanaka",
            "email": "kenji.t@example.com",
            "phone": "+81-90-1234-5678",
            "interest": "Manaslu Circuit",
            "budget_usd": 4000,
            "preferred_season": "pre-monsoon",
            "lead_score": 78,
            "source": "instagram_ad",
            "last_interaction": "2024-10-20T18:45:00",
        },
        {
            "lead_id": "LEAD-004",
            "name": "Sarah Müller",
            "email": "s.mueller@example.com",
            "phone": "+49-170-1234567",
            "interest": "Upper Mustang Trek",
            "budget_usd": 5500,
            "preferred_season": "post-monsoon",
            "lead_score": 95,
            "source": "google_search",
            "last_interaction": "2024-10-21T11:00:00",
        },
        {
            "lead_id": "LEAD-005",
            "name": "Raj Patel",
            "email": "raj.patel@example.com",
            "phone": "+91-98765-43210",
            "interest": "Great Himalaya Trail (full traverse)",
            "budget_usd": 12000,
            "preferred_season": "pre-monsoon",
            "lead_score": 99,
            "source": "website_chatbot",
            "last_interaction": "2024-10-22T16:20:00",
        },
    ]
    return pd.DataFrame(data)


# ---------------------------------------------------------------------------
# 2. CRM API client (mock)
# ---------------------------------------------------------------------------

@dataclass
class CRMResponse:
    """Simulated CRM API response."""
    status_code: int
    crm_contact_id: str
    message: str


class MockCRMClient:
    """
    Simulates a CRM API (Salesforce / HubSpot).

    In production, replace with:
        - salesforce_api.push_contact(...)
        - hubspot.crm.contacts.basic_api.create(...)
    """

    CRM_ENDPOINT = "https://api.mock-crm.example.com/v3/contacts"

    def __init__(self, api_key: str = "mock-api-key-12345"):
        self.api_key = api_key
        self._push_count = 0

    def push_contact(self, lead: dict[str, Any]) -> CRMResponse:
        """Simulate a POST request to the CRM contacts API."""
        self._push_count += 1

        # Build the payload matching HubSpot-style contact creation
        payload = {
            "properties": {
                "firstname": lead["name"].split()[0],
                "lastname": " ".join(lead["name"].split()[1:]),
                "email": lead["email"],
                "phone": lead["phone"],
                "trek_interest": lead["interest"],
                "budget": lead["budget_usd"],
                "preferred_season": lead["preferred_season"],
                "lead_score": lead["lead_score"],
                "lead_source": lead["source"],
                "last_interaction": lead["last_interaction"],
            }
        }

        # Log the simulated API call
        logger.info(
            "POST %s — payload: %s",
            self.CRM_ENDPOINT,
            json.dumps(payload, indent=2),
        )

        # Simulate a successful 201 Created response
        crm_id = f"CRM-{lead['lead_id'].split('-')[1]}-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        return CRMResponse(
            status_code=201,
            crm_contact_id=crm_id,
            message=f"Contact created successfully for {lead['email']}",
        )

    @property
    def total_pushed(self) -> int:
        return self._push_count


# ---------------------------------------------------------------------------
# 3. Reverse ETL job
# ---------------------------------------------------------------------------

@dataclass
class SyncResult:
    """Summary of the Reverse ETL sync run."""
    total_leads: int
    synced: int
    failed: int
    details: list[dict[str, Any]]


def run_reverse_etl(
    leads_df: pd.DataFrame,
    crm: MockCRMClient | None = None,
    min_lead_score: int = 0,
) -> SyncResult:
    """
    Reverse ETL job: push cleaned customer leads to the CRM.

    Args:
        leads_df: DataFrame of customer leads from the warehouse.
        crm: CRM client instance (defaults to MockCRMClient).
        min_lead_score: Only sync leads with score >= this threshold.

    Returns:
        SyncResult with counts and per-record details.
    """
    if crm is None:
        crm = MockCRMClient()

    # Filter by lead score threshold
    qualified = leads_df[leads_df["lead_score"] >= min_lead_score]
    logger.info(
        "Reverse ETL starting: %d total leads, %d qualified (score >= %d)",
        len(leads_df),
        len(qualified),
        min_lead_score,
    )

    details: list[dict[str, Any]] = []
    synced = 0
    failed = 0

    for _, row in qualified.iterrows():
        lead = row.to_dict()
        try:
            response = crm.push_contact(lead)
            if response.status_code in (200, 201):
                synced += 1
                details.append({
                    "lead_id": lead["lead_id"],
                    "email": lead["email"],
                    "status": "synced",
                    "crm_contact_id": response.crm_contact_id,
                })
                logger.info("✅ Synced %s → %s", lead["lead_id"], response.crm_contact_id)
            else:
                failed += 1
                details.append({
                    "lead_id": lead["lead_id"],
                    "email": lead["email"],
                    "status": "failed",
                    "error": response.message,
                })
                logger.warning("❌ Failed %s: %s", lead["lead_id"], response.message)
        except Exception as exc:
            failed += 1
            details.append({
                "lead_id": lead["lead_id"],
                "email": lead["email"],
                "status": "error",
                "error": str(exc),
            })
            logger.error("❌ Error syncing %s: %s", lead["lead_id"], exc)

    result = SyncResult(
        total_leads=len(leads_df),
        synced=synced,
        failed=failed,
        details=details,
    )

    logger.info(
        "Reverse ETL complete: %d synced, %d failed out of %d qualified leads",
        result.synced,
        result.failed,
        len(qualified),
    )
    return result


# ---------------------------------------------------------------------------
# 4. CLI entry point
# ---------------------------------------------------------------------------

def main():
    print("=" * 60)
    print("  Himalayan AI — Reverse ETL: Warehouse → CRM")
    print("=" * 60)

    # Step 1: Load data from warehouse
    print("\n[1/3] Loading cleaned customer leads from warehouse...")
    leads_df = load_customer_leads()
    print(f"  Loaded {len(leads_df)} leads:\n")
    print(leads_df[["lead_id", "name", "interest", "lead_score"]].to_string(index=False))

    # Step 2: Run the reverse ETL sync
    print("\n[2/3] Pushing leads to CRM (min score: 80)...\n")
    result = run_reverse_etl(leads_df, min_lead_score=80)

    # Step 3: Summary
    print(f"\n[3/3] Sync Summary")
    print(f"  Total leads in warehouse : {result.total_leads}")
    print(f"  Synced to CRM            : {result.synced}")
    print(f"  Failed                   : {result.failed}")
    print("\n  Details:")
    for d in result.details:
        status = d["status"]
        symbol = "✅" if status == "synced" else "❌"
        crm_id = d.get("crm_contact_id", "N/A")
        print(f"    {symbol} {d['lead_id']} ({d['email']}) → {crm_id}")

    print("\n✅ Reverse ETL complete.")


if __name__ == "__main__":
    main()
