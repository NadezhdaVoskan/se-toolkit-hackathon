def test_upload_voice_note_creates_transcription_and_tasks(client, auth_headers):
    headers = auth_headers()

    response = client.post(
        "/api/voice-notes/upload",
        files={"file": ("weekly-plan.webm", b"fake-audio-bytes", "audio/webm")},
        headers=headers,
    )

    assert response.status_code == 201
    payload = response.json()

    assert "Review project timeline" in payload["transcription_text"]
    assert payload["voice_note"]["original_filename"] == "weekly-plan.webm"
    assert len(payload["extracted_tasks"]) == 2
    assert payload["extracted_tasks"][0]["source_voice_note_id"] == payload["voice_note"]["id"]

    list_response = client.get("/api/tasks", headers=headers)
    assert list_response.status_code == 200
    assert len(list_response.json()) == 2


def test_process_then_confirm_voice_note_allows_task_edits(client, auth_headers):
    headers = auth_headers()

    process_response = client.post(
        "/api/voice-notes/process",
        files={"file": ("weekly-plan.webm", b"fake-audio-bytes", "audio/webm")},
        headers=headers,
    )

    assert process_response.status_code == 200
    process_payload = process_response.json()
    assert process_payload["original_filename"] == "weekly-plan.webm"
    assert len(process_payload["extracted_tasks"]) >= 1

    first_task = process_payload["extracted_tasks"][0]
    first_task["title"] = "Edited task title"
    first_task["description"] = "Edited description"
    first_task["due_date"] = "2026-04-10"

    confirm_response = client.post(
        "/api/voice-notes/confirm",
        json={
            "original_filename": process_payload["original_filename"],
            "transcription_text": process_payload["transcription_text"],
            "tasks": [first_task],
        },
        headers=headers,
    )

    assert confirm_response.status_code == 201
    confirm_payload = confirm_response.json()
    assert len(confirm_payload["extracted_tasks"]) == 1
    assert confirm_payload["extracted_tasks"][0]["title"] == "Edited task title"
    assert confirm_payload["extracted_tasks"][0]["description"] == "Edited description"
    assert confirm_payload["extracted_tasks"][0]["due_date"] == "2026-04-10"
