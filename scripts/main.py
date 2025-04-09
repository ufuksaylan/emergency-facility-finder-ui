import json
import os
import sys
import requests # Requires: pip3 install requests

# --- Configuration ---
API_BASE_URL = "https://emergency-facility-finder.2epmej6a101wj.eu-central-1.cs.amazonlightsail.com/"  # !!! REPLACE with your actual API base URL
API_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6ImFkbWluIiwiaXNzdWVkX2F0IjoxNzQ0MjA1Njc0LCJleHAiOjE3NDQyNzIzOTZ9.ZF4qcEmURGyQVgYxF_KWO_5daBx4aPfvwil3etFaBfw"           # !!! REPLACE with your actual API Bearer token
# For better security, consider reading the token from an environment variable:
# API_TOKEN = os.environ.get("FACILITY_API_TOKEN")
INPUT_JSON_FILE = "hospitals_update.json"          # Name of the file containing the actual data array
# --- End Configuration ---

# --- Database Specialties (as a Python structure) ---
# It's often easier to manage this as native Python if it doesn't change often,
# or load it from its own JSON file if preferred.
DATABASE_SPECIALTIES = [
    {"id": 1, "name": "abdominal_surgery"}, {"id": 2, "name": "addiction_medicine_treatment"},
    {"id": 3, "name": "aesthetic_laser_dermatology"}, {"id": 4, "name": "allergology_clinical_immunology"},
    {"id": 5, "name": "amyloidosis_care"}, {"id": 6, "name": "anesthesiology_intensive_care_pain_management"},
    {"id": 7, "name": "angiology_vascular_medicine"}, {"id": 8, "name": "art_therapy"},
    {"id": 9, "name": "blood_banking_transfusion_medicine"}, {"id": 10, "name": "bone_marrow_transplantation"},
    {"id": 11, "name": "cardiac_surgery"}, {"id": 12, "name": "cardiology"},
    {"id": 13, "name": "child_adolescent_psychiatry"}, {"id": 14, "name": "clinical_pharmacology"},
    {"id": 15, "name": "clinical_research"}, {"id": 16, "name": "coagulation_disorders_hemophilia_care"},
    {"id": 17, "name": "crisis_intervention_suicide_prevention"}, {"id": 18, "name": "dementia_care"},
    {"id": 19, "name": "dental_prosthetics"}, {"id": 20, "name": "dentistry"},
    {"id": 21, "name": "dermatology_dermatovenerology"}, {"id": 22, "name": "diabetes_care_diabetology"},
    {"id": 23, "name": "dialysis"}, {"id": 24, "name": "dietetics_nutrition"},
    {"id": 25, "name": "emergency_medicine"}, {"id": 26, "name": "endocrinology"},
    {"id": 27, "name": "endoscopy"}, {"id": 28, "name": "family_medicine"},
    {"id": 29, "name": "fertility_treatment_reproductive_medicine"}, {"id": 30, "name": "gastroenterology"},
    {"id": 31, "name": "general_surgery"}, {"id": 32, "name": "genetics_medical"},
    {"id": 33, "name": "geriatrics"}, {"id": 34, "name": "group_therapy"},
    {"id": 35, "name": "hematology"}, {"id": 36, "name": "hepatology"},
    {"id": 37, "name": "home_care_community_nursing"}, {"id": 38, "name": "hydrotherapy"},
    {"id": 39, "name": "infectious_diseases"}, {"id": 40, "name": "internal_medicine"},
    {"id": 41, "name": "laboratory_medicine_clinical_pathology"}, {"id": 43, "name": "long_term_care"},
    {"id": 42, "name": "longevity_medicine_anti_aging"}, {"id": 44, "name": "mammology_breast_health"},
    {"id": 45, "name": "massage_therapy"}, {"id": 46, "name": "medical_informatics"},
    {"id": 47, "name": "molecular_medicine"}, {"id": 48, "name": "neonatology"},
    {"id": 49, "name": "nephrology"}, {"id": 50, "name": "neurology"},
    {"id": 51, "name": "neuromodulation_therapies"}, {"id": 52, "name": "neurosurgery"},
    {"id": 53, "name": "nuclear_medicine"}, {"id": 54, "name": "nursing_care"},
    {"id": 55, "name": "obstetrics_gynecology"}, {"id": 56, "name": "occupational_medicine"},
    {"id": 57, "name": "occupational_therapy"}, {"id": 58, "name": "oncology"},
    {"id": 59, "name": "ophthalmology"}, {"id": 60, "name": "oral_maxillofacial_surgery"},
    {"id": 61, "name": "orthopedics_traumatology"}, {"id": 62, "name": "otorhinolaryngology_ent"},
    {"id": 63, "name": "palliative_care"}, {"id": 64, "name": "pediatric_dentistry"},
    {"id": 65, "name": "pediatric_emergency_medicine"}, {"id": 66, "name": "pediatrics_child_health"},
    {"id": 67, "name": "perinatology_high_risk_pregnancy"}, {"id": 68, "name": "physical_medicine_rehabilitation"},
    {"id": 69, "name": "physiotherapy_kinesitherapy"}, {"id": 70, "name": "plastic_reconstructive_surgery"},
    {"id": 71, "name": "preventive_medicine_health_screening"}, {"id": 72, "name": "proctology"},
    {"id": 73, "name": "psychiatry"}, {"id": 74, "name": "psychology"},
    {"id": 75, "name": "psychosocial_rehabilitation"}, {"id": 76, "name": "psychotherapy"},
    {"id": 77, "name": "pulmonary_hypertension_care"}, {"id": 78, "name": "pulmonology"},
    {"id": 79, "name": "radiology_medical_imaging"}, {"id": 80, "name": "regenerative_medicine"},
    {"id": 81, "name": "rheumatology"}, {"id": 82, "name": "social_work"},
    {"id": 83, "name": "speech_therapy"}, {"id": 84, "name": "sports_medicine"},
    {"id": 85, "name": "stem_cell_banking_therapy"}, {"id": 86, "name": "thoracic_surgery"},
    {"id": 87, "name": "toxicology"}, {"id": 88, "name": "urology"},
    {"id": 89, "name": "vaccinations_immunoprophylaxis"}, {"id": 90, "name": "vascular_surgery"},
    {"id": 91, "name": "veterinary_medicine"}
]
# --- End Database Specialties ---

