def test_create_task(client, auth_headers):
    headers = auth_headers()

    response = client.post(
        "/api/tasks",
        json={
            "title": "Finish math homework",
            "description": "Chapter 4 exercises",
            "day_of_week": "Monday",
            "status": "todo",
        },
        headers=headers,
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["title"] == "Finish math homework"
    assert payload["description"] == "Chapter 4 exercises"
    assert payload["day_of_week"] == "Monday"
    assert payload["status"] == "todo"
    assert payload["id"]


def test_update_task_status(client, auth_headers):
    headers = auth_headers()

    create_response = client.post(
        "/api/tasks",
        json={
            "title": "Prepare presentation slides",
            "description": "",
            "day_of_week": "Wednesday",
            "status": "todo",
        },
        headers=headers,
    )
    task_id = create_response.json()["id"]

    update_response = client.patch(
        f"/api/tasks/{task_id}",
        json={"status": "done"},
        headers=headers,
    )

    assert update_response.status_code == 200
    payload = update_response.json()
    assert payload["id"] == task_id
    assert payload["status"] == "done"
