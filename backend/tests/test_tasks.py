def test_create_task(client):
    response = client.post(
        "/api/tasks",
        json={
            "title": "Finish math homework",
            "description": "Chapter 4 exercises",
            "day_of_week": "Monday",
            "status": "todo",
        },
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["title"] == "Finish math homework"
    assert payload["description"] == "Chapter 4 exercises"
    assert payload["day_of_week"] == "Monday"
    assert payload["status"] == "todo"
    assert payload["id"]


def test_update_task_status(client):
    create_response = client.post(
        "/api/tasks",
        json={
            "title": "Prepare presentation slides",
            "description": "",
            "day_of_week": "Wednesday",
            "status": "todo",
        },
    )
    task_id = create_response.json()["id"]

    update_response = client.patch(
        f"/api/tasks/{task_id}",
        json={"status": "done"},
    )

    assert update_response.status_code == 200
    payload = update_response.json()
    assert payload["id"] == task_id
    assert payload["status"] == "done"
