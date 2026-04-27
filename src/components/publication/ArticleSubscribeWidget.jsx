import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, CheckCircle, Loader2 } from "lucide-react";

export default function ArticleSubscribeWidget({ manuscript }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error | duplicate
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubscribe = async () => {
    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      // Check for duplicate
      const existing = await base44.entities.ArticleSubscription.filter({
        manuscript_id: manuscript.id,
        subscriber_email: email.trim().toLowerCase(),
      });
      if (existing.length > 0) {
        setStatus("duplicate");
        return;
      }
      await base44.entities.ArticleSubscription.create({
        manuscript_id: manuscript.id,
        manuscript_title: manuscript.title,
        subscriber_email: email.trim().toLowerCase(),
      });
      setStatus("success");
    } catch (e) {
      setErrorMsg("Failed to subscribe. Please try again.");
      setStatus("error");
    }
  };

  if (status === "success" || status === "duplicate") {
    return (
      <Card className="border-0 bg-emerald-50 border border-emerald-200 shadow">
        <CardContent className="p-5 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-800 text-sm">
              {status === "duplicate" ? "Already subscribed!" : "Subscribed!"}
            </p>
            <p className="text-emerald-700 text-xs mt-0.5">
              {status === "duplicate"
                ? `${email} is already receiving notifications for this article.`
                : `We'll email ${email} when this article receives new citations or comments.`}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-white shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-600" />
          Get Notified
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-slate-600">
          Subscribe to receive email alerts when this article gets a new citation or comment.
        </p>
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={e => { setEmail(e.target.value); setStatus("idle"); }}
          className="text-sm"
        />
        {status === "error" && (
          <p className="text-xs text-red-600">{errorMsg}</p>
        )}
        <Button
          onClick={handleSubscribe}
          disabled={status === "loading"}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm"
        >
          {status === "loading" ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Subscribing...</>
          ) : (
            <><Bell className="w-4 h-4 mr-2" />Subscribe to Updates</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}