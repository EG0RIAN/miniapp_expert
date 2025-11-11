from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone
from datetime import timedelta
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .models import User
from .serializers import UserSerializer
from .services import send_verification_email, generate_verification_token, verify_token, generate_reset_token, send_password_reset_email


class HealthView(views.APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        return Response({
            'status': 'ok',
            'service': 'miniapp-expert-api',
            'version': '1.0.0',
            'timestamp': timezone.now().isoformat()
        })


@method_decorator(csrf_exempt, name='dispatch')
class LoginView(views.APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Информация о endpoint для GET запросов"""
        return Response({
            'message': 'This endpoint requires POST method',
            'endpoint': '/api/auth/login/',
            'method': 'POST',
            'required_fields': ['email', 'password'],
            'example': {
                'email': 'user@example.com',
                'password': 'your-password'
            }
        }, status=status.HTTP_405_METHOD_NOT_ALLOWED)
    
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response(
                {'success': False, 'message': 'Email и пароль обязательны для заполнения'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Валидация email
        if '@' not in email:
            return Response(
                {'success': False, 'message': 'Некорректный email адрес'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = authenticate(request, username=email, password=password)
            
            if not user:
                return Response(
                    {'success': False, 'message': 'Неверный email или пароль'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            if not user.is_active:
                return Response(
                    {'success': False, 'message': 'Учетная запись отключена'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'success': True,
                'message': 'Вход выполнен успешно',
                'token': str(refresh.access_token),
                'refresh_token': str(refresh),
                'user': UserSerializer(user).data
            })
            
        except Exception as e:
            return Response(
                {'success': False, 'message': f'Ошибка при входе: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(csrf_exempt, name='dispatch')
class RegisterView(views.APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        name = request.data.get('name')
        phone = request.data.get('phone')
        referral_code = request.data.get('referral_code')
        
        if not email or not password:
            return Response(
                {'success': False, 'message': 'Email и пароль обязательны для заполнения'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Валидация email
        if not email or '@' not in email:
            return Response(
                {'success': False, 'message': 'Некорректный email адрес'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Валидация пароля
        if len(password) < 6:
            return Response(
                {'success': False, 'message': 'Пароль должен содержать минимум 6 символов'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Проверка существования пользователя
        if User.objects.filter(email=email).exists():
            return Response(
                {'success': False, 'message': 'Пользователь с таким email уже существует'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Создание пользователя
            user = User.objects.create_user(
                email=email,
                password=password,
                name=name or email.split('@')[0],
                phone=phone or None,
                role='client',
                is_active=True,
            )
            
            # Обработка реферального кода
            if referral_code:
                try:
                    referrer = User.objects.get(referral_code=referral_code.upper())
                    user.referred_by = referrer
                    user.save()
                except User.DoesNotExist:
                    pass
            
            # Отправка email с подтверждением
            try:
                send_verification_email(user)
            except Exception as e:
                # Логируем ошибку, но не прерываем регистрацию
                print(f"Failed to send verification email: {e}")
            
            # Генерация JWT токенов
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'success': True,
                'message': 'Регистрация успешна. Проверьте вашу почту для подтверждения email.',
                'token': str(refresh.access_token),
                'refresh_token': str(refresh),
                'user': UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'success': False, 'message': f'Ошибка при регистрации: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ProfileView(views.APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response(UserSerializer(request.user).data)
    
    def patch(self, request):
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ResendVerificationEmailView(views.APIView):
    """Повторная отправка письма подтверждения email"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        
        # Если email уже подтвержден, не отправляем письмо
        if user.email_verified:
            return Response({
                'success': False,
                'message': 'Email уже подтвержден'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Отправляем письмо (токен генерируется внутри функции)
            if send_verification_email(user):
                return Response({
                    'success': True,
                    'message': 'Письмо с подтверждением отправлено на ваш email'
                })
            else:
                return Response({
                    'success': False,
                    'message': 'Не удалось отправить письмо. Попробуйте позже.',
                    'error_code': 'EMAIL_SEND_FAILED'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            print(f"Error sending verification email: {e}")
            return Response({
                'success': False,
                'message': 'Ошибка при отправке письма',
                'error_code': 'EMAIL_SEND_FAILED'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AcceptAffiliateTermsView(views.APIView):
    """Принятие условий партнерской программы"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        
        try:
            # Используем DocumentAcceptance для принятия условий
            from apps.documents.models import Document, DocumentAcceptance
            
            # Получаем документ affiliate_terms
            document = Document.objects.get(
                document_type='affiliate_terms',
                is_active=True,
                is_published=True
            )
            
            # Проверяем, не принят ли уже документ этой версии
            existing_acceptance = DocumentAcceptance.objects.filter(
                user=user,
                document=document,
                version=document.version
            ).first()
            
            if existing_acceptance:
                return Response({
                    'success': True,
                    'message': 'Условия уже приняты'
                })
            
            # Получаем IP адрес и User-Agent
            ip_address = self._get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')
            
            # Создаем новую запись о принятии документа
            acceptance = DocumentAcceptance.objects.create(
                user=user,
                document=document,
                version=document.version,
                ip_address=ip_address,
                user_agent=user_agent,
            )
            
            # Обновляем offer_accepted_at в User (для обратной совместимости)
            from django.utils import timezone
            user.offer_accepted_at = timezone.now()
            user.offer_version = str(document.version)
            user.save(update_fields=['offer_accepted_at', 'offer_version'])
            
            return Response({
                'success': True,
                'message': 'Условия партнерской программы приняты'
            })
        except Document.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Документ не найден'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"Error accepting affiliate terms: {e}")
            return Response({
                'success': False,
                'message': 'Ошибка при принятии условий'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _get_client_ip(self, request):
        """Получить IP адрес клиента"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


@method_decorator(csrf_exempt, name='dispatch')
class VerifyEmailView(views.APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        token = request.data.get('token')
        email = request.data.get('email')
        
        if not token or not email:
            return Response(
                {'success': False, 'message': 'Токен и email обязательны для подтверждения'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email=email)
            
            # Проверяем токен
            if verify_token(user.email, token):
                # Обновляем статус подтверждения email
                user.email_verified = True
                user.verification_token = None
                user.save()
                
                return Response({
                    'success': True,
                    'message': 'Email успешно подтвержден'
                })
            else:
                return Response(
                    {'success': False, 'message': 'Неверный или истекший токен подтверждения'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except User.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Пользователь с таким email не найден'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'success': False, 'message': f'Ошибка при подтверждении email: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(csrf_exempt, name='dispatch')
class RequestPasswordResetView(views.APIView):
    """Запрос на восстановление пароля"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response(
                {'success': False, 'message': 'Email обязателен для заполнения'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Валидация email
        if '@' not in email:
            return Response(
                {'success': False, 'message': 'Некорректный email адрес'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Ищем пользователя по email
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                # Не сообщаем, что пользователь не найден (безопасность)
                return Response({
                    'success': True,
                    'message': 'Если пользователь с таким email существует, на него будет отправлена инструкция по восстановлению пароля'
                })
            
            # Генерируем токен для сброса пароля
            reset_token = generate_reset_token()
            user.reset_token = reset_token
            user.reset_token_expires_at = timezone.now() + timedelta(hours=24)
            user.save()
            
            # Отправляем email с инструкцией
            email_sent = False
            try:
                email_sent = send_password_reset_email(user, reset_token)
            except Exception as e:
                # Логируем ошибку
                import traceback
                print(f"Failed to send password reset email: {e}")
                traceback.print_exc()
            
            if not email_sent:
                # Если email не отправлен, возвращаем ошибку
                # Но токен уже сохранен, так что пользователь может использовать его вручную
                return Response(
                    {
                        'success': False, 
                        'message': 'Ошибка при отправке email. Пожалуйста, обратитесь в поддержку или попробуйте позже.',
                        'error_code': 'EMAIL_SEND_FAILED'
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            return Response({
                'success': True,
                'message': 'Инструкция по восстановлению пароля отправлена на ваш email'
            })
            
        except Exception as e:
            return Response(
                {'success': False, 'message': f'Ошибка при обработке запроса: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(csrf_exempt, name='dispatch')
class ResetPasswordView(views.APIView):
    """Установка нового пароля по токену"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        token = request.data.get('token')
        email = request.data.get('email')
        new_password = request.data.get('new_password') or request.data.get('password')
        
        if not token or not email or not new_password:
            return Response(
                {'success': False, 'message': 'Токен, email и новый пароль обязательны для заполнения'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Валидация пароля
        if len(new_password) < 6:
            return Response(
                {'success': False, 'message': 'Пароль должен содержать минимум 6 символов'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Ищем пользователя по email и токену
            try:
                user = User.objects.get(email=email, reset_token=token)
            except User.DoesNotExist:
                return Response(
                    {'success': False, 'message': 'Неверный или истекший токен восстановления пароля'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Проверяем срок действия токена
            if user.reset_token_expires_at and user.reset_token_expires_at < timezone.now():
                # Очищаем токен
                user.reset_token = None
                user.reset_token_expires_at = None
                user.save()
                return Response(
                    {'success': False, 'message': 'Срок действия ссылки истек. Запросите новую ссылку для восстановления пароля.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Устанавливаем новый пароль
            user.set_password(new_password)
            user.reset_token = None
            user.reset_token_expires_at = None
            user.save()
            
            return Response({
                'success': True,
                'message': 'Пароль успешно изменен. Теперь вы можете войти с новым паролем.'
            })
            
        except Exception as e:
            return Response(
                {'success': False, 'message': f'Ошибка при сбросе пароля: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

