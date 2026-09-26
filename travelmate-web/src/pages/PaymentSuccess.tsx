/**
 * Payment Success Page
 * Toss Payments 결제 성공 후 리다이렉트 페이지
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { paymentService, PaymentResult } from '../services/paymentService';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const confirmPayment = async () => {
      const orderId = searchParams.get('orderId');
      const paymentKey = searchParams.get('paymentKey');
      const amount = searchParams.get('amount');

      if (!orderId || !paymentKey || !amount) {
        setError('결제 정보가 올바르지 않습니다.');
        setIsLoading(false);
        return;
      }

      try {
        const paymentResult = await paymentService.confirmPayment({
          orderId,
          paymentKey,
          amount: Number(amount),
        });
        setResult(paymentResult);
      } catch (err: unknown) {
        const e = err as { message?: string };
        setError(e.message || '결제 확인에 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    confirmPayment();
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand-100 dark:bg-[#0a0a0b]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-100 dark:border-primary-800 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600 dark:text-gray-400">결제를 확인하고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand-100 dark:bg-[#0a0a0b] px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">!</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink dark:text-white mb-2">
            결제 확인 실패
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/payment')}
              className="px-6 py-3 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors"
            >
              다시 시도
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-sand-200 dark:bg-gray-700 text-ink dark:text-gray-300 rounded-xl font-bold hover:bg-sand-300 dark:hover:bg-gray-600 transition-colors"
            >
              대시보드
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-sand-100 dark:bg-[#0a0a0b] px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">&#10003;</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink dark:text-white mb-2">
          결제 완료
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {result?.message || '결제가 성공적으로 완료되었습니다.'}
        </p>

        {result && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">주문번호</span>
              <span className="font-mono text-gray-900 dark:text-white">{result.orderId}</span>
            </div>
            {result.productName && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">상품</span>
                <span className="text-gray-900 dark:text-white">{result.productName}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">결제금액</span>
              <span className="font-bold text-success dark:text-green-400">
                {paymentService.formatCurrency(result.amount)}
              </span>
            </div>
            {result.paidAt && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">결제일시</span>
                <span className="text-gray-900 dark:text-white">
                  {paymentService.formatDateTime(result.paidAt)}
                </span>
              </div>
            )}
          </div>
        )}

        {result?.receiptUrl && (
          <a
            href={result.receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block mb-4 text-sm text-primary-500 dark:text-primary-400 hover:underline"
          >
            영수증 보기
          </a>
        )}

        <button
          onClick={() => navigate('/dashboard')}
          className="w-full px-6 py-3 bg-primary-500 hover:bg-primary-700 text-white rounded-xl font-bold transition-colors"
        >
          대시보드로 이동
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;
