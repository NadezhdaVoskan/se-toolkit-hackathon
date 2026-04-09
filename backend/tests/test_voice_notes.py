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
