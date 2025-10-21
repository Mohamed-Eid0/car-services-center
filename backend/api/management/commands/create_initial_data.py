from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

from api.models import User

User = get_user_model()


class Command(BaseCommand):
    help = 'Create initial data for the application'

    def handle(self, *args, **options):
        """Create initial users and data"""
        
        # Create super admin user
        if not User.objects.filter(username='admin').exists():
            User.objects.create_user(
                username='admin',
                password='admin123',
                first_name='عمر',
                last_name='علي',
                role=User.Role.SUPER_ADMIN,
                is_active=True
            )
            self.stdout.write(
                self.style.SUCCESS('Created super admin user: admin/admin123')
            )
        
        # Create receptionist user
        if not User.objects.filter(username='receptionist').exists():
            User.objects.create_user(
                username='receptionist',
                password='recep123',
                first_name='مصطفي',
                last_name='عادل',
                role=User.Role.RECEPTIONIST,
                is_active=True
            )
            self.stdout.write(
                self.style.SUCCESS('Created receptionist user: receptionist/recep123')
            )
        
        # Create technician users
        if not User.objects.filter(username='technician1').exists():
            User.objects.create_user(
                username='technician1',
                password='tech123',
                first_name='ماجد',
                last_name='عامر',
                role=User.Role.TECHNICIAN,
                is_active=True
            )
            self.stdout.write(
                self.style.SUCCESS('Created technician user: technician1/tech123')
            )
        
        if not User.objects.filter(username='technician2').exists():
            User.objects.create_user(
                username='technician2',
                password='tech1234',
                first_name='كريم',
                last_name='حازم',
                role=User.Role.TECHNICIAN,
                is_active=True
            )
            self.stdout.write(
                self.style.SUCCESS('Created technician user: technician2/tech1234')
            )
        
        self.stdout.write(
            self.style.SUCCESS('Initial data creation completed!')
        )
