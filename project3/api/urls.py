from django.urls import path
from .views import main
urlpatterns = [
    # path('admin/', admin.site.urls),
    path('', main),
    path('home', main)
]