def create_specialty_map(specialties):
    """Creates a dictionary mapping specialty names to IDs."""
    spec_map = {}
    for spec in specialties:
        # Ensure both id and name are present before adding
        if spec.get("id") is not None and spec.get("name"):
            spec_map[spec["name"]] = spec["id"]
    return spec_map

def load_actual_data(filename):
    """Loads the facility data from the JSON file."""
    if not os.path.exists(filename):
        print(f"Error: Input file '{filename}' not found.", file=sys.stderr)
        sys.exit(1)
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON from '{filename}': {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error reading file '{filename}': {e}", file=sys.stderr)
        sys.exit(1)

def process_facilities(actual_data, specialty_map):
    """Iterates through facilities, builds payloads, and makes API calls."""
    if not API_TOKEN or API_TOKEN == "YOUR_SECRET_API_TOKEN":
        print("Error: API_TOKEN is not set or is still the placeholder.", file=sys.stderr)
        sys.exit(1)

    if not API_BASE_URL or API_BASE_URL == "https://your-api-domain.com":
         print("Error: API_BASE_URL is not set or is still the placeholder.", file=sys.stderr)
         sys.exit(1)

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_TOKEN}"
    }

    for facility_data in actual_data:
        osrm_id = facility_data.get("osrm_id")

        if not osrm_id:
            print(f"Skipping record due to missing osrm_id: {facility_data.get('name', 'N/A')}")
            continue

        print(f"--- Processing OSRM ID: {osrm_id} ---")

        # --- Extract data safely ---
        contact_info = facility_data.get("contact", {}) # Default to empty dict if 'contact' is missing
        email = contact_info.get("email")
        website = contact_info.get("website")
        phone = contact_info.get("phone") # API payload uses 'phone' based on example
        has_emergency_room = facility_data.get("has_emergency_room", False) # Default to False
        specialty_names = facility_data.get("specialties_en", []) # Default to empty list

        # --- Map specialties ---
        mapped_specialty_ids = []
        if specialty_names: # Only map if the list exists and is not empty
            for name in specialty_names:
                if not name: # Skip None or empty strings
                    continue
                spec_id = specialty_map.get(name)
                if spec_id is not None:
                    mapped_specialty_ids.append(spec_id)
                    # print(f"Mapped specialty '{name}' to ID {spec_id}") # Uncomment for detail
                else:
                    print(f"Warning: Specialty name '{name}' for OSRM ID {osrm_id} not found in map. Skipping.")

        # --- Build conditional update payload ---
        payload_updates = {}

        if email: # Checks for non-empty string (None, "" are False)
            payload_updates["email"] = email
        if website:
            payload_updates["website"] = website
        if phone:
            payload_updates["phone"] = phone # Using 'phone' key
        if has_emergency_room is True: # Explicit check for True
            payload_updates["has_emergency"] = True
        if mapped_specialty_ids: # Checks if list is not empty
            payload_updates["specialty_ids"] = mapped_specialty_ids

        # --- Check if there's anything to update ---
        if not payload_updates:
            print(f"No fields to update for OSRM ID {osrm_id}. Skipping PATCH request.")
            continue

        # --- Construct final payload and URL ---
        final_payload = {"facility": payload_updates}
        api_url = f"{API_BASE_URL}/admin/facilities/{osrm_id}"

        print(f"Payload for {osrm_id}: {json.dumps(final_payload)}")
        print(f"Sending PATCH request to {api_url}...")

        # --- Make the API Call ---
        try:
            response = requests.patch(api_url, headers=headers, json=final_payload, timeout=30) # 30s timeout

            print(f"HTTP Status: {response.status_code}")
            if not response.ok: # Check for 4xx or 5xx errors
                print(f"Error Response Body: {response.text}")
            # You might want to add more detailed response handling here

        except requests.exceptions.RequestException as e:
            print(f"Error during API call for OSRM ID {osrm_id}: {e}", file=sys.stderr)

        print(f"--- Finished OSRM ID: {osrm_id} ---")
        # Optional: time.sleep(1) # Add import time at the top if using sleep

# --- Main execution ---
if __name__ == "__main__":
    specialty_map = create_specialty_map(DATABASE_SPECIALTIES)
    actual_data = load_actual_data(INPUT_JSON_FILE)
    if actual_data:
        process_facilities(actual_data, specialty_map)
        print("Script finished.")