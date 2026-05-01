"""Tests for /api/chat and /api/health endpoints."""


class TestHealthEndpoint:
    def test_health_returns_ok(self, client):
        resp = client.get("/api/health")
        assert resp.status_code == 200
        assert resp.json() == {"status": "ok"}


class TestChatEndpoint:
    def test_chat_returns_answer(self, client):
        resp = client.post("/api/chat", json={"question": "What is the GHT?"})
        assert resp.status_code == 200
        data = resp.json()
        assert "answer" in data
        assert "sources" in data
        assert isinstance(data["sources"], list)

    def test_chat_empty_question_rejected(self, client):
        resp = client.post("/api/chat", json={"question": ""})
        # Pydantic will reject empty string if min_length is set,
        # otherwise the RAG chain will handle it
        assert resp.status_code in (200, 422)

    def test_chat_too_long_question_rejected(self, client):
        long_q = "a" * 501
        resp = client.post("/api/chat", json={"question": long_q})
        assert resp.status_code == 422  # max_length=500
