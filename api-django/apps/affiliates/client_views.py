from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Sum, Count
from django.utils import timezone
from apps.users.models import User
from .models import Referral, ReferralPayout, ReferralCommission
from .serializers import ReferralSerializer, ReferralPayoutSerializer, ReferralCommissionSerializer


class ClientReferralsView(views.APIView):
    """Реферальная программа пользователя"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Статистика
        referrals = Referral.objects.filter(referrer=user).select_related('referred_user')
        total_referrals = referrals.count()
        active_referrals = referrals.filter(status='active').count()
        
        # Заработано
        total_earned = ReferralCommission.objects.filter(
            referral__referrer=user
        ).aggregate(total=Sum('commission_amount'))['total'] or 0
        
        # Выплачено
        total_paid = ReferralPayout.objects.filter(
            referrer=user,
            status='paid'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Доступно к выводу
        available_balance = float(total_earned) - float(total_paid)
        
        # Список рефералов
        referrals_list = referrals.order_by('-created_at')[:50]
        referrals_data = []
        for ref in referrals_list:
            # Рассчитываем сумму комиссий из ReferralCommission для этого реферала
            ref_total_earned = ReferralCommission.objects.filter(
                referral=ref
            ).aggregate(total=Sum('commission_amount'))['total'] or 0
            
            # Рассчитываем сумму выплаченных комиссий для этого реферала
            ref_paid_out = ReferralCommission.objects.filter(
                referral=ref,
                payout__status='paid'
            ).aggregate(total=Sum('commission_amount'))['total'] or 0
            
            referrals_data.append({
                'id': str(ref.id),
                'referred_user': {
                    'email': ref.referred_user.email,
                    'name': ref.referred_user.name,
                },
                'status': ref.status,
                'total_earned': float(ref_total_earned),
                'paid_out': float(ref_paid_out),
                'created_at': ref.created_at.isoformat() if ref.created_at else None,
            })
        
        # Реферальная ссылка
        referral_link = f"https://miniapp.expert/?ref={user.referral_code}"
        
        # Комиссия (берем из первого реферала или используем дефолтное значение 20%)
        # Если у пользователя есть рефералы, берем commission_rate из первого, иначе 20%
        commission_rate = 20.00
        if referrals.exists():
            first_referral = referrals.first()
            if first_referral.commission_rate:
                commission_rate = float(first_referral.commission_rate)
        # Если нет рефералов, можно использовать дефолтное значение или получить из настроек
        
        return Response({
            'success': True,
            'referral_link': referral_link,
            'commission_rate': commission_rate,
            'stats': {
                'total_referrals': total_referrals,
                'active_referrals': active_referrals,
                'total_earned': float(total_earned),
                'total_paid': float(total_paid),
                'available_balance': available_balance,
            },
            'referrals': referrals_data
        })


class ClientReferralPayoutsView(views.APIView):
    """История выплат пользователя"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        payouts = ReferralPayout.objects.filter(referrer=request.user).order_by('-created_at')
        serializer = ReferralPayoutSerializer(payouts, many=True)
        return Response({
            'success': True,
            'payouts': serializer.data
        })


class ClientRequestPayoutView(views.APIView):
    """Запрос на вывод средств"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        amount = request.data.get('amount')
        payment_method = request.data.get('payment_method', 'card')
        
        if not amount:
            return Response(
                {'success': False, 'message': 'Amount is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            amount = float(amount)
        except (ValueError, TypeError):
            return Response(
                {'success': False, 'message': 'Invalid amount'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = request.user
        
        # Проверить доступный баланс
        total_earned = ReferralCommission.objects.filter(
            referral__referrer=user
        ).aggregate(total=Sum('commission_amount'))['total'] or 0
        
        total_paid = ReferralPayout.objects.filter(
            referrer=user,
            status__in=['pending', 'processing', 'paid']
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        available_balance = float(total_earned) - float(total_paid)
        
        if amount > available_balance:
            return Response(
                {'success': False, 'message': 'Insufficient balance'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Создать заявку на вывод
        payout = ReferralPayout.objects.create(
            referrer=user,
            amount=amount,
            currency='RUB',
            status='pending',
            payment_method=payment_method,
            notes=f'Запрос на вывод через {payment_method}'
        )
        
        serializer = ReferralPayoutSerializer(payout)
        
        return Response({
            'success': True,
            'payout': serializer.data,
            'message': 'Payout request created'
        }, status=status.HTTP_201_CREATED)

