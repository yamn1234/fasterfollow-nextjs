import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface PayPalButtonProps {
  amount: number;
  balanceAmount: number;
  userId: string;
  onSuccess: (capturedAmount: number) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: any) => {
        render: (element: HTMLElement) => Promise<void>;
        close: () => void;
      };
    };
    __paypalLoading?: Promise<boolean>;
  }
}

// Singleton loader - loads SDK once globally
const loadPayPalSDK = (): Promise<boolean> => {
  if (window.paypal) {
    return Promise.resolve(true);
  }
  
  if (window.__paypalLoading) {
    return window.__paypalLoading;
  }

  window.__paypalLoading = new Promise(async (resolve) => {
    try {
      const { data, error } = await supabase.functions.invoke('paypal-get-client-id');
      
      if (error || !data?.clientId) {
        console.error("Failed to get PayPal client ID:", error);
        resolve(false);
        return;
      }

      const script = document.createElement("script");
      script.src = `https://www.paypal.com/sdk/js?client-id=${data.clientId}&currency=USD&locale=ar_SA&enable-funding=card&disable-funding=paylater,credit`;
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => {
        console.error("Failed to load PayPal SDK");
        resolve(false);
      };
      document.body.appendChild(script);
    } catch (err) {
      console.error("Error loading PayPal:", err);
      resolve(false);
    }
  });

  return window.__paypalLoading;
};

// Export preload function for early loading
export const preloadPayPalSDK = () => {
  loadPayPalSDK();
};

const PayPalButton = ({ amount, balanceAmount, userId, onSuccess, onError, disabled }: PayPalButtonProps) => {
  const paypalRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [sdkReady, setSdkReady] = useState(!!window.paypal);
  const buttonsInstance = useRef<any>(null);

  // Load PayPal SDK once
  useEffect(() => {
    if (window.paypal) {
      setSdkReady(true);
      setLoading(false);
      return;
    }

    loadPayPalSDK().then((ready) => {
      setSdkReady(ready);
      setLoading(false);
    });
  }, []);

  // Render PayPal buttons
  useEffect(() => {
    if (!sdkReady || !window.paypal || !paypalRef.current || disabled || amount < 1) {
      return;
    }

    // Clear previous buttons
    if (buttonsInstance.current) {
      try {
        buttonsInstance.current.close();
      } catch (e) {
        // Ignore close errors
      }
    }
    paypalRef.current.innerHTML = '';

    buttonsInstance.current = window.paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'gold',
        shape: 'rect',
        label: 'paypal',
        height: 45,
      },
      
      // Create order
      createOrder: async () => {
        try {
          const { data, error } = await supabase.functions.invoke('paypal-create-order', {
            body: {
              amount, // Amount to charge
              balanceAmount, // Amount to add to balance
              userId,
            },
          });

          if (error) throw error;
          
          if (!data?.orderId) {
            throw new Error("لم يتم إنشاء الطلب");
          }

          return data.orderId;
        } catch (err: any) {
          console.error("Create order error:", err);
          onError(err.message || "حدث خطأ في إنشاء الطلب");
          throw err;
        }
      },

      // Capture order on approval
      onApprove: async (data: { orderID: string }) => {
        try {
          const { data: captureData, error } = await supabase.functions.invoke('paypal-capture-order', {
            body: {
              orderId: data.orderID,
              userId,
            },
          });

          if (error) throw error;

          if (captureData?.success) {
            onSuccess(captureData.capturedAmount);
          } else {
            throw new Error("فشل في إتمام الدفع");
          }
        } catch (err: any) {
          console.error("Capture error:", err);
          onError(err.message || "حدث خطأ في إتمام الدفع");
        }
      },

      // Handle cancel
      onCancel: () => {
        toast.info("تم إلغاء عملية الدفع");
      },

      // Handle error
      onError: (err: any) => {
        console.error("PayPal error:", err);
        onError("حدث خطأ في عملية الدفع");
      },
    });

    buttonsInstance.current.render(paypalRef.current);

    return () => {
      if (buttonsInstance.current) {
        try {
          buttonsInstance.current.close();
        } catch (e) {
          // Ignore close errors
        }
      }
    };
  }, [sdkReady, amount, balanceAmount, userId, disabled, onSuccess, onError]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="mr-2 text-muted-foreground">جاري تحميل PayPal...</span>
      </div>
    );
  }

  if (!sdkReady) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        فشل في تحميل PayPal. يرجى تحديث الصفحة.
      </div>
    );
  }

  return (
    <div 
      ref={paypalRef} 
      className={`paypal-button-container ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
    />
  );
};

export default PayPalButton;
