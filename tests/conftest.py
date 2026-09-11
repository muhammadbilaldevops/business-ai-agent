import pytest
from fastapi.testclient import TestClient

from apps.api.main import create_app
from localops.config import Settings


@pytest.fixture
def client(tmp_path):
    with TestClient(create_app(Settings(data_dir=tmp_path, mode="extractive"))) as c:
        yield c


@pytest.fixture
def document(client):
    r = client.post(
        "/api/documents/upload",
        files={
            "file": (
                "refund.md",
                b"# Refund policy\nRefunds are available within 30 days with proof of purchase. Contact support for approval.",
                "text/markdown",
            )
        },
    )
    assert r.status_code == 200, r.text
    return r.json()


@pytest.fixture
def dataset(client):
    r = client.post(
        "/api/analytics/upload",
        files={
            "file": (
                "sales.csv",
                b"month,revenue\n2026-07,100\n2026-08,80\n2026-08,40\n",
                "text/csv",
            )
        },
    )
    assert r.status_code == 200, r.text
    return r.json()
