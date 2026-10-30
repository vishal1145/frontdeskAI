# Vapi.ai Webhook Integration & Architecture Guide

This document details the production Vapi HTTP Webhook architecture, endpoint specifications, secret authentication, JSON request/response contracts, and local testing instructions for FrontDesk AI.

---

## 🏗️ Vapi Webhook Architecture & Routing Flow

```
                      Vapi.ai Voice Gateway
                               │
                               ▼
                    POST /api/vapi/webhook
                               │
                               ▼
                      Vapi Tool Router
                               │
        ┌──────────────────────┴──────────────────────┐
        │                                             │
        ▼                                             ▼
check_availability                             book_appointment
        │                                             │
        ▼                                             ▼
executeCheckAvailability                      executeBookAppointment
        │                                             │
        └──────────────────────┬──────────────────────┘
                               │
                               ▼
                      HTTP 200 JSON Response
                     { "results": [ ... ] }
```

---

## 🚀 Server Configuration & Endpoint Details

- **Endpoint**: `POST /api/vapi/webhook`
- **Port**: Configurable via `PORT` environment variable (Default: `3000`)
- **Authentication**: `VAPI_WEBHOOK_SECRET` environment variable
  - Supports `x-vapi-secret: <VAPI_WEBHOOK_SECRET>` header.
  - Supports `Authorization: Bearer <VAPI_WEBHOOK_SECRET>` header.
  - Returns `401 Unauthorized` if secret is configured and header is missing/invalid.

---

## 📬 Request & Response Formats

### 1. `check_availability` Tool Call

#### Request (from Vapi to `POST /api/vapi/webhook`):
```json
{
  "message": {
    "type": "tool-calls",
    "toolCalls": [
      {
        "id": "vapi_call_101",
        "type": "function",
        "function": {
          "name": "check_availability",
          "arguments": {
            "date": "tomorrow",
            "time_range": "evening",
            "service_type": "General Checkup"
          }
        }
      }
    ]
  }
}
```

#### Response (from Webhook to Vapi):
```json
{
  "results": [
    {
      "toolCallId": "vapi_call_101",
      "result": {
        "requested_date": "2026-10-02",
        "is_available": true,
        "matching_slots": [
          {
            "slot_iso": "2026-10-02T17:00:00+05:30",
            "display_time": "5:00 PM",
            "doctor_name": "Dr. Ananya Sharma",
            "available": true
          },
          {
            "slot_iso": "2026-10-02T18:00:00+05:30",
            "display_time": "6:00 PM",
            "doctor_name": "Dr. Ananya Sharma",
            "available": true
          }
        ],
        "alternative_slots": [],
        "notes": "Found 3 available slot(s) for 2026-10-02."
      }
    }
  ]
}
```

---

### 2. `book_appointment` Tool Call

#### Request (from Vapi to `POST /api/vapi/webhook`):
```json
{
  "message": {
    "type": "tool-calls",
    "toolCalls": [
      {
        "id": "vapi_call_102",
        "type": "function",
        "function": {
          "name": "book_appointment",
          "arguments": {
            "patient_name": "Rahul Sharma",
            "patient_phone": "9876543210",
            "slot_iso_timestamp": "2026-10-02T18:00:00+05:30",
            "service_type": "General Checkup"
          }
        }
      }
    ]
  }
}
```

#### Response (from Webhook to Vapi):
```json
{
  "results": [
    {
      "toolCallId": "vapi_call_102",
      "result": {
        "status": "confirmed",
        "booking_id": "BK-8419",
        "patient_name": "Rahul Sharma",
        "slot_iso_timestamp": "2026-10-02T18:00:00+05:30",
        "display_time": "06:00 PM (Oct 2)",
        "doctor_name": "Dr. Ananya Sharma",
        "clinic_address": "Care & Cure Clinic, Plot 42, Sector 15, Gurugram"
      }
    }
  ]
}
```

---

## 💻 How to Run & Test Locally

### 1. Start the Vapi Webhook Server
```bash
npm run start:webhook
```
*(Server listens at `http://localhost:3000/api/vapi/webhook`)*

### 2. Run Automated Local Webhook Test
```bash
npm run test:webhook
```

### 3. Test with `curl`

#### Check Availability Request:
```bash
curl -X POST http://localhost:3000/api/vapi/webhook \
  -H "Content-Type: application/json" \
  -H "x-vapi-secret: your_secret_here" \
  -d '{
    "message": {
      "type": "tool-calls",
      "toolCalls": [
        {
          "id": "curl_test_01",
          "type": "function",
          "function": {
            "name": "check_availability",
            "arguments": {
              "date": "tomorrow",
              "time_range": "evening"
            }
          }
        }
      ]
    }
  }'
```

#### Book Appointment Request:
```bash
curl -X POST http://localhost:3000/api/vapi/webhook \
  -H "Content-Type: application/json" \
  -H "x-vapi-secret: your_secret_here" \
  -d '{
    "message": {
      "type": "tool-calls",
      "toolCalls": [
        {
          "id": "curl_test_02",
          "type": "function",
          "function": {
            "name": "book_appointment",
            "arguments": {
              "patient_name": "Rahul Sharma",
              "patient_phone": "9876543210",
              "slot_iso_timestamp": "2026-10-02T18:00:00+05:30",
              "service_type": "General Checkup"
            }
          }
        }
      ]
    }
  }'
```

---

## 🔒 Secret Configuration (`.env`)

Add the following to your `.env` file:
```env
PORT=3000
VAPI_WEBHOOK_SECRET=your_custom_vapi_secret_key
```

When `VAPI_WEBHOOK_SECRET` is set, all incoming requests without matching `x-vapi-secret` or `Authorization` headers will be rejected with HTTP `401 Unauthorized`.
