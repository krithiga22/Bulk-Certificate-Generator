def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_create_job_validation_errors(client):
    # Empty event name
    res = client.post("/api/jobs", json={
        "event_name": "   ",
        "issue_date": "2026-10-11",
        "recipients": [{"name": "Test", "email": "test@example.com"}]
    })
    assert res.status_code == 422

    # Missing recipients
    res = client.post("/api/jobs", json={
        "event_name": "Workshop",
        "issue_date": "2026-10-11",
        "recipients": []
    })
    assert res.status_code == 422

    # Invalid issue date
    res = client.post("/api/jobs", json={
        "event_name": "Workshop",
        "issue_date": "invalid-date",
        "recipients": [{"name": "Test", "email": "test@example.com"}]
    })
    assert res.status_code == 422


def test_create_and_retrieve_job(client):
    payload = {
        "event_name": "Python Workshop",
        "issue_date": "2026-10-11",
        "organization_name": "Aereo Academy",
        "signatory_name": "Dr. Smith",
        "recipients": [
            {"name": "Alice Johnson", "email": "alice@example.com"},
            {"name": "Bob Miller", "email": "bob@example.com"},
        ],
    }
    create_res = client.post("/api/jobs", json=payload)
    assert create_res.status_code == 202
    data = create_res.json()
    assert "job_id" in data
    assert data["total_count"] == 2
    job_id = data["job_id"]

    # Retrieve job status
    get_res = client.get(f"/api/jobs/{job_id}")
    assert get_res.status_code == 200
    job_data = get_res.json()
    assert job_data["id"] == job_id
    assert job_data["event_name"] == "Python Workshop"
    assert job_data["total_count"] == 2

    # Retrieve recipient certificates
    certs_res = client.get(f"/api/jobs/{job_id}/certificates")
    assert certs_res.status_code == 200
    certs_data = certs_res.json()
    assert len(certs_data["certificates"]) == 2
    assert certs_data["certificates"][0]["recipient_name"] == "Alice Johnson"

    # CSV report
    report_res = client.get(f"/api/jobs/{job_id}/report")
    assert report_res.status_code == 200
    assert "text/csv" in report_res.headers["content-type"]
    assert "Alice Johnson" in report_res.text


def test_job_not_found(client):
    res = client.get("/api/jobs/non-existent-uuid")
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "JOB_NOT_FOUND"


def test_dashboard_stats(client):
    res = client.get("/api/jobs/dashboard/stats")
    assert res.status_code == 200
    stats = res.json()
    assert "total_jobs" in stats
    assert "certificates_issued" in stats
    assert "jobs_processing" in stats
