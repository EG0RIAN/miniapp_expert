import uuid
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from apps.documents.models import Document


class PublicApiSmokeTests(APITestCase):
    """
    Лёгкие смоук-тесты публичного/клиентского API.
    Не требуют внешних интеграций, проверяют базовые ручки.
    """

    def setUp(self):
        self.client = APIClient()
        # Убедимся, что миграции с базовыми документами применены
        # (migrations 0003_seed_default_documents создают 4 записи)
        if Document.objects.count() == 0:
            self.skipTest("Документы не засеяны, пропуск смоук-теста документов")

    def _register_user(self):
        email = f"test{uuid.uuid4().hex[:8]}@example.com"
        password = "Test1234"
        payload = {
            "email": email,
            "password": password,
            "name": "Smoke User",
            "phone": "+70000000000",
        }
        resp = self.client.post("/api/auth/register/", payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        data = resp.json()
        token = data.get("token")
        self.assertTrue(token, "access token отсутствует в ответе регистрации")
        return email, password, token

    def test_auth_register_profile_cycle(self):
        email, password, token = self._register_user()

        # Профиль с токеном
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        profile = self.client.get("/api/auth/profile/")
        self.assertEqual(profile.status_code, status.HTTP_200_OK, profile.data)
        self.assertEqual(profile.json().get("email"), email)

        # Логин теми же данными
        login = self.client.post(
            "/api/auth/login/",
            {"email": email, "password": password},
            format="json",
        )
        self.assertEqual(login.status_code, status.HTTP_200_OK, login.data)
        self.assertTrue(login.json().get("token"))

    def test_public_documents_available(self):
        # Список всех опубликованных документов
        resp = self.client.get("/api/documents/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        docs = resp.json().get("documents")
        self.assertTrue(docs, "Список документов пустой")

        # По каждому типу проверяем доступность
        for doc_type in ["privacy", "affiliate_terms", "cabinet_terms", "subscription_terms"]:
            detail = self.client.get(f"/api/documents/{doc_type}/")
            self.assertEqual(
                detail.status_code,
                status.HTTP_200_OK,
                f"{doc_type} response: {detail.content}",
            )
            self.assertTrue(detail.json().get("document"))

    def test_client_products_and_dashboard_empty_ok(self):
        # Регистрация и авторизация
        _, _, token = self._register_user()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        products = self.client.get("/api/client/products/")
        self.assertEqual(products.status_code, status.HTTP_200_OK, products.data)
        self.assertIn("products", products.json())

        available = self.client.get("/api/client/products/available/")
        self.assertEqual(available.status_code, status.HTTP_200_OK, available.data)
        self.assertIn("products", available.json())

        dashboard = self.client.get("/api/client/dashboard/")
        self.assertEqual(dashboard.status_code, status.HTTP_200_OK, dashboard.data)
        self.assertTrue(dashboard.json().get("success"))

    def test_audit_events_endpoints(self):
        # /api/events (анонимно)
        payload = {"event_type": "page_view", "metadata": {"path": "/"}}
        resp = self.client.post("/api/events", payload, format="json")
        # API может возвращать 200 или 201; главное — success=True
        self.assertIn(resp.status_code, (status.HTTP_200_OK, status.HTTP_201_CREATED), resp.content)
        self.assertTrue(resp.json().get("success"))

        # /api/cart/track (анонимно)
        payload = {"product_id": "test", "action": "add"}
        resp = self.client.post("/api/cart/track", payload, format="json")
        self.assertIn(resp.status_code, (status.HTTP_200_OK, status.HTTP_201_CREATED), resp.content)
        self.assertTrue(resp.json().get("success"))

    def test_client_documents_list(self):
        # Регистрация и авторизация
        _, _, token = self._register_user()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        resp = self.client.get("/api/client/documents/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.content)
        data = resp.json()
        # ожидаем ключи с подписанными и требующими подписи документами
        self.assertIn("signed_documents", data)
        self.assertIn("documents_to_sign", data)

