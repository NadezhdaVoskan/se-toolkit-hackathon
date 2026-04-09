def test_register_login_and_fetch_current_user(client):
    register_response = client.post(
        "/api/auth/register",
        json={
            "email": "user@example.com",
            "password": "password123",
        },
    )

    assert register_response.status_code == 201
    register_payload = register_response.json()
    assert register_payload["user"]["email"] == "user@example.com"
    assert register_payload["access_token"]

    login_response = client.post(
        "/api/auth/login",
        json={
            "email": "user@example.com",
            "password": "password123",
        },
    )

    assert login_response.status_code == 200
    login_payload = login_response.json()
    assert login_payload["user"]["email"] == "user@example.com"

    me_response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {login_payload['access_token']}"},
    )

    assert me_response.status_code == 200
    assert me_response.json()["email"] == "user@example.com"


def test_tasks_are_isolated_per_user(client, auth_headers):
    alice_headers = auth_headers("alice@example.com", "password123")
    bob_headers = auth_headers("bob@example.com", "password123")

    create_response = client.post(
        "/api/tasks",
        json={
            "title": "Private task",
            "description": "Only Alice should see this",
            "day_of_week": "Monday",
            "status": "todo",
        },
        headers=alice_headers,
    )

    assert create_response.status_code == 201

    alice_tasks = client.get("/api/tasks", headers=alice_headers)
    bob_tasks = client.get("/api/tasks", headers=bob_headers)

    assert alice_tasks.status_code == 200
    assert bob_tasks.status_code == 200
    assert len(alice_tasks.json()) == 1
    assert bob_tasks.json() == []


def test_protected_routes_require_authentication(client):
    tasks_response = client.get("/api/tasks")
    upload_response = client.post(
        "/api/voice-notes/upload",
        files={"file": ("weekly-plan.webm", b"fake-audio-bytes", "audio/webm")},
    )

    assert tasks_response.status_code == 401
    assert upload_response.status_code == 401
