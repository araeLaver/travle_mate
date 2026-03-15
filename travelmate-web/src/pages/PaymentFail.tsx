/**
 * Payment Fail Page
 * Toss Payments 결제 실패 후 리다이렉트 페이지
 */

import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const ERROR_MESSAGES: Record<string, string> = {
  PAY_PROCESS_CANCELED: '결제가 취소되었습니다.',
  PAY_PROCESS_ABORTED: '결제가 중단되었습니다.',
  REJECT_CARD_COMPANY: '카드사에서 결제를 거절했습니다. 다른 카드를 사용해주세요.',
  EXCEED_MAX_DAILY_PAYMENT_COUNT: '일일 결제 한도를 초과했습니다.',
  EXCEED_MAX_PAYMENT_AMOUNT: '결제 한도를 초과했습니다.',
  INVALID_CARD_EXPIRATION: '카드 유효기간이 올바르지 않습니다.',
  INVALID_STOPPED_CARD: '정지된 카드입니다.',
  INVALID_CARD_LOST: '분실 신고된 카드입니다.',
  NOT_SUPPORTED_INSTALLMENT_PLAN_CARD_OR_MERCHANT: '할부가 지원되지 않는 카드입니다.',
};

const PaymentFail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const errorCode = searchParams.get('code') || 'UNKNOWN';
  const errorMessage = searchParams.get('message') || ERROR_MESSAGES[errorCode] || '결제에 실패했습니다.';
  const orderId = searchParams.get('orderId');

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] dark:bg-[#0a0a0b] px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">&#10007;</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">결제 실패</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-4">{errorMessage}</p>

        {orderId && (
          <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mb-6">
            주문번호: {orderId}
          </p>
        )}

        <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
          오류 코드: {errorCode}
        </p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate('/payment')}
            className="px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
          >
            다시 시도
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            대시보드
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentFail;
