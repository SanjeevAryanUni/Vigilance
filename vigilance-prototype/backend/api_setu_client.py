"""
API Setu Integration — Vehicle RC Verification
Uses MoRTH Parivahan APIs via apisetu.gov.in for ANPR vehicle lookup.
NOTE: Requires API Setu developer account and subscription approval.
"""
import os
import httpx
from typing import Optional, Dict, Any

API_SETU_BASE = os.getenv("API_SETU_BASE", "https://apisetu.gov.in/api/v1")
API_SETU_CLIENT_ID = os.getenv("API_SETU_CLIENT_ID", "")
API_SETU_CLIENT_SECRET = os.getenv("API_SETU_CLIENT_SECRET", "")

# Sample state transport registry lookup for realistic demo validation
SAMPLE_RC_DATABASE = {
    "TN07BL1234": {
        "owner_name": "K. Ramanathan",
        "vehicle_class": "LMV (Motor Car)",
        "maker_model": "Tata Nexon EV",
        "registration_date": "2023-04-12",
        "fitness_valid_upto": "2038-04-11",
        "fuel_type": "ELECTRIC",
        "insurance_valid_upto": "2027-04-10",
        "puc_valid_upto": "EXEMPT (EV)",
        "issuing_rto": "TN-07 (Chennai South)"
    },
    "KA01MJ5678": {
        "owner_name": "S. Anand Kumar",
        "vehicle_class": "LMV (Goods Carrier)",
        "maker_model": "Ashok Leyland Dost",
        "registration_date": "2021-08-20",
        "fitness_valid_upto": "2026-08-19",
        "fuel_type": "DIESEL",
        "insurance_valid_upto": "2026-08-15",
        "puc_valid_upto": "2026-10-15",
        "issuing_rto": "KA-01 (Bengaluru Central)"
    },
    "DL3CCN9901": {
        "owner_name": "R. Verma",
        "vehicle_class": "MCWG (Two Wheeler)",
        "maker_model": "Ather 450X",
        "registration_date": "2022-11-05",
        "fitness_valid_upto": "2037-11-04",
        "fuel_type": "ELECTRIC",
        "insurance_valid_upto": "2027-11-01",
        "puc_valid_upto": "EXEMPT (EV)",
        "issuing_rto": "DL-03 (Delhi Sheikh Sarai)"
    }
}

async def verify_vehicle_rc(plate_number: str) -> Dict[str, Any]:
    """
    Verify vehicle registration via API Setu -> MoRTH Parivahan.
    Returns: owner name, vehicle class, registration date, fitness validity, emission status.
    
    In demo mode (no API keys configured), returns structured response demonstrating
    the national digital infrastructure architecture.
    """
    clean_plate = plate_number.replace(" ", "").replace("-", "").upper()
    
    if not API_SETU_CLIENT_ID:
        demo_rc = SAMPLE_RC_DATABASE.get(clean_plate, {
            "owner_name": f"Registered Citizen ({clean_plate[:2]} Transport Registry)",
            "vehicle_class": "LMV (Motor Car)",
            "maker_model": "Commercial/Private Transport",
            "registration_date": "2022-06-15",
            "fitness_valid_upto": "2037-06-14",
            "fuel_type": "PETROL / HYBRID",
            "insurance_valid_upto": "2027-06-10",
            "puc_valid_upto": "2026-12-31",
            "issuing_rto": f"{clean_plate[:4]} Transport Authority" if len(clean_plate) >= 4 else "RTO Central"
        })
        
        return {
            "status": "demo_mode",
            "plate_number": clean_plate,
            "message": "API Setu integration configured. Simulated MoRTH Parivahan verification (sovereign identity architecture).",
            "integration_ready": True,
            "api_endpoint": f"{API_SETU_BASE}/transport/rc/{clean_plate}",
            "auth_method": "OAuth2.0 (Mutual TLS / Client Credentials)",
            "data_source": "MoRTH Parivahan Sewa (National Register for Driving Licences and Vahan)",
            "verification_data": demo_rc
        }
    
    headers = {
        "X-APISETU-CLIENTID": API_SETU_CLIENT_ID,
        "X-APISETU-APIKEY": API_SETU_CLIENT_SECRET,
        "Content-Type": "application/json"
    }
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{API_SETU_BASE}/transport/rc/{clean_plate}",
                headers=headers,
                timeout=10.0
            )
            if resp.status_code == 200:
                return {
                    "status": "verified",
                    "plate_number": clean_plate,
                    "data_source": "MoRTH Parivahan Sewa via API Setu",
                    "data": resp.json()
                }
            return {
                "status": "error",
                "plate_number": clean_plate,
                "code": resp.status_code,
                "detail": resp.text
            }
    except Exception as exc:
        return {
            "status": "error",
            "plate_number": clean_plate,
            "detail": str(exc)
        }
