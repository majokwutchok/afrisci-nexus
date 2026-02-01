import React, { useState } from "react";
import { Payment } from "@/entities/Payment";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CreditCard,
  Smartphone,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Globe,
  Phone
} from "lucide-react";

const paymentMethods = {
  mpesa: {
    name: "M-Pesa (Kenya)",
    icon: <Smartphone className="w-5 h-5" />,
    countries: ["Kenya"],
    color: "bg-green-100 text-green-800"
  },
  mtn_mobile_money: {
    name: "MTN Mobile Money",
    icon: <Smartphone className="w-5 h-5" />,
    countries: ["Uganda", "Ghana", "Rwanda", "Cameroon", "Ivory Coast"],
    color: "bg-yellow-100 text-yellow-800"
  },
  airtel_money: {
    name: "Airtel Money",
    icon: <Smartphone className="w-5 h-5" />,
    countries: ["Kenya", "Tanzania", "Uganda", "Rwanda", "Zambia", "Malawi"],
    color: "bg-red-100 text-red-800"
  },
  orange_money: {
    name: "Orange Money",
    icon: <Smartphone className="w-5 h-5" />,
    countries: ["Senegal", "Mali", "Burkina Faso", "Niger", "Guinea"],
    color: "bg-orange-100 text-orange-800"
  },
  vodacom_mpesa: {
    name: "Vodacom M-Pesa",
    icon: <Smartphone className="w-5 h-5" />,
    countries: ["Tanzania", "Mozambique", "Lesotho"],
    color: "bg-blue-100 text-blue-800"
  },
  tigo_pesa: {
    name: "Tigo Pesa",
    icon: <Smartphone className="w-5 h-5" />,
    countries: ["Tanzania"],
    color: "bg-purple-100 text-purple-800"
  },
  ecocash: {
    name: "EcoCash",
    icon: <Smartphone className="w-5 h-5" />,
    countries: ["Zimbabwe", "Lesotho"],
    color: "bg-green-100 text-green-800"
  },
  bank_transfer: {
    name: "Bank Transfer",
    icon: <CreditCard className="w-5 h-5" />,
    countries: ["All"],
    color: "bg-slate-100 text-slate-800"
  },
  credit_card: {
    name: "Credit/Debit Card",
    icon: <CreditCard className="w-5 h-5" />,
    countries: ["All"],
    color: "bg-blue-100 text-blue-800"
  },
  paypal: {
    name: "PayPal",
    icon: <Globe className="w-5 h-5" />,
    countries: ["All"],
    color: "bg-indigo-100 text-indigo-800"
  }
};

const currencyRates = {
  KES: 150, // Kenyan Shilling
  UGX: 3700, // Ugandan Shilling
  GHS: 12, // Ghanaian Cedi
  RWF: 1100, // Rwandan Franc
  XAF: 600, // Central African CFA Franc
  XOF: 600, // West African CFA Franc
  TZS: 2300, // Tanzanian Shilling
  ZMW: 18, // Zambian Kwacha
  MWK: 1030, // Malawian Kwacha
  MZN: 64, // Mozambican Metical
  LSL: 18, // Lesotho Loti
  ZWL: 322, // Zimbabwean Dollar
  NGN: 460, // Nigerian Naira
  ZAR: 18, // South African Rand
};

export default function PaymentModal({ isOpen, onClose, manuscript, journal, paymentType = "publication_fee" }) {
  const [selectedMethod, setSelectedMethod] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [userCountry, setUserCountry] = useState("Kenya");
  const [localCurrency, setLocalCurrency] = useState("KES");

  const baseAmount = journal?.publication_fee || 150; // Default $150 USD
  const localAmount = Math.round(baseAmount * (currencyRates[localCurrency] || 1));

  const availableMethods = Object.entries(paymentMethods).filter(([key, method]) => 
    method.countries.includes("All") || method.countries.includes(userCountry)
  );

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      // Create payment record
      await Payment.create({
        manuscript_id: manuscript.id,
        journal_id: journal.id,
        payment_type: paymentType,
        amount: baseAmount,
        currency: "USD",
        local_amount: localAmount,
        local_currency: localCurrency,
        payment_method: selectedMethod,
        phone_number: phoneNumber,
        country: userCountry,
        status: "pending"
      });

      // In a real app, integrate with actual payment providers
      // For now, simulate payment processing
      setTimeout(() => {
        setPaymentStatus("success");
        setIsProcessing(false);
      }, 3000);

    } catch (error) {
      console.error("Payment error:", error);
      setPaymentStatus("error");
      setIsProcessing(false);
    }
  };

  if (paymentStatus === "success") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Payment Successful!</h3>
            <p className="text-slate-600 mb-6">
              Your publication fee has been processed. Your article will be published within 48 hours.
            </p>
            <Button onClick={onClose} className="w-full">
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-600" />
            Publication Fee Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Summary */}
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-emerald-900">Publication Fee</span>
                <div className="text-right">
                  <div className="text-xl font-bold text-emerald-900">${baseAmount} USD</div>
                  <div className="text-sm text-emerald-700">
                    ≈ {localAmount.toLocaleString()} {localCurrency}
                  </div>
                </div>
              </div>
              <Separator className="my-3" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Journal:</span>
                  <span className="font-medium">{journal?.title}</span>
                </div>
                <div className="flex justify-between">
                  <span>Manuscript:</span>
                  <span className="font-medium truncate max-w-xs">{manuscript?.title}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Country Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Your Country</Label>
              <Select value={userCountry} onValueChange={(value) => {
                setUserCountry(value);
                // Auto-set currency based on country
                const currencyMap = {
                  "Kenya": "KES", "Uganda": "UGX", "Ghana": "GHS", "Rwanda": "RWF",
                  "Tanzania": "TZS", "Zambia": "ZMW", "Malawi": "MWK", "Zimbabwe": "ZWL",
                  "Nigeria": "NGN", "South Africa": "ZAR"
                };
                setLocalCurrency(currencyMap[value] || "USD");
              }}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(currencyRates).map(country => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Local Currency</Label>
              <Select value={localCurrency} onValueChange={setLocalCurrency}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(currencyRates).map(currency => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Payment Methods */}
          <div>
            <Label className="text-base font-semibold">Select Payment Method</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              {availableMethods.map(([key, method]) => (
                <div
                  key={key}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedMethod === key
                      ? 'border-emerald-300 bg-emerald-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => setSelectedMethod(key)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${method.color}`}>
                      {method.icon}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{method.name}</div>
                      <div className="text-xs text-slate-500">
                        {method.countries.includes("All") ? "Available globally" : method.countries.join(", ")}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Money Phone Number */}
          {selectedMethod && ["mpesa", "mtn_mobile_money", "airtel_money", "orange_money", "vodacom_mpesa", "tigo_pesa", "ecocash"].includes(selectedMethod) && (
            <div>
              <Label>Mobile Money Phone Number</Label>
              <div className="relative mt-2">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="+254 700 000 000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Enter the phone number registered with your mobile money account
              </p>
            </div>
          )}

          {/* Fee Waiver Notice */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Need financial assistance?</strong> Authors from low-income countries or early-career researchers may be eligible for fee waivers. 
              Contact our editorial team for more information.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={!selectedMethod || isProcessing || (["mpesa", "mtn_mobile_money", "airtel_money", "orange_money", "vodacom_mpesa", "tigo_pesa", "ecocash"].includes(selectedMethod) && !phoneNumber)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                `Pay ${localAmount.toLocaleString()} ${localCurrency}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}