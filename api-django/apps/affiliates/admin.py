from django.contrib import admin
from .models import Referral, ReferralPayout, ReferralCommission


@admin.register(Referral)
class ReferralAdmin(admin.ModelAdmin):
    list_display = ('referrer', 'referred_user', 'status', 'commission_rate', 'total_earned', 'paid_out', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('referrer__email', 'referred_user__email')
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'created_at'


@admin.register(ReferralPayout)
class ReferralPayoutAdmin(admin.ModelAdmin):
    list_display = ('id', 'referrer', 'amount', 'currency', 'status', 'payment_method', 'payment_ref', 'processed_at', 'created_at')
    list_filter = ('status', 'currency', 'created_at')
    search_fields = ('referrer__email', 'payment_ref', 'notes')
    readonly_fields = ('created_at', 'updated_at', 'processed_at')
    date_hierarchy = 'created_at'


@admin.register(ReferralCommission)
class ReferralCommissionAdmin(admin.ModelAdmin):
    list_display = ('id', 'referral', 'order', 'amount', 'commission_rate', 'commission_amount', 'status', 'payout', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('referral__referrer__email', 'order__order_id')
    readonly_fields = ('created_at',)
    date_hierarchy = 'created_at'

