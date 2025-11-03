from django.urls import path
from . import views
urlpatterns = [
    path('', views.database_test_view, name='db_test_page')
]
