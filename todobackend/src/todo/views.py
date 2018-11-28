from django.shortcuts import render
from rest_framework import status, viewsets
from rest_framework.reverse import reverse
from rest_framework.decorators import list_route
from rest_framework.response import Response

from todo.models import TodoItem
from todo.serializers import TodoItemSerializer


# Create your views here.
class TodoItemViewSet(viewsets.ModelViewSet):
    queryset = TodoItem.objects.all()
    serializer_class = TodoItemSerializer

    def perform_create(self, serializer):
        # Save instance to get primary key and then update URL
        instance = serializer.save()
        instance.url = reverse('todoitem-detail', args=[instance.pk],
                               request=self.request)
        instance.save()

    def delete(self, request):
        # Deletes all todo items
        TodoItem.objects.all().delete()

        return Response(status=status.HTTP_204_NO_CONTENT)
